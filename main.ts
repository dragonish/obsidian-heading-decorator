import {
  App,
  Plugin,
  TFile,
  MarkdownView,
  PluginSettingTab,
  Setting,
  Editor,
  WorkspaceLeaf,
  debounce,
} from "obsidian";
import { EditorView, ViewPlugin } from "@codemirror/view";
import type {
  HeadingPluginSettings,
  OrderedCounterStyleType,
  HeadingPluginData,
} from "./common/data";
import {
  headingsSelector,
  orderedStyleTypeOptions,
  defaultHeadingDecoratorSettings,
  getUnorderedLevelHeadings,
  getOrderedCustomIdents,
  diffLevel,
} from "./common/data";
import { Counter, Querier } from "./common/counter";
import { Heading } from "./common/heading";
import {
  decorateHTMLElement,
  decorateOutlineElement,
  queryHeadingLevelByElement,
  getTreeItemLevel,
  getTreeItemText,
  compareHeadingText,
} from "./common/dom";
import {
  HeadingViewPlugin,
  headingDecorationsField,
  editorModeField,
  updateEditorMode,
} from "./components/view";
import { OutlineChildComponent } from "./components/outline";

interface ObsidianEditor extends Editor {
  cm: EditorView;
}

interface ObsidianWorkspaceLeaf extends WorkspaceLeaf {
  id: string;
}

const DEFAULT_SETTINGS: HeadingPluginSettings = {
  enabledInReading: true,
  readingSettings: defaultHeadingDecoratorSettings(),
  enabledInPreview: true,
  previewSettings: defaultHeadingDecoratorSettings(),
  enabledInSource: false,
  sourceSettings: defaultHeadingDecoratorSettings(),
  enabledInOutline: false,
  outlineSettings: defaultHeadingDecoratorSettings(),
};

export default class HeadingPlugin extends Plugin {
  settings: HeadingPluginSettings;

  private outlineIdSet: Set<string> = new Set();
  private outlineComponents: OutlineChildComponent[] = [];

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
      if (!this.settings.enabledInReading) {
        return;
      }

      const headingElements = element.findAll(headingsSelector);
      if (headingElements.length === 0) {
        return;
      }

