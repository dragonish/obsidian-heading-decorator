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
import type { Extension } from "@codemirror/state";
import { i18n } from "../locales";
import type { HeadingPluginSettings, HeadingPluginData } from "../common/data";
import {
  headingsSelector,
  getBoolean,
  checkEnabledCSS,
  stringToRegex,
  defaultSettings,
} from "../common/data";
import {
  HeadingEditorViewPlugin,
  headingDecorationsField,
  editorModeField,
  updateEditorMode,
} from "./editor";
import { createHeadingGutterExtension } from "./editor-gutter";
import { ViewChildComponent } from "./child";
import { ReadingChild } from "./reading-child";
import {
  readingOrderedHandler,
  readingUnorderedHandler,
  cancelHTMLDecorator,
} from "./reading";
import { outlineHandler, cancelOutlineDecoration } from "./outline";
import {
  quietOutlineHandler,
  cancelQuietOutlineDecoration,
} from "./quiet-outline";
import {
  fileExplorerHandler,
  cancelFileExplorerDecoration,
} from "./file-explorer";
import { HeadingSettingTab } from "./setting-tab";

interface ObsidianEditor extends Editor {
  cm: EditorView;
}

interface ObsidianWorkspaceLeaf extends WorkspaceLeaf {
  id: string;
}

type OnChangeCallback = (path: string, newValue: unknown) => void;

interface RevocableProxy {
  proxy: HeadingPluginSettings;
  revoke: () => void;
}

export class HeadingPlugin extends Plugin {
  settings: HeadingPluginSettings;
  i18n = i18n;

  private revokes: (() => void)[] = [];
  private editorExtensions: Extension[] = [];

  private readingComponents: ReadingChild[] = [];

  private outlineIdSet: Set<string> = new Set();
  private outlineComponents: ViewChildComponent[] = [];

  private quietOutlineIdSet: Set<string> = new Set();
  private quietOutlineComponents: ViewChildComponent[] = [];

  private fileExplorerIdSet: Set<string> = new Set();
  private fileExplorerComponents: ViewChildComponent[] = [];

  private debouncedRerenderPreviewMarkdown = debounce(
    this.rerenderPreviewMarkdown.bind(this),
    1000,
    true
  );

  private debouncedRerenderOutlineDecorator = debounce(
    this.rerenderOutlineDecorator.bind(this),
    1000,
    true
  );

  private debouncedRerenderQuietOutlineDecorator = debounce(
    this.rerenderQuietOutlineDecorator.bind(this),
    1000,
    true
  );

  private debouncedRerenderFileExplorerDecorator = debounce(
    this.rerenderFileExplorerDecorator.bind(this),
    1000,
    true
  );

