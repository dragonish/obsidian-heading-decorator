import {
  Editor,
  FrontMatterCache,
  MarkdownView,
  Plugin,
  TFile,
  WorkspaceLeaf,
  debounce,
} from "obsidian";
import { EditorView, ViewPlugin } from "@codemirror/view";
import type { HeadingPluginSettings, HeadingPluginData } from "../common/data";
import {
  headingsSelector,
  getUnorderedLevelHeadings,
  getOrderedCustomIdents,
  diffLevel,
  getBoolean,
  checkEnabledCSS,
  stringToRegex,
  defalutSettings,
} from "../common/data";
import { Counter, Querier } from "../common/counter";
import { Heading } from "../common/heading";
import {
  decorateHTMLElement,
  decorateOutlineElement,
  cancelOutlineDecorator,
  decorateFileHeadingElement,
  cancelFileHeadingDecorator,
  queryHeadingLevelByElement,
  getTreeItemLevel,
  getTreeItemText,
  getFileHeadingItemLevel,
  compareHeadingText,
} from "../common/dom";
import {
  HeadingViewPlugin,
  headingDecorationsField,
  editorModeField,
  updateEditorMode,
} from "./view";
import { ViewChildComponent } from "./child";
import {
  quietOutlineHandler,
  cancelQuietOutlineDecoration,
} from "./quiet-outline";
import { HeadingSettingTab } from "./setting-tab";

interface ObsidianEditor extends Editor {
  cm: EditorView;
}

interface ObsidianWorkspaceLeaf extends WorkspaceLeaf {
  id: string;
}

interface SettingsChangeState {
  outline?: boolean;
  quietOutline?: boolean;
  fileExplorer?: boolean;
}

export class HeadingPlugin extends Plugin {
  settings: HeadingPluginSettings;

  private outlineIdSet: Set<string> = new Set();
  private outlineComponents: ViewChildComponent[] = [];

  private quietOutlineIdSet: Set<string> = new Set();
  private quietOutlineComponents: ViewChildComponent[] = [];

