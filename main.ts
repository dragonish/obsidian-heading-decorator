import {
  App,
  Plugin,
  TFile,
  MarkdownView,
  PluginSettingTab,
  Setting,
  Editor,
  debounce,
} from "obsidian";
import { EditorView, ViewPlugin } from "@codemirror/view";
import type {
  HeadingPluginSettings,
  OpacityOptions,
  PostionOptions,
  OrderedCounterStyleType,
  HeadingPluginData,
  PluginDecoratorSettingsType,
} from "./common/data";
import {
  headingsSelector,
  orderedStyleTypeOptions,
  defaultHeadingDecoratorSettings,
  getUnorderedLevelHeadings,
  getOrderedCustomIdents,
} from "./common/data";
import { Counter, Querier } from "./common/counter";
import { Heading } from "./common/heading";
import { decorateHTMLElement, queryHeadingLevelByElement } from "./common/dom";
import {
  HeadingViewPlugin,
  headingDecorationsField,
  editorModeField,
  updateEditorMode,
} from "./components/view";

interface ObsidianEditor extends Editor {
  cm: EditorView;
}

const DEFAULT_SETTINGS: HeadingPluginSettings = {
  enabledInReading: true,
  readingSettings: defaultHeadingDecoratorSettings(),
  enabledInPreview: true,
  previewSettings: defaultHeadingDecoratorSettings(),
  enabledInSource: false,
  sourceSettings: defaultHeadingDecoratorSettings(),
};

export default class HeadingPlugin extends Plugin {
  settings: HeadingPluginSettings;

