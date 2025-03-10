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
  HeadingTuple,
  OpacityOptions,
  PostionOptions,
  OrderedCounterStyleType,
  HeadingPluginData,
} from "./common/data";
import {
  headingsSelector,
  defaultHeadingTuple,
  orderedStyleTypeOptions,
} from "./common/data";
import { Counter } from "./common/counter";
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
  enabledInPreview: true,
  enabledInSource: false,
  opacity: 20,
  position: "before",
  ordered: true,
  orderedDelimiter: ".",
  orderedTrailingDelimiter: false,
  orderedStyleType: "decimal",
  orderedCustomIdents: "Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ",
  orderedSpecifiedString: "#",
  unorderedLevelHeadings: defaultHeadingTuple.join(" "),
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
    this.registerMarkdownPostProcessor((element, context) => {
      const {
        enabledInReading,
        opacity,
        position,
        ordered,
        orderedDelimiter,
        orderedTrailingDelimiter,
        orderedStyleType,
        orderedSpecifiedString,
      } = this.settings;

      if (!enabledInReading) {
        return;
      }

      if (ordered) {
        const file = this.getActiveFile(context.sourcePath);
        if (!file) {
          return;
        }

        const headings =
          this.app.metadataCache.getFileCache(file)?.headings || [];
        if (headings.length === 0) {
          return;
        }

        const headingElements = element.findAll(headingsSelector);
        if (headingElements.length === 0) {
          return;
        }

        const counter = new Counter({
          ordered: true,
          delimiter: orderedDelimiter,
          trailingDelimiter: orderedTrailingDelimiter,
          styleType: orderedStyleType,
          customIdents: this.getOrderedCustomIdents(),
          specifiedString: orderedSpecifiedString,
        });
        let headingIndex = 0;

        headingElements.forEach((headingElement) => {
          const sectionInfo = context.getSectionInfo(headingElement);
          if (!sectionInfo) {
            return;
          }

          const { lineStart } = sectionInfo;

          for (let i = headingIndex; i < headings.length; i++) {
            const lineIndex = headings[i].position.start.line;
            const level = headings[i].level;

            if (lineIndex === lineStart) {
              const decortorContent = counter.decorator(level, position);
              decorateHTMLElement(
                headingElement,
                decortorContent,
                opacity,
                position
              );

              headingIndex = i + 1;
              break;
            } else if (lineIndex > lineStart) {
              headingIndex = i;
              break;
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
          levelHeadings: this.getUnorderedLevelHeadings(),
        });

        headingElements.forEach((headingElement) => {
          const level = queryHeadingLevelByElement(headingElement);
          const decortorContent = counter.decorator(level, position);
          decorateHTMLElement(
            headingElement,
            decortorContent,
            opacity,
            position
          );
        });
      }
    });

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

  private getUnorderedLevelHeadings() {
    const arr = this.settings.unorderedLevelHeadings
      .split(/\s+/g)
      .filter((v) => v);
    if (arr.length > 6) {
      return arr.slice(0, 6) as HeadingTuple;
    }
    return defaultHeadingTuple;
  }

  private getOrderedCustomIdents() {
    return this.settings.orderedCustomIdents.split(/\s+/g).filter((v) => v);
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
    const data: HeadingPluginData = {
      ...this.settings,
      orderedCustomIdents: this.getOrderedCustomIdents(),
      unorderedLevelHeadings: this.getUnorderedLevelHeadings(),
      headingsCache: [],
    };

    const file = this.getActiveFile();
    if (file) {
      data.headingsCache =
        this.app.metadataCache.getFileCache(file)?.headings || [];
    }

    return data;
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

    new Setting(containerEl).setName("Enabled").setHeading();

    //* enabledInReading
    new Setting(containerEl)
      .setName("Enabled in Reading")
      .setDesc("Decorate the heading under the reading view.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInReading)
          .onChange(async (value) => {
            this.plugin.settings.enabledInReading = value;
            await this.plugin.saveSettings();
          })
      );

    //* enabledInPreview
    new Setting(containerEl)
      .setName("Enabled in Live Preview")
      .setDesc("Decorate the heading under the live preview.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInPreview)
          .onChange(async (value) => {
            this.plugin.settings.enabledInPreview = value;
            await this.plugin.saveSettings();
          })
      );

    //* enabledInSource
    new Setting(containerEl)
      .setName("Enabled in Source mode")
      .setDesc("Decorate the heading under the source mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInSource)
          .onChange(async (value) => {
            this.plugin.settings.enabledInSource = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Effect").setHeading();

    //* ordered
    new Setting(containerEl)
      .setName("Ordered")
      .setDesc("Decorate the heading as ordered list.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ordered)
          .onChange(async (value) => {
            this.plugin.settings.ordered = value;
            await this.plugin.saveSettings();
          })
      );

    //* opacity
    new Setting(containerEl)
      .setName("Opacity")
      .setDesc("Set the opacity of the heading decorator.")
      .addSlider((slider) =>
        slider
          .setLimits(10, 100, 10)
          .setValue(this.plugin.settings.opacity)
          .onChange(async (value) => {
            this.plugin.settings.opacity = this.isOpacityValue(value)
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
          .setValue(this.plugin.settings.position)
          .onChange(async (value) => {
            this.plugin.settings.position = this.isPositionValue(value)
              ? value
              : "before";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Ordered").setHeading();

    //* orderedStyleType
    new Setting(containerEl)
      .setName("Ordered style type")
      .setDesc("Set the style type for ordered headings.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(orderedStyleTypeOptions)
          .setValue(this.plugin.settings.orderedStyleType)
          .onChange(async (value) => {
            this.plugin.settings.orderedStyleType =
              value as OrderedCounterStyleType;
            await this.plugin.saveSettings();
          })
      );

    //* orderedDelimiter
    new Setting(containerEl)
      .setName("Ordered delimiter")
      .setDesc("Set the delimiter for ordered headings.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.orderedDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.orderedDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedTrailingDelimiter
    new Setting(containerEl)
      .setName("Ordered trailing delimiter")
      .setDesc("Set whether to add a trailing delimiter for ordered headings.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.orderedTrailingDelimiter)
          .onChange(async (value) => {
            this.plugin.settings.orderedTrailingDelimiter = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedCustomIdents
    new Setting(containerEl)
      .setName("Ordered custom list styles")
      .setDesc(
        'For the "Custom list styles" option. Set custom list styles for ordered headings. Use spaces to separate entries.'
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.orderedCustomIdents)
          .onChange(async (value) => {
            this.plugin.settings.orderedCustomIdents = value;
            await this.plugin.saveSettings();
          })
      );

    //* orderedSpecifiedString
    new Setting(containerEl)
      .setName("Ordered specified string")
      .setDesc(
        'For the "Specified string" option. Set a specified string for ordered headings.'
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.orderedSpecifiedString)
          .onChange(async (value) => {
            this.plugin.settings.orderedSpecifiedString = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName("Unordered").setHeading();

    //* unorderedLevelHeadings
    new Setting(containerEl)
      .setName("Unordered level headings")
      .setDesc(
        "set level headings for unordered headings. 6 entries separated by spaces."
      )
      .addText((text) =>
        text
          .setValue(this.plugin.settings.unorderedLevelHeadings)
          .onChange(async (value) => {
            this.plugin.settings.unorderedLevelHeadings = value;
            await this.plugin.saveSettings();
          })
      );
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
}