  private fileExplorerIdSet: Set<string> = new Set();
  private fileExplorerComponents: ViewChildComponent[] = [];

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
        this.loadQuietOutlineComponents();
        this.loadFileExplorerComponents();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.handleModeChange();
        this.loadOutlineComponents();
        this.loadQuietOutlineComponents();
        this.loadFileExplorerComponents();
      })
    );

    this.loadOutlineComponents();
    this.loadQuietOutlineComponents();
    this.loadFileExplorerComponents();

    this.addSettingTab(new HeadingSettingTab(this.app, this));
  }

  onunload(): void {
    this.unloadOutlineComponents();
    this.unloadQuietOutlineComponents();
    this.unloadFileExplorerComponents();
  }

  async loadSettings() {
    this.settings = Object.assign({}, defalutSettings(), await this.loadData());
  }

  async saveSettings(state?: SettingsChangeState) {
    await this.saveData(this.settings);

    if (state) {
      if (state.outline != undefined) {
        if (state.outline) {
          this.loadOutlineComponents();
        } else {
          this.unloadOutlineComponents();
        }
      }

      if (state.quietOutline != undefined) {
        if (state.quietOutline) {
          this.loadQuietOutlineComponents();
        } else {
          this.unloadQuietOutlineComponents();
        }
      }

      if (state.fileExplorer != undefined) {
        if (state.fileExplorer) {
          this.loadFileExplorerComponents();
        } else {
          this.unloadFileExplorerComponents();
        }
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

  private loadQuietOutlineComponents() {
    if (this.settings.enabledInQuietOutline) {
      this.handleQuietOutline();
    }
  }

  private unloadQuietOutlineComponents() {
    this.quietOutlineComponents.forEach((child) => child.detach());
    this.quietOutlineComponents = [];
    this.quietOutlineIdSet.clear();
  }

  private loadFileExplorerComponents() {
    if (this.settings.enabledInFileExplorer) {
      this.handleHeadingsInExplorer();
    }
  }

  private unloadFileExplorerComponents() {
    this.fileExplorerComponents.forEach((child) => child.detach());
    this.fileExplorerComponents = [];
    this.fileExplorerIdSet.clear();
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

      const vc = new ViewChildComponent(
        leafId,
        view,
        viewContent,
        () => {
          const headingElements =
            viewContent.querySelectorAll<HTMLElement>(".tree-item");
          if (headingElements.length === 0) {
            return;
          }

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
        },
        () => {
          const headingElements =
            viewContent.querySelectorAll<HTMLElement>(".tree-item");
          headingElements.forEach((ele) => {
            cancelOutlineDecorator(ele);
          });
        }
      );

      this.outlineComponents.push(vc);
      view.addChild(vc);
      view.register(() => {
        this.outlineComponents = this.outlineComponents.filter(
          (item) => !item.equal(leafId)
        );
      });
    });
  }

  private handleQuietOutline() {
    const leaves = this.app.workspace.getLeavesOfType("quiet-outline");
    leaves.forEach((leaf: ObsidianWorkspaceLeaf) => {
      const leafId = leaf.id;
      if (!leafId || this.quietOutlineIdSet.has(leafId)) {
        return;
      }

      const view = leaf.view;
      const viewContent = view.containerEl.querySelector<HTMLElement>(
        '[data-type="quiet-outline"] .view-content'
      );
      if (!viewContent) {
        return;
      }

      this.quietOutlineIdSet.add(leafId);

      const vc = new ViewChildComponent(
        leafId,
        view,
        viewContent,
        () => {
          const containerElement =
            viewContent.querySelector<HTMLElement>(".n-tree");
          if (!containerElement) {
            return;
          }

          const headingELements =
            viewContent.querySelectorAll<HTMLElement>(".n-tree-node");
          if (headingELements.length === 0) {
            return;
          }

          const file = this.getActiveFile();
          if (!file) {
            return;
          }

          const fileCache = this.app.metadataCache.getFileCache(file);
          if (!fileCache) {
            return;
          }

          const frontmatter = fileCache.frontmatter;
          const metadataEnabled = this.getEnabledFromFrontmatter(
            "quiet-outline",
            frontmatter
          );

          const { enabledInEachNote } = this.settings.quietOutlineSettings;

          let enabled = true;
          if (metadataEnabled == null) {
            if (enabledInEachNote != undefined && !enabledInEachNote) {
              enabled = false;
            }

            if (this.getEnabledFromBlacklist(file.path)) {
              enabled = false;
            }
          } else if (!metadataEnabled) {
            enabled = false;
          }

          if (!enabled) {
            cancelQuietOutlineDecoration(containerElement);
            return;
          }

          quietOutlineHandler(
            this.settings.quietOutlineSettings,
            containerElement,
            headingELements
          );
        },
        () => {
          const containerElement =
            viewContent.querySelector<HTMLElement>(".n-tree");
          if (containerElement) {
            cancelQuietOutlineDecoration(containerElement);
          }
        }
      );

      this.quietOutlineComponents.push(vc);
      view.addChild(vc);
      view.register(() => {
        this.quietOutlineComponents = this.quietOutlineComponents.filter(
          (item) => !item.equal(leafId)
        );
      });
    });
  }

  private handleHeadingsInExplorer() {
    const leaves = this.app.workspace.getLeavesOfType("file-explorer");
    leaves.forEach((leaf: ObsidianWorkspaceLeaf) => {
      const leafId = leaf.id;
      if (!leafId || this.fileExplorerIdSet.has(leafId)) {
        return;
      }

      const view = leaf.view;
      const navFilesContainer = view.containerEl.querySelector<HTMLElement>(
        '[data-type="file-explorer"] .nav-files-container'
      );
      if (!navFilesContainer) {
        return;
      }

      this.fileExplorerIdSet.add(leafId);

      const vc = new ViewChildComponent(
        leafId,
        view,
        navFilesContainer,
        () => {
          const navFileTitles =
            navFilesContainer.querySelectorAll<HTMLElement>(".nav-file-title");

          navFileTitles.forEach((navFile) => {
            const headingElements = navFile.querySelectorAll<HTMLElement>(
              ".file-heading-container .clickable-heading"
            );
            if (headingElements.length === 0) {
              return;
            }

            const filePath = navFile.dataset.path;
            if (!filePath) {
              return;
            }

            const file = this.app.vault.getFileByPath(filePath);
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
              "file-explorer",
              frontmatter
            );

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
            } = this.settings.fileExplorerSettings;

            if (metadataEnabled == null) {
              if (enabledInEachNote != undefined && !enabledInEachNote) {
                return;
              }

              if (this.getEnabledFromBlacklist(filePath)) {
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

            const marginMultiplier =
              parseInt(
                getComputedStyle(document.body).getPropertyValue(
                  "--clickable-heading-margin-multiplier"
                )
              ) || 10;

            for (
              let i = 0, j = 0;
              i < headingElements.length && j < cacheHeadings.length;
              i++, j++
            ) {
              const readLevel = getFileHeadingItemLevel(
                headingElements[i],
                marginMultiplier
              );
              const readText = headingElements[i].innerText;
              let cacheLevel = cacheHeadings[j].level;

              while (
                j < cacheHeadings.length - 1 &&
                (cacheLevel !== readLevel ||
                  cacheHeadings[j].heading !== readText)
              ) {
                counter.handler(cacheLevel);
                j++;
                cacheLevel = cacheHeadings[j].level;
              }

              const decoratorContent = counter.decorator(cacheLevel);
              decorateFileHeadingElement(
                headingElements[i],
                decoratorContent,
                opacity,
                position
              );
            }
          });
        },
        () => {
          const headingElements =
            navFilesContainer.querySelectorAll<HTMLElement>(
              ".nav-file-title .file-heading-container .clickable-heading"
            );
          headingElements.forEach((ele) => {
            cancelFileHeadingDecorator(ele);
          });
        }
      );

      this.fileExplorerComponents.push(vc);
      view.addChild(vc);
      view.register(() => {
        this.fileExplorerComponents = this.fileExplorerComponents.filter(
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
          const cssStatus: CSSEnabledStatus = {
            mode: null,
            all: null,
          };

          for (const cssItem of cssclasses) {
            if (typeof cssItem === "string") {
              const { mode: m, all: a } = checkEnabledCSS(cssItem, mode);
              if (m != null) {
                cssStatus.mode = m;
              }
              if (a != null) {
                cssStatus.all = a;
              }
            }
          }

          return cssStatus.mode ?? cssStatus.all;
        } else if (typeof cssclasses === "string") {
          const { mode: m, all: a } = checkEnabledCSS(cssclasses, mode);
          return m ?? a;
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