  async onload() {
    await this.loadSettings();

    // Register editor extension
    this.registerEditorExtension([
      headingDecorationsField,
      editorModeField,
      this.craeteHeadingViewPlugin(this.getPluginData.bind(this)),
    ]);

    // Register markdown post processor
    this.registerMarkdownPostProcessor(async (element, context) => {
      const {
        enabledInReading,
        readingSettings: {
          opacity,
          position,
          ordered,
          orderedDelimiter,
          orderedTrailingDelimiter,
          orderedStyleType,
          orderedSpecifiedString,
          orderedCustomIdents,
          orderedIgnoreSingle,
          orderedAllowZeroLevel,
          unorderedLevelHeadings,
        },
      } = this.settings;

      if (!enabledInReading) {
        return;
      }

      if (ordered) {
        const file = this.getActiveFile(context.sourcePath);
        if (!file) {
          return;
        }

        const sourceContent = await this.app.vault.cachedRead(file);
        const sourceArr = sourceContent.split("\n");
        if (sourceArr.length === 0) {
          return;
        }

        const headingElements = element.findAll(headingsSelector);
        if (headingElements.length === 0) {
          return;
        }

        let ignoreTopLevel = 0;
        if (orderedIgnoreSingle) {
          const queier = new Querier(orderedAllowZeroLevel);
          const heading = new Heading();
          for (let lineIndex = 1; lineIndex <= sourceArr.length; lineIndex++) {
            const lineText = sourceArr[lineIndex - 1];
            const nextLineIndex = lineIndex + 1;
            const nextLineText =
              nextLineIndex <= sourceArr.length
                ? sourceArr[nextLineIndex - 1]
                : "";
            const level = heading.handler(lineIndex, lineText, nextLineText);
            if (level === -1) {
              continue;
            }

            queier.handler(level);
          }

          ignoreTopLevel = queier.query();
        }

        const counter = new Counter({
          ordered: true,
          delimiter: orderedDelimiter,
          trailingDelimiter: orderedTrailingDelimiter,
          styleType: orderedStyleType,
          customIdents: getOrderedCustomIdents(orderedCustomIdents),
          specifiedString: orderedSpecifiedString,
          ignoreTopLevel,
          allowZeroLevel: orderedAllowZeroLevel,
        });
        const heading = new Heading();
        let headingIndex = 1;

        headingElements.forEach((headingElement) => {
          const sectionInfo = context.getSectionInfo(headingElement);
          if (!sectionInfo) {
            return;
          }

          const lineStart = sectionInfo.lineStart + 1;
          if (lineStart > sourceArr.length) {
            return;
          }

          for (
            let lineIndex = headingIndex;
            lineIndex <= lineStart;
            lineIndex++
          ) {
            const lineText = sourceArr[lineIndex - 1];
            const nextLineIndex = lineIndex + 1;
            const nextLineText =
              nextLineIndex <= sourceArr.length
                ? sourceArr[nextLineIndex - 1]
                : "";
            const level = heading.handler(lineIndex, lineText, nextLineText);
            if (lineIndex === lineStart) {
              const decortorContent = counter.decorator(level);
              decorateHTMLElement(
                headingElement,
                decortorContent,
                opacity,
                position
              );

              headingIndex = lineIndex + 1;
            } else {
              counter.handler(level);
            }
          }
        });
      } else {
        const headingElements = element.findAll(headingsSelector);
        if (headingElements.length === 0) {
          return;
        }

        const counter = new Counter({
          ordered: false,
          levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
        });

        headingElements.forEach((headingElement) => {
          const level = queryHeadingLevelByElement(headingElement);
          const decortorContent = counter.decorator(level);
          decorateHTMLElement(
            headingElement,
            decortorContent,
            opacity,
            position
          );
        });
      }
    });

    // Listen for metadata changes
    this.registerEvent(
      this.app.metadataCache.on(
        "changed",
        debounce(
          (file) => {
            //! Delay trigger rerender
            if (file && file.path === this.getActiveFile()?.path) {
              this.rerenderPreviewMarkdown(file);
            }
          },
          250,
          true
        )
      )
    );

    // Listen for editor mode changes
    this.registerEvent(
      this.app.workspace.on(
        "active-leaf-change",
        this.handleModeChange.bind(this)
      )
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", this.handleModeChange.bind(this))
    );

    this.addSettingTab(new HeadingSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    this.debouncedSaveSettings();
  }

  private craeteHeadingViewPlugin(
    getPluginData: () => Promise<HeadingPluginData>
  ) {
    return ViewPlugin.fromClass(
      class extends HeadingViewPlugin {
        constructor(view: EditorView) {
          super(view, getPluginData);
        }
      }
    );
  }

  private handleModeChange() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      //? "source" for editing view (Live Preview & Source mode),
      //? "preview" for reading view.
      const isLivePreview = view.getMode() === "source";

      //* Get CodeMirror editor instance
      const cmEditor = (view.editor as ObsidianEditor).cm;
      if (cmEditor) {
        cmEditor.dispatch({
          effects: updateEditorMode.of(isLivePreview),
        });
      }
    }
  }

  private debouncedSaveSettings = debounce(
    this.rerenderPreviewMarkdown.bind(this),
    1000,
    true
  );

  /**
   * Rerender Preview Markdown.
   * @param file
   */
  private rerenderPreviewMarkdown(file?: TFile) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      if (!file || file === view.file) {
        view.previewMode.rerender(true);
      }
    }
  }

  async getPluginData(): Promise<HeadingPluginData> {
    return {
      ...this.settings,
    };
  }

  private getActiveFile(sourcePath?: string) {
    if (sourcePath) {
      return this.app.vault.getFileByPath(sourcePath);
    } else {
      return this.app.workspace.getActiveFile();
    }
  }
}

class HeadingSettingTab extends PluginSettingTab {
  plugin: HeadingPlugin;

  constructor(app: App, plugin: HeadingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    //* enabledInReading
    new Setting(containerEl)
      .setName("Enabled in reading view")
      .setDesc("Decorate the heading under the reading view.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInReading)
          .onChange(async (value) => {
            this.plugin.settings.enabledInReading = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Manage reading view heading decorator")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("readingSettings");
        });
      });

