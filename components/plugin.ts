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
import { i18n } from "../locales";
import type { HeadingPluginSettings, HeadingPluginData } from "../common/data";
import {
  headingsSelector,
  getBoolean,
  checkEnabledCSS,
  stringToRegex,
  defalutSettings,
} from "../common/data";
import {
  HeadingEditorViewPlugin,
  headingDecorationsField,
  editorModeField,
  updateEditorMode,
} from "./editor";
import { ViewChildComponent } from "./child";
import { readingOrderedHandler, readingUnorderedHandler } from "./reading";
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
      defalutSettings(),
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

      const { ordered } = this.settings.readingSettings;
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

        readingOrderedHandler(
          this.settings.readingSettings,
          context,
          headingElements,
          sourceArr
        );
      } else {
        readingUnorderedHandler(this.settings.readingSettings, headingElements);
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

    this.revokes.forEach((revoke) => revoke());
    this.revokes = [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private settingsChanged(path: string, value: unknown) {
    if (path === "enabledInOutline") {
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
    } else if (path.startsWith("outlineSettings")) {
      this.debouncedRerenderOutlineDecorator();
    } else if (path.startsWith("quietOutlineSettings")) {
      this.debouncedRerenderQuietOutlineDecorator();
    } else if (path.startsWith("fileExplorerSettings")) {
      this.debouncedRerenderFileExplorerDecorator();
    } else if (
      path === "enabledInReading" ||
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
    }
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

          const { enabledInEachNote } = this.settings.outlineSettings;

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
              this.settings.outlineSettings,
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

          if (enabled) {
            quietOutlineHandler(
              this.settings.quietOutlineSettings,
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

            const { enabledInEachNote } = this.settings.fileExplorerSettings;

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
                this.settings.fileExplorerSettings,
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
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      if (!file || file === view.file) {
        view.previewMode.rerender(true);
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