      const {
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
          orderedBasedOnExisting,
          orderedAllowZeroLevel,
          unorderedLevelHeadings,
        },
      } = this.settings;

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

        let ignoreTopLevel = 0;
        if (orderedIgnoreSingle || orderedBasedOnExisting) {
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

            ignoreTopLevel = queier.query(orderedIgnoreSingle);
            if (ignoreTopLevel === 0) {
              break;
            }
          }
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
              //? 1. When using the page preview feature to only reference fragments, the
              //? relative position of rows is incorrect.
              //? 2. In the split editing scenario, there may be a delay in the information
              //? on the reading tab.
              const elementLevel = queryHeadingLevelByElement(headingElement);
              if (elementLevel === level) {
                const decoratorContent = counter.decorator(level);
                decorateHTMLElement(
                  headingElement,
                  decoratorContent,
                  opacity,
                  position
                );
              }

              headingIndex = lineIndex + 1;
            } else {
              counter.handler(level);
            }
          }
        });
      } else {
        const counter = new Counter({
          ordered: false,
          levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
        });

        headingElements.forEach((headingElement) => {
          const level = queryHeadingLevelByElement(headingElement);
          const decoratorContent = counter.decorator(level);
          decorateHTMLElement(
            headingElement,
            decoratorContent,
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
      this.app.workspace.on("active-leaf-change", () => {
        this.handleModeChange();
        this.loadOutlineComponents();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.handleModeChange();
        this.loadOutlineComponents();
      })
    );

    this.loadOutlineComponents();

    this.addSettingTab(new HeadingSettingTab(this.app, this));
  }

  onunload(): void {
    this.unloadOutlineComponents();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(outlineState?: boolean) {
    await this.saveData(this.settings);

    if (outlineState != undefined) {
      if (outlineState) {
        this.loadOutlineComponents();
      } else {
        this.unloadOutlineComponents();
      }
    }

    this.debouncedSaveSettings();
  }

  private loadOutlineComponents() {
    if (this.settings.enabledInOutline) {
      this.handleOutline();
    }
  }

  private unloadOutlineComponents() {
    this.outlineComponents.forEach((child) => child.detach());
    this.outlineComponents = [];
    this.outlineIdSet.clear();
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

  private handleOutline() {
    const leaves = this.app.workspace.getLeavesOfType("outline");
    leaves.forEach((leaf: ObsidianWorkspaceLeaf) => {
      const leafId = leaf.id;
      if (!leafId || this.outlineIdSet.has(leafId)) {
        return;
      }

      const view = leaf.view;
      const viewContent = view.containerEl.querySelector<HTMLElement>(
        '[data-type="outline"] .view-content'
      );
      if (!viewContent) {
        return;
      }

      this.outlineIdSet.add(leafId);
      const oc = new OutlineChildComponent(leafId, view, viewContent, () => {
        const headingElements =
          viewContent.querySelectorAll<HTMLElement>(".tree-item");
        if (headingElements.length === 0) {
          return;
        }

        const {
          opacity,
          position,
          ordered,
          orderedDelimiter,
          orderedTrailingDelimiter,
          orderedStyleType,
          orderedSpecifiedString,
          orderedCustomIdents,
          orderedIgnoreSingle,
          orderedBasedOnExisting,
          orderedAllowZeroLevel,
          unorderedLevelHeadings,
        } = this.settings.outlineSettings;

        let fromFile = false;
        const state = view.getState();
        if (typeof state.file === "string") {
          const file = this.app.vault.getFileByPath(state.file);
          if (file) {
            const cacheHeadings =
              this.app.metadataCache.getFileCache(file)?.headings || [];

            let ignoreTopLevel = 0;
            if (ordered && (orderedIgnoreSingle || orderedBasedOnExisting)) {
              const queier = new Querier(orderedAllowZeroLevel);
              for (const cacheHeading of cacheHeadings) {
                queier.handler(cacheHeading.level);
                ignoreTopLevel = queier.query(orderedIgnoreSingle);
                if (ignoreTopLevel === 0) {
                  break;
                }
              }
            }

            const counter = new Counter({
              ordered,
              delimiter: orderedDelimiter,
              trailingDelimiter: orderedTrailingDelimiter,
              styleType: orderedStyleType,
              customIdents: getOrderedCustomIdents(orderedCustomIdents),
              specifiedString: orderedSpecifiedString,
              ignoreTopLevel,
              allowZeroLevel: orderedAllowZeroLevel,
              levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
            });

            let lastCacheLevel = 0;
            let lastReadLevel = 0;
            for (
              let i = 0, j = 0;
              i < headingElements.length && j < cacheHeadings.length;
              i++, j++
            ) {
              const readLevel = getTreeItemLevel(headingElements[i]);
              const readText = getTreeItemText(headingElements[i]);
              let cacheLevel = cacheHeadings[j].level;
              if (i > 0) {
                const diff = diffLevel(readLevel, lastReadLevel);
                while (
                  j < cacheHeadings.length - 1 &&
                  (diffLevel(cacheLevel, lastCacheLevel) !== diff ||
                    !compareHeadingText(cacheHeadings[j].heading, readText))
                ) {
                  counter.handler(cacheLevel);
                  j++;
                  cacheLevel = cacheHeadings[j].level;
                }
              }

              const decoratorContent = counter.decorator(cacheLevel);
              decorateOutlineElement(
                headingElements[i],
                decoratorContent,
                opacity,
                position
              );

              lastCacheLevel = cacheLevel;
              lastReadLevel = readLevel;
            }

            fromFile = true;
          }
        }

        if (!fromFile) {
          if (ordered) {
            let ignoreTopLevel = 0;
            if (orderedIgnoreSingle || orderedBasedOnExisting) {
              const queier = new Querier();
              for (let i = 0; i < headingElements.length; i++) {
                const element = headingElements[i];
                const level = getTreeItemLevel(element);
                queier.handler(level);
                ignoreTopLevel = queier.query(orderedIgnoreSingle);
                if (ignoreTopLevel === 0) {
                  break;
                }
              }
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

            headingElements.forEach((headingElement) => {
              const level = getTreeItemLevel(headingElement);
              const decoratorContent = counter.decorator(level);
              decorateOutlineElement(
                headingElement,
                decoratorContent,
                opacity,
                position
              );
            });
          } else {
            const counter = new Counter({
              ordered: false,
              levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
            });

            headingElements.forEach((headingElement) => {
              const level = getTreeItemLevel(headingElement);
              const decoratorContent = counter.decorator(level);
              decorateOutlineElement(
                headingElement,
                decoratorContent,
                opacity,
                position
              );
            });
          }
        }
      });
      this.outlineComponents.push(oc);
      view.addChild(oc);
      view.register(() => {
        this.outlineComponents = this.outlineComponents.filter(
          (item) => !item.equal(leafId)
        );
      });
    });
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

    //* enabledInOutline
    new Setting(containerEl)
      .setName("Enabled in outline plugin")
      .setDesc("Decorate the heading under the outline plugin.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInOutline)
          .onChange(async (value) => {
            this.plugin.settings.enabledInOutline = value;
            await this.plugin.saveSettings(
              this.plugin.settings.enabledInOutline
            );
          })
      );

    new Setting(containerEl)
      .setName("Manage outline plugin heading decorator")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("outlineSettings");
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
      case "outlineSettings":
        tabName = "Manage outline plugin heading decorator";
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

    //* orderedBasedOnExisting
    new Setting(containerEl)
      .setName("Based on the existing highest level")
      .setDesc(
        "Use the highest level of headings in the note as the base for ordered list."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedBasedOnExisting ?? false
          )
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedBasedOnExisting = value;
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