    //* enabledInPreview
    new Setting(containerEl)
      .setName("Enabled in live preview")
      .setDesc("Decorate the heading under the live preview.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInPreview)
          .onChange(async (value) => {
            this.plugin.settings.enabledInPreview = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Manage live preview heading decorator")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("previewSettings");
        });
      });

    //* enabledInSource
    new Setting(containerEl)
      .setName("Enabled in source mode")
      .setDesc("Decorate the heading under the source mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInSource)
          .onChange(async (value) => {
            this.plugin.settings.enabledInSource = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Manage source mode heading decorator")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("sourceSettings");
        });
      });
  }

  private isOpacityValue(value: number): value is OpacityOptions {
    if (value >= 10 && value <= 100 && value % 10 === 0) {
      return true;
    }
    return false;
  }

  private isPositionValue(value: string): value is PostionOptions {
    return value === "before" || value === "after";
  }

  private manageHeadingDecoratorSettings(
    settingsType: PluginDecoratorSettingsType
  ) {
    const { containerEl } = this;

    containerEl.empty();

    let tabName = "";
    switch (settingsType) {
      case "readingSettings":
        tabName = "Manage reading view heading decorator";
        break;
      case "previewSettings":
        tabName = "Manage live preview heading decorator";
        break;
      case "sourceSettings":
        tabName = "Manage source mode heading decorator";
        break;
    }

    new Setting(containerEl)
      .setName(tabName)
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back").onClick(() => {
          this.display();
        });
      });

    new Setting(containerEl).setName("Effect").setHeading();

    //* ordered
    new Setting(containerEl)
      .setName("Ordered")
      .setDesc(
        "Toggle this setting to enable the decoration of headings as an ordered or unordered list."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].ordered)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].ordered = value;
            await this.plugin.saveSettings();
          })
      );

    //* opacity
    new Setting(containerEl)
      .setName("Opacity")
      .setDesc(
        "Set the opacity of the heading decorator. The value is the form of percentage."
      )
      .addSlider((slider) =>
        slider
          .setLimits(10, 100, 10)
          .setValue(this.plugin.settings[settingsType].opacity)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].opacity = this.isOpacityValue(
              value
            )
              ? value
              : 20;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
      );

    //* position
    new Setting(containerEl)
      .setName("Position")
      .setDesc("Set the position of the heading decorator.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("before", "Before the heading")
          .addOption("after", "After the heading")
          .setValue(this.plugin.settings[settingsType].position)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].position = this.isPositionValue(
              value
            )
              ? value
              : "before";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Ordered").setHeading();

    //* orderedStyleType
    new Setting(containerEl)
      .setName("Style type")
      .setDesc("Set the style type for ordered list.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(orderedStyleTypeOptions)
          .setValue(this.plugin.settings[settingsType].orderedStyleType)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedStyleType =
              value as OrderedCounterStyleType;
            await this.plugin.saveSettings();
          })
      );

    //* orderedDelimiter
    new Setting(containerEl)
      .setName("Delimiter")
      .setDesc("Set the delimiter for ordered list.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedDelimiter)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedTrailingDelimiter
    new Setting(containerEl)
      .setName("Trailing delimiter")
      .setDesc("Set whether to add a trailing delimiter for ordered list.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].orderedTrailingDelimiter)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedTrailingDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedCustomIdents
    new Setting(containerEl)
      .setName("Custom list styles")
      .setDesc(
        'For the "Custom list styles" option. Set custom list styles for ordered list. Use spaces to separate entries.'
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedCustomIdents)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedCustomIdents = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedSpecifiedString
    new Setting(containerEl)
      .setName("Specified string")
      .setDesc(
        'For the "Specified string" option. Set a specified string for ordered list.'
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedSpecifiedString)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedSpecifiedString = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedIgnoreSingle
    new Setting(containerEl)
      .setName("Ignore the single heading at the top-level")
      .setDesc(
        "If the top-level has only a single heading, exclude it when building an ordered list."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].orderedIgnoreSingle)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedIgnoreSingle = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedAllowZeroLevel
    new Setting(containerEl)
      .setName("Allow zero level")
      .setDesc(
        "If the next heading is more than one level higher, the omitted level is zero instead of one."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedAllowZeroLevel ?? false
          )
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedAllowZeroLevel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Unordered").setHeading();

    //* unorderedLevelHeadings
    new Setting(containerEl)
      .setName("Level headings")
      .setDesc(
        "Set the names for each level. The value is 6 entries separated by spaces."
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].unorderedLevelHeadings)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].unorderedLevelHeadings = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