  private createDeepRevocableProxy<T extends HeadingPluginSettings>(
    obj: T,
    onChange: OnChangeCallback,
    revokes: (() => void)[],
    cache = new WeakMap<object, RevocableProxy>(),
    path = ""
  ): RevocableProxy {
    if (typeof obj !== "object" || obj === null) {
      return { proxy: obj, revoke: () => {} };
    }

    // If it has already been proxy, return the cached proxy directly.
    if (cache.has(obj)) {
      return cache.get(obj)!;
    }

    const revocable = Proxy.revocable(obj, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "object" && value !== null) {
          const newPath = path ? `${path}.${String(prop)}` : String(prop);
          return this.createDeepRevocableProxy(
            value as unknown as HeadingPluginSettings,
            onChange,
            revokes,
            cache,
            newPath
          ).proxy;
        }
        return value;
      },
      set: (target, prop, value, receiver) => {
        const oldValue = Reflect.get(target, prop, receiver);
        const result = Reflect.set(target, prop, value, receiver);
        if (oldValue !== value) {
          const changedPath = path ? `${path}.${String(prop)}` : String(prop);
          onChange(changedPath, value);
        }
        return result;
      },
    });
    revokes.push(revocable.revoke);
    cache.set(obj, revocable);
    return revocable;
  }

  private async loadSettings() {
    const rawSettings = Object.assign<HeadingPluginSettings, unknown>(
      defaultSettings(),
      await this.loadData()
    );

    this.revokes.forEach((revoke) => revoke());
    this.revokes = [];

    const { proxy } = this.createDeepRevocableProxy(
      rawSettings,
      this.settingsChanged.bind(this),
      this.revokes
    );

    this.settings = proxy;
  }

  async onload() {
    await this.loadSettings();

    // Register editor extension
    this.editorExtensions = this.buildEditorExtensions();
    this.registerEditorExtension(this.editorExtensions);

    // Register markdown post processor
    this.registerMarkdownPostProcessor((element, context) => {
      if (!this.settings.enabledInReading) {
        return;
      }

      let child = this.readingComponents.find((ch) => ch.equal(element));
      if (!child) {
        child = new ReadingChild(
          element,
          context,
          async (container, cxt, fileData) => {
            const metadataEnabled = this.getEnabledFromFrontmatter(
              "reading",
              cxt.frontmatter
            );

            const readingSettings = this.settings.enabledReadingSettings
              ? this.settings.readingSettings
              : this.settings.commonSettings;

            const { enabledInEachNote } = readingSettings;

            let enabled = true;
            if (metadataEnabled == null) {
              if (enabledInEachNote != undefined && !enabledInEachNote) {
                enabled = false;
              }

              if (this.getEnabledFromBlacklist(cxt.sourcePath)) {
                enabled = false;
              }
            } else if (!metadataEnabled) {
              enabled = false;
            }

            if (enabled) {
              const headingElements = container.findAll(headingsSelector);
              if (headingElements.length === 0) {
                cancelHTMLDecorator(container);
                return;
              }

              const { decoratorMode = "orderd" } = readingSettings;
              if (decoratorMode === "unordered") {
                readingUnorderedHandler(readingSettings, headingElements);
              } else {
                let sourceContent = fileData;
                if (!sourceContent) {
                  const file = this.getActiveFile(cxt.sourcePath);
                  if (!file) {
                    cancelHTMLDecorator(container);
                    return;
                  }
                  sourceContent = await this.app.vault.cachedRead(file);
                }

                const sourceArr = sourceContent.split("\n");
                if (sourceArr.length === 0) {
                  cancelHTMLDecorator(container);
                  return;
                }

                readingOrderedHandler(
                  readingSettings,
                  cxt,
                  headingElements,
                  sourceArr
                );
              }
            } else {
              cancelHTMLDecorator(container);
            }
          },
          (container) => {
            cancelHTMLDecorator(container);
          }
        );
        this.readingComponents.push(child);
        context.addChild(child);
        child.register(() => {
          this.readingComponents = this.readingComponents.filter(
            (item) => !item.equal(child)
          );
        });
      }
      child.render();

      const currentPath = context.sourcePath;
      this.readingComponents.forEach((rc) => {
        if (rc.isSamePath(currentPath)) {
          rc.updateContext(context);
        }
      });
    });

    // Listen for metadata changes
    this.registerEvent(
      this.app.metadataCache.on(
        "changed",
        debounce(
          (file, data) => {
            //! Delay trigger rerender
            if (file && file.path === this.getActiveFile()?.path) {
              this.rerenderReadingDecorator(file, data);
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
    this.unloadReadingComponents();
    this.unloadOutlineComponents();
    this.unloadQuietOutlineComponents();
    this.unloadFileExplorerComponents();

    this.revokes.forEach((revoke) => revoke());
    this.revokes = [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private settingsChanged(path: string, value: unknown) {
    if (path === "enabledInReading") {
      if (value) {
        this.debouncedRerenderPreviewMarkdown();
      } else {
        this.unloadReadingComponents();
      }
    } else if (path === "enabledInOutline") {
      if (value) {
        this.loadOutlineComponents();
      } else {
        this.unloadOutlineComponents();
      }
    } else if (path === "enabledInQuietOutline") {
      if (value) {
        this.loadQuietOutlineComponents();
      } else {
        this.unloadQuietOutlineComponents();
      }
    } else if (path === "enabledInFileExplorer") {
      if (value) {
        this.loadFileExplorerComponents();
      } else {
        this.unloadFileExplorerComponents();
      }
    } else if (path === "useGutter" || path === "gutterPosition") {
      this.swapEditorExtensions();
    } else if (
      path === "enabledOutlineSettings" ||
      path.startsWith("outlineSettings")
    ) {
      this.debouncedRerenderOutlineDecorator();
    } else if (
      path === "enabledQuietOutlineSettings" ||
      path.startsWith("quietOutlineSettings")
    ) {
      this.debouncedRerenderQuietOutlineDecorator();
    } else if (
      path === "enabledFileExplorerSettings" ||
      path.startsWith("fileExplorerSettings")
    ) {
      this.debouncedRerenderFileExplorerDecorator();
    } else if (
      path === "enabledReadingSettings" ||
      path.startsWith("readingSettings")
    ) {
      this.debouncedRerenderPreviewMarkdown();
    } else if (
      path === "metadataKeyword" ||
      path.startsWith("fileRegexBlacklist") ||
      path.startsWith("folderBlacklist")
    ) {
      this.debouncedRerenderPreviewMarkdown();
      this.debouncedRerenderOutlineDecorator();
      this.debouncedRerenderQuietOutlineDecorator();
      this.debouncedRerenderFileExplorerDecorator();
    } else if (path.startsWith("commonSettings")) {
      if (!this.settings.enabledReadingSettings) {
        this.debouncedRerenderPreviewMarkdown();
      }
      if (!this.settings.enabledOutlineSettings) {
        this.debouncedRerenderOutlineDecorator();
      }
      if (!this.settings.enabledQuietOutlineSettings) {
        this.debouncedRerenderQuietOutlineDecorator();
      }
      if (!this.settings.enabledFileExplorerSettings) {
        this.debouncedRerenderFileExplorerDecorator();
      }
    }
  }

  private unloadReadingComponents() {
    this.readingComponents.forEach((child) => child.detach());
    this.readingComponents = [];
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

  private buildEditorExtensions(): Extension[] {
    const getPluginData = this.getPluginData.bind(this);
    if (this.settings.useGutter) {
      const showBefore = this.settings.gutterPosition === "before-line-numbers";
      return [
        editorModeField,
        ...createHeadingGutterExtension(getPluginData, showBefore),
      ];
    }
    return [
      headingDecorationsField,
      editorModeField,
      this.createInlineViewPlugin(getPluginData),
    ];
  }

  private swapEditorExtensions(): void {
    const newExts = this.buildEditorExtensions();
    this.editorExtensions.length = 0;
    this.editorExtensions.push(...newExts);
    this.app.workspace.updateOptions();
  }

  private createInlineViewPlugin(
    getPluginData: () => Promise<HeadingPluginData>
  ) {
    return ViewPlugin.fromClass(
      class extends HeadingEditorViewPlugin {
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

          const outlineSettings = this.settings.enabledOutlineSettings
            ? this.settings.outlineSettings
            : this.settings.commonSettings;

          const { enabledInEachNote } = outlineSettings;

          let enabled = true;
          if (metadataEnabled == null) {
            if (enabledInEachNote != undefined && !enabledInEachNote) {
              enabled = false;
            }

            if (this.getEnabledFromBlacklist(state.file)) {
              enabled = false;
            }
          } else if (!metadataEnabled) {
            enabled = false;
          }

          if (enabled) {
            outlineHandler(
              outlineSettings,
              viewContent,
              headingElements,
              cacheHeadings
            );
          } else {
            cancelOutlineDecoration(viewContent);
          }
        },
        () => {
          if (viewContent) {
            cancelOutlineDecoration(viewContent);
          }
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

          const quietOutlineSettings = this.settings.enabledQuietOutlineSettings
            ? this.settings.quietOutlineSettings
            : this.settings.commonSettings;

          const { enabledInEachNote } = quietOutlineSettings;

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

          if (enabled) {
            quietOutlineHandler(
              quietOutlineSettings,
              containerElement,
              headingELements
            );
          } else {
            cancelQuietOutlineDecoration(containerElement);
          }
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

            const fileExplorerSettings = this.settings
              .enabledFileExplorerSettings
              ? this.settings.fileExplorerSettings
              : this.settings.commonSettings;

            const { enabledInEachNote } = fileExplorerSettings;

            let enabled = true;
            if (metadataEnabled == null) {
              if (enabledInEachNote != undefined && !enabledInEachNote) {
                enabled = false;
              }

              if (this.getEnabledFromBlacklist(filePath)) {
                enabled = false;
              }
            } else if (!metadataEnabled) {
              enabled = false;
            }

            if (enabled) {
              fileExplorerHandler(
                fileExplorerSettings,
                navFile,
                headingElements,
                cacheHeadings
              );
            } else {
              cancelFileExplorerDecoration(navFile);
            }
          });
        },
        () => {
          const containerElements =
            navFilesContainer.querySelectorAll<HTMLElement>(".nav-file-title");
          containerElements.forEach((ele) => {
            cancelFileExplorerDecoration(ele);
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

  /**
   * Rerender Preview Markdown.
   * @param file
   */
  private rerenderPreviewMarkdown(file?: TFile) {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    leaves.forEach((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        const view = leaf.view;
        if (!file || file === view.file) {
          const oldScroll = view.previewMode.getScroll();
          view.previewMode.rerender(true);
          const newScroll = view.previewMode.getScroll();
          if (newScroll !== oldScroll) {
            window.setTimeout(() => {
              view.previewMode.applyScroll(oldScroll);
            }, 200);
          }
        }
      }
    });
  }

  private rerenderReadingDecorator(file: TFile, fileData: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      //? "source" for editing view (Live Preview & Source mode),
      //? "preview" for reading view.
      const isReadingView = view.getMode() === "preview";
      if (isReadingView) {
        this.readingComponents.forEach((rc) => {
          if (rc.isSamePath(file.path)) {
            rc.render(fileData);
          }
        });
      } else if (file === view.file) {
        if (this.settings.readingRenderPolicy === "full") {
          view.previewMode.rerender(true);
        } else {
          this.readingComponents.forEach((rc) => {
            if (rc.isSamePath(file.path)) {
              rc.render(fileData);
            }
          });
        }
      }
    }
  }

  private rerenderOutlineDecorator() {
    this.outlineComponents.forEach((vc) => vc.render());
  }

  private rerenderQuietOutlineDecorator() {
    this.quietOutlineComponents.forEach((vc) => vc.render());
  }

  private rerenderFileExplorerDecorator() {
    this.fileExplorerComponents.forEach((vc) => vc.render());
  }

  async getPluginData(): Promise<HeadingPluginData> {
    const {
      commonSettings,
      enabledInPreview: _enabledInPreview,
      enabledPreviewSettings,
      enabledInSource: _enabledInSource,
      enabledSourceSettings,
      sourceHideNumberSigns,
      previewSettings: _previewSettings,
      sourceSettings: _sourceSettings,
    } = this.settings;

    let enabledInPreview = _enabledInPreview;
    let enabledInSource = _enabledInSource;
    const previewSettings = enabledPreviewSettings
      ? _previewSettings
      : commonSettings;
    const sourceSettings = enabledSourceSettings
      ? _sourceSettings
      : commonSettings;

    const file = this.getActiveFile();
    if (file) {
      const frontmatter =
        this.app.metadataCache.getFileCache(file)?.frontmatter;

      if (_enabledInPreview) {
        const previewEnabledInEachNote =
          previewSettings.enabledInEachNote ?? true;
        enabledInPreview =
          this.getEnabledFromFrontmatter("preview", frontmatter) ??
          (previewEnabledInEachNote &&
            !this.getEnabledFromBlacklist(file.path));
      }

      if (_enabledInSource) {
        const sourceEnabledInEachNote =
          sourceSettings.enabledInEachNote ?? true;
        enabledInSource =
          this.getEnabledFromFrontmatter("source", frontmatter) ??
          (sourceEnabledInEachNote && !this.getEnabledFromBlacklist(file.path));
      }
    }

    return {
      enabledInPreview,
      enabledInSource,
      sourceHideNumberSigns,
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
