import {
  App,
  Editor,
  FrontMatterCache,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
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
  getBoolean,
  checkEnabledCss,
  stringToRegex,
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
import { FolderSuggest } from "./components/suggest";

interface ObsidianEditor extends Editor {
  cm: EditorView;
}

interface ObsidianWorkspaceLeaf extends WorkspaceLeaf {
  id: string;
}

const DEFAULT_SETTINGS: HeadingPluginSettings = {
  metadataKeyword: "heading",
  fileRegexBlacklist: [],
  folderBlacklist: [],
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

      const metadataEnabled = this.getEnabledFromFrontmatter(
        "reading",
        context.frontmatter
      );

      if (metadataEnabled == null) {
        if (
          this.settings.readingSettings.enabledInEachNote != undefined &&
          !this.settings.readingSettings.enabledInEachNote
        ) {
          return;
        }

        if (this.getEnabledFromBlacklist(context.sourcePath)) {
          return;
        }
      } else if (!metadataEnabled) {
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
          orderedIgnoreMaximum = 6,
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

            ignoreTopLevel = queier.query(
              orderedIgnoreSingle,
              orderedIgnoreMaximum
            );
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
          enabledInEachNote,
          opacity,
          position,
          ordered,
          orderedDelimiter,
          orderedTrailingDelimiter,
          orderedStyleType,
          orderedSpecifiedString,
          orderedCustomIdents,
          orderedIgnoreSingle,
          orderedIgnoreMaximum = 6,
          orderedBasedOnExisting,
          orderedAllowZeroLevel,
          unorderedLevelHeadings,
        } = this.settings.outlineSettings;

        const state = view.getState();
        if (typeof state.file !== "string") {
          return;
        }

        const file = this.app.vault.getFileByPath(state.file);
        if (!file) {
          return;
        }

        const fileCache = this.app.metadataCache.getFileCache(file);
        if (!fileCache) {
          return;
        }

        const cacheHeadings = fileCache.headings || [];
        if (cacheHeadings.length === 0) {
          return;
        }

        const frontmatter = fileCache.frontmatter;
        const metadataEnabled = this.getEnabledFromFrontmatter(
          "outline",
          frontmatter
        );

        if (metadataEnabled == null) {
          if (enabledInEachNote != undefined && !enabledInEachNote) {
            return;
          }

          if (this.getEnabledFromBlacklist(state.file)) {
            return;
          }
        } else if (!metadataEnabled) {
          return;
        }

        let ignoreTopLevel = 0;
        if (ordered && (orderedIgnoreSingle || orderedBasedOnExisting)) {
          const queier = new Querier(orderedAllowZeroLevel);
          for (const cacheHeading of cacheHeadings) {
            queier.handler(cacheHeading.level);
            ignoreTopLevel = queier.query(
              orderedIgnoreSingle,
              orderedIgnoreMaximum
            );
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
    const {
      metadataKeyword,
      enabledInPreview: _enabledInPreview,
      enabledInSource: _enabledInSource,
      previewSettings,
      sourceSettings,
    } = this.settings;

    let enabledInPreview = _enabledInPreview;
    let enabledInSource = _enabledInSource;

    if (metadataKeyword) {
      const file = this.getActiveFile();
      if (file) {
        const frontmatter =
          this.app.metadataCache.getFileCache(file)?.frontmatter;

        if (_enabledInPreview) {
          enabledInPreview =
            this.getEnabledFromFrontmatter("preview", frontmatter) ??
            previewSettings.enabledInEachNote ??
            !this.getEnabledFromBlacklist(file.path);
        }

        if (_enabledInSource) {
          enabledInSource =
            this.getEnabledFromFrontmatter("source", frontmatter) ??
            sourceSettings.enabledInEachNote ??
            !this.getEnabledFromBlacklist(file.path);
        }
      }
    }

    return {
      enabledInPreview,
      enabledInSource,
      previewSettings,
      sourceSettings,
    };
  }

  private getActiveFile(sourcePath?: string) {
    if (sourcePath) {
      return this.app.vault.getFileByPath(sourcePath);
    } else {
      return this.app.workspace.getActiveFile();
    }
  }

  private getEnabledFromFrontmatter(
    mode: HeadingMetadataSettingsType,
    frontmatter?: FrontMatterCache
  ): null | boolean {
    const keyword = this.settings.metadataKeyword;
    if (keyword && typeof frontmatter === "object" && frontmatter) {
      const metadataSettings = frontmatter[keyword];
      if (typeof metadataSettings === "object" && metadataSettings) {
        return (
          getBoolean(metadataSettings[mode]) ?? getBoolean(metadataSettings.all)
        );
      }
      if (metadataSettings != null) {
        return getBoolean(metadataSettings);
      } else {
        const cssclasses = frontmatter.cssclasses;
        if (Array.isArray(cssclasses)) {
          for (const cssItem of cssclasses) {
            if (typeof cssItem === "string") {
              const s = checkEnabledCss(cssItem, mode);
              if (s != null) {
                return s;
              }
            }
          }
        } else if (typeof cssclasses === "string") {
          return checkEnabledCss(cssclasses, mode);
        }
      }
    }

    return null;
  }

  private getEnabledFromBlacklist(filepath: string): boolean {
    for (const folder of this.settings.folderBlacklist) {
      if (filepath.startsWith(`${folder}/`)) {
        return true;
      }
    }

    const filename = filepath.substring(
      filepath.lastIndexOf("/") + 1,
      filepath.lastIndexOf(".")
    );
    for (const regexStr of this.settings.fileRegexBlacklist) {
      const regex = stringToRegex(regexStr);
      if (regex) {
        if (regex.test(filename)) {
          return true;
        }
      }
    }

    return false;
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

    //* metadataKeyword
    const metadataKeywordSetting = new Setting(containerEl)
      .setName("Metadata keyword")
      .addText((text) =>
        text
          .setPlaceholder("Enter the keyword")
          .setValue(this.plugin.settings.metadataKeyword)
          .onChange(async (value) => {
            this.plugin.settings.metadataKeyword = value.trim();
            await this.plugin.saveSettings();
          })
      );

    const metadataKeywordDesc = document.createDocumentFragment();
    metadataKeywordDesc.append(
      "The key name that reads the enabled status from the ",
      createEl("a", {
        href: "https://help.obsidian.md/Editing+and+formatting/Properties",
        text: "properties",
      }),
      "."
    );
    metadataKeywordSetting.descEl.appendChild(metadataKeywordDesc);

    new Setting(containerEl).setName("Reading view").setHeading();

    //* enabledInReading
    new Setting(containerEl)
      .setName("Enabled in reading view")
      .setDesc("Allow to decorate the heading under the reading view.")
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

    new Setting(containerEl).setName("Live preview").setHeading();

    //* enabledInPreview
    new Setting(containerEl)
      .setName("Enabled in live preview")
      .setDesc("Allow to decorate the heading under the live preview.")
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

    new Setting(containerEl).setName("Source mode").setHeading();

    //* enabledInSource
    new Setting(containerEl)
      .setName("Enabled in source mode")
      .setDesc("Allow to decorate the heading under the source mode.")
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

    new Setting(containerEl).setName("Outline plugin").setHeading();

    //* enabledInOutline
    new Setting(containerEl)
      .setName("Enabled in outline plugin")
      .setDesc("Allow to decorate the heading under the outline plugin.")
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

    new Setting(containerEl).setName("Blacklist").setHeading();

    //* folderBlacklist
    new Setting(containerEl)
      .setName("Manage folder blacklist")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageFolderBlacklist();
        });
      });

    //* fileRegexBlacklist
    new Setting(containerEl)
      .setName("Manage note name regex blacklist")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageFileRegexBlacklist();
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
    return ["before", "after", "before-inside", "after-inside"].includes(value);
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

    //* enabledInEachNote
    new Setting(containerEl)
      .setName("Enabled in each note")
      .setDesc(
        "Toggle this setting to enable the decoration of headings in each note."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].enabledInEachNote ?? true
          )
          .onChange(async (value) => {
            this.plugin.settings[settingsType].enabledInEachNote = value;
            await this.plugin.saveSettings();
          })
      );

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
      .addDropdown((dropdown) => {
        const options: Record<string, string> =
          settingsType === "outlineSettings"
            ? {
                before: "Before the heading",
                after: "After the heading",
              }
            : {
                before: "Before the heading",
                "before-inside": "Before the heading (inside)",
                after: "After the heading",
                "after-inside": "After the heading (inside)",
              };

        dropdown
          .addOptions(options)
          .setValue(this.plugin.settings[settingsType].position)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].position = this.isPositionValue(
              value
            )
              ? value
              : "before";
            await this.plugin.saveSettings();
          });
      });

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

    //* orderedIgnoreMaximum
    new Setting(containerEl)
      .setName("The maximum number of ignored")
      .setDesc(
        "For enabled: Ignore the single heading at the top-level. The maximum number of ignored headings at the top-level."
      )
      .addSlider((slider) =>
        slider
          .setLimits(1, 6, 1)
          .setValue(
            this.plugin.settings[settingsType].orderedIgnoreMaximum ?? 6
          )
          .onChange(async (value) => {
            this.plugin.settings[settingsType].orderedIgnoreMaximum = value;
            await this.plugin.saveSettings();
          })
          .setDynamicTooltip()
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

  private manageFolderBlacklist() {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Manage folder blacklist")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back").onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(`Folder balcklist ${index + 1}`)
        .addText((text) => {
          text.setValue(folder).onChange(async (value) => {
            this.plugin.settings.folderBlacklist[index] = value;
            await this.plugin.saveSettings();
          });

          const suggest = new FolderSuggest(this.app, text.inputEl);
          suggest.onSelect(async (value) => {
            text.setValue(value);
            this.plugin.settings.folderBlacklist[index] = value;
            suggest.close();
            await this.plugin.saveSettings();
          });
        })
        .addButton((button) => {
          button
            .setButtonText("Delete")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.folderBlacklist.splice(index, 1);
              await this.plugin.saveSettings();
              this.manageFolderBlacklist();
            });
        });
    });

    new Setting(containerEl).addButton((button) => {
      button
        .setButtonText("Add")
        .setCta()
        .setTooltip("Add a new folder to the blacklist")
        .onClick(async () => {
          this.plugin.settings.folderBlacklist.push("");
          await this.plugin.saveSettings();
          this.manageFolderBlacklist();
        });
    });
  }

  private manageFileRegexBlacklist() {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Manage note name regex blacklist")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back").onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.fileRegexBlacklist.forEach((regex, index) => {
      new Setting(containerEl)
        .setName(`Note name regex blacklist ${index + 1}`)
        .addText((text) =>
          text
            .setPlaceholder("e.g., /^daily.*/i")
            .setValue(regex)
            .onChange(async (value) => {
              this.plugin.settings.fileRegexBlacklist[index] = value.trim();
              await this.plugin.saveSettings();
            })
        )
        .addButton((button) => {
          button
            .setButtonText("Delete")
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.fileRegexBlacklist.splice(index, 1);
              await this.plugin.saveSettings();
              this.manageFileRegexBlacklist();
            });
        });
    });

    new Setting(containerEl).addButton((button) => {
      button
        .setButtonText("Add")
        .setCta()
        .setTooltip("Add a new note name regex blacklist")
        .onClick(async () => {
          this.plugin.settings.fileRegexBlacklist.push("");
          await this.plugin.saveSettings();
          this.manageFileRegexBlacklist();
        });
    });
  }
}
