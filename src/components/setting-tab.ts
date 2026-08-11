import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import type { HeadingPlugin } from "./plugin";
import type {
  OrderedCounterStyleType,
  HeadingDecoratorSettings,
  IndependentDecoratorSettings,
  SpliceDecoratorSettings,
  IndependentSettings,
  SpliceSettings,
} from "../../src/utils/data";
import {
  defaultIndependentSettings,
  defaultSpliceSettings,
} from "../../src/utils/data";
import { getStyleTypeOptions } from "../../src/utils/options";
import { FolderSuggest } from "./suggest";
import { SettingDisplayManager } from "./setting";

type ButtonOrUndefined = ButtonComponent | undefined;

export class HeadingSettingTab extends PluginSettingTab {
  plugin: HeadingPlugin;
  private readonly styleTypeOptions = getStyleTypeOptions();

  constructor(app: App, plugin: HeadingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {
      containerEl,
      plugin: { settings, i18n },
    } = this;

    containerEl.empty();

    //* metadataKeyword
    const metadataKeywordSetting = new Setting(containerEl)
      .setName(i18n.t("setting.metadataKeyword"))
      .addText((text) =>
        text
          .setPlaceholder(i18n.t("setting.metadataKeywordPlaceholder"))
          .setValue(settings.metadataKeyword)
          .onChange(async (value) => {
            settings.metadataKeyword = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    const metadataKeywordDesc = createFragment();
    const metadataKeywordDescTuple = i18n.getPlaceholderTuple(
      "setting.metadataKeywordDesc",
    );
    metadataKeywordDesc.append(
      metadataKeywordDescTuple[0],
      createEl("a", {
        href: "https://help.obsidian.md/Editing+and+formatting/Properties",
        text: i18n.t("setting.properties"),
      }),
      metadataKeywordDescTuple[1],
    );
    metadataKeywordSetting.descEl.appendChild(metadataKeywordDesc);

    new Setting(containerEl).setName(i18n.t("setting.common")).setHeading();

    //* common
    new Setting(containerEl)
      .setName(i18n.t("setting.commonConfig"))
      .setDesc(i18n.t("setting.commonConfigDesc"))
      .addButton((button) => {
        button.setButtonText(i18n.t("button.config")).onClick(() => {
          this.manageHeadingDecoratorSettings("commonSettings");
        });
      });

    new Setting(containerEl)
      .setName(i18n.t("setting.editorDisplay"))
      .setHeading();

    //* useGutter
    const gutterPositionManager = new SettingDisplayManager();

    new Setting(containerEl)
      .setName(i18n.t("setting.useGutter"))
      .setDesc(i18n.t("setting.useGutterDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.useGutter).onChange(async (value) => {
          settings.useGutter = value;
          if (value) {
            gutterPositionManager.show();
          } else {
            gutterPositionManager.hide();
          }
          await this.plugin.saveSettings();
        }),
      );

    //* gutterPosition
    gutterPositionManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.gutterPosition"))
        .setDesc(i18n.t("setting.gutterPositionDesc"))
        .addDropdown((dropdown) => {
          dropdown
            .addOptions({
              "before-line-numbers": i18n.t("setting.beforeLineNumbers"),
              "after-line-numbers": i18n.t("setting.afterLineNumbers"),
            })
            .setValue(settings.gutterPosition)
            .onChange(async (value) => {
              settings.gutterPosition = this.isGutterPosition(value)
                ? value
                : "before-line-numbers";
              await this.plugin.saveSettings();
            });
        }),
    );

    //* gutterFontSize
    gutterPositionManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.gutterFontSize"))
        .setDesc(i18n.t("setting.gutterFontSizeDesc"))
        .addSlider((slider) =>
          slider
            .setLimits(12, 24, 1)
            .setValue(settings.gutterFontSize)
            .onChange(async (value) => {
              settings.gutterFontSize = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* enabledGutterSettings
    let gutterConfigBtn: ButtonOrUndefined;
    gutterPositionManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInGutterConfig"))
        .setDesc(i18n.t("setting.enabledInGutterConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledGutterSettings)
            .onChange(async (value) => {
              settings.enabledGutterSettings = value;
              gutterConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          gutterConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("gutterSettings");
            })
            .setDisabled(!settings.enabledGutterSettings);
        }),
    );

    if (!settings.useGutter) {
      gutterPositionManager.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.reading")).setHeading();

    //* enabledInReading
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInReading"))
      .setDesc(i18n.t("setting.enabledInReadingDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInReading).onChange(async (value) => {
          settings.enabledInReading = value;
          if (value) {
            readingConfigManager.show();
          } else {
            readingConfigManager.hide();
          }
          await this.plugin.saveSettings();
        }),
      );

    const readingConfigManager = new SettingDisplayManager();

    let readingConfigBtn: ButtonOrUndefined;
    readingConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInReadingConfig"))
        .setDesc(i18n.t("setting.enabledInReadingConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledReadingSettings)
            .onChange(async (value) => {
              settings.enabledReadingSettings = value;
              readingConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          readingConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("readingSettings");
            })
            .setDisabled(!settings.enabledReadingSettings);
        }),
    );

    //* readingRenderPolicy
    readingConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.renderPolicy"))
        .setDesc(i18n.t("setting.renderPolicyDesc"))
        .addDropdown((dropdown) => {
          dropdown
            .addOptions({
              partial: i18n.t("setting.partial"),
              full: i18n.t("setting.full"),
            })
            .setValue(settings.readingRenderPolicy)
            .onChange(async (value) => {
              settings.readingRenderPolicy = this.isRenderPolicy(value)
                ? value
                : "partial";
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.enabledInReading) {
      readingConfigManager.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.livePreview"))
      .setHeading();

    //* enabledInPreview
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInPreview"))
      .setDesc(i18n.t("setting.enabledInPreviewDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInPreview).onChange(async (value) => {
          settings.enabledInPreview = value;
          if (value) {
            previewConfigManager.show();
          } else {
            previewConfigManager.hide();
          }
          await this.plugin.saveSettings();
        }),
      );

    const previewConfigManager = new SettingDisplayManager();

    let previewConfigBtn: ButtonOrUndefined;
    previewConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInPreviewConfig"))
        .setDesc(i18n.t("setting.enabledInPreviewConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledPreviewSettings)
            .onChange(async (value) => {
              settings.enabledPreviewSettings = value;
              previewConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          previewConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("previewSettings");
            })
            .setDisabled(!settings.enabledPreviewSettings);
        }),
    );

    if (!settings.enabledInPreview) {
      previewConfigManager.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.sourceMode")).setHeading();

    //* enabledInSource
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInSource"))
      .setDesc(i18n.t("setting.enabledInSourceDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInSource).onChange(async (value) => {
          settings.enabledInSource = value;
          if (value) {
            sourceConfigManager.show();
          } else {
            sourceConfigManager.hide();
          }
          await this.plugin.saveSettings();
        }),
      );

    const sourceConfigManager = new SettingDisplayManager();

    let sourceConfigBtn: ButtonOrUndefined;
    sourceConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInSourceConfig"))
        .setDesc(i18n.t("setting.enabledInSourceConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledSourceSettings)
            .onChange(async (value) => {
              settings.enabledSourceSettings = value;
              sourceConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          sourceConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("sourceSettings");
            })
            .setDisabled(!settings.enabledSourceSettings);
        }),
    );

    //* sourceHideNumberSigns
    sourceConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.hideNumberSigns"))
        .setDesc(i18n.t("setting.hideNumberSignsDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.sourceHideNumberSigns ?? false)
            .onChange(async (value) => {
              settings.sourceHideNumberSigns = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.enabledInSource) {
      sourceConfigManager.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.outline")).setHeading();

    //* enabledInOutline
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInOutline"))
      .setDesc(i18n.t("setting.enabledInOutlineDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInOutline).onChange(async (value) => {
          settings.enabledInOutline = value;
          if (value) {
            outlineConfigManager.show();
          } else {
            outlineConfigManager.hide();
          }
          await this.plugin.saveSettings();
        }),
      );

    const outlineConfigManager = new SettingDisplayManager();

    let outlineConfigBtn: ButtonOrUndefined;
    outlineConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInOutlineConfig"))
        .setDesc(i18n.t("setting.enabledInOutlineConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledOutlineSettings)
            .onChange(async (value) => {
              settings.enabledOutlineSettings = value;
              outlineConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          outlineConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("outlineSettings");
            })
            .setDisabled(!settings.enabledOutlineSettings);
        }),
    );

    if (!settings.enabledInOutline) {
      outlineConfigManager.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.quietOutline"))
      .setHeading();

    //* enabledInQuietOutline
    const enabledInQuietOutlineSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInQuietOutline"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.enabledInQuietOutline)
          .onChange(async (value) => {
            settings.enabledInQuietOutline = value;
            if (value) {
              quietOutlineConfigManager.show();
            } else {
              quietOutlineConfigManager.hide();
            }
            await this.plugin.saveSettings();
          }),
      );

    const enabledInQuietOutlineDesc = createFragment();
    const enabledInQuietOutLineDescTuple = i18n.getPlaceholderTuple(
      "setting.enabledInQuietOutlineDesc",
    );
    enabledInQuietOutlineDesc.append(
      enabledInQuietOutLineDescTuple[0],
      createEl("a", {
        href: "https://github.com/guopenghui/obsidian-quiet-outline",
        text: "Quiet Outline",
      }),
      enabledInQuietOutLineDescTuple[1],
    );
    enabledInQuietOutlineSetting.descEl.appendChild(enabledInQuietOutlineDesc);

    const quietOutlineConfigManager = new SettingDisplayManager();

    let quietOutlineConfigBtn: ButtonOrUndefined;
    quietOutlineConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInQuietOutlineConfig"))
        .setDesc(i18n.t("setting.enabledInQuietOutlineConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledQuietOutlineSettings)
            .onChange(async (value) => {
              settings.enabledQuietOutlineSettings = value;
              quietOutlineConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          quietOutlineConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("quietOutlineSettings");
            })
            .setDisabled(!settings.enabledQuietOutlineSettings);
        }),
    );

    if (!settings.enabledInQuietOutline) {
      quietOutlineConfigManager.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.fileExplorer"))
      .setHeading();

    //* enabledInFileExplorer
    const enabledInFileExplorerSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInFileExplorer"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.enabledInFileExplorer)
          .onChange(async (value) => {
            settings.enabledInFileExplorer = value;
            if (value) {
              fileExplorerConfigManager.show();
            } else {
              fileExplorerConfigManager.hide();
            }
            await this.plugin.saveSettings();
          }),
      );

    const enabledInFileExplorerDesc = createFragment();
    const enabledInFileExplorerDescTuple = i18n.getPlaceholderTuple(
      "setting.enabledInFileExplorerDesc",
    );
    enabledInFileExplorerDesc.append(
      enabledInFileExplorerDescTuple[0],
      createEl("a", {
        href: "https://github.com/patrickchiang/obsidian-headings-in-explorer",
        text: "Headings in Explorer",
      }),
      enabledInFileExplorerDescTuple[1],
    );
    enabledInFileExplorerSetting.descEl.appendChild(enabledInFileExplorerDesc);

    const fileExplorerConfigManager = new SettingDisplayManager();

    let fileExplorerConfigBtn: ButtonOrUndefined;
    fileExplorerConfigManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.enabledInFileExplorerConfig"))
        .setDesc(i18n.t("setting.enabledInFileExplorerConfigDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(settings.enabledFileExplorerSettings)
            .onChange(async (value) => {
              settings.enabledFileExplorerSettings = value;
              fileExplorerConfigBtn?.setDisabled(!value);
              await this.plugin.saveSettings();
            });
        })
        .addButton((button) => {
          fileExplorerConfigBtn = button;
          button
            .setButtonText(i18n.t("button.config"))
            .onClick(() => {
              this.manageHeadingDecoratorSettings("fileExplorerSettings");
            })
            .setDisabled(!settings.enabledFileExplorerSettings);
        }),
    );

    if (!settings.enabledInFileExplorer) {
      fileExplorerConfigManager.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.blocklist")).setHeading();

    //* folderBlacklist
    new Setting(containerEl)
      .setName(i18n.t("setting.folderBlacklist"))
      .addButton((button) => {
        button.setButtonText(i18n.t("button.manage")).onClick(() => {
          this.manageFolderBlacklist(true);
        });
      });

    //* fileRegexBlacklist
    new Setting(containerEl)
      .setName(i18n.t("setting.fileRegexBlacklist"))
      .addButton((button) => {
        button.setButtonText(i18n.t("button.manage")).onClick(() => {
          this.manageFileRegexBlacklist(true);
        });
      });
  }

  private isOpacityValue(value: number): value is OpacityOptions {
    if (value >= 10 && value <= 100 && value % 10 === 0) {
      return true;
    }
    return false;
  }

  private isDecoratorModeValue(value: string): value is DecoratorMode {
    return ["orderd", "independent", "splice", "unordered"].includes(value);
  }

  private isPositionValue(value: string): value is PostionOptions {
    return ["before", "after", "before-inside", "after-inside"].includes(value);
  }

  private isRenderPolicy(value: string): value is RenderPolicy {
    return ["partial", "full"].includes(value);
  }

  private isGutterPosition(value: string): value is GutterPosition {
    return ["before-line-numbers", "after-line-numbers"].includes(value);
  }

  private manageHeadingDecoratorSettings(
    settingsType: PluginDecoratorSettingsType,
  ) {
    const {
      containerEl,
      plugin: { settings, i18n },
    } = this;

    containerEl.empty();

    let tabName = "";
    switch (settingsType) {
      case "commonSettings":
        tabName = i18n.t("setting.commonConfig");
        break;
      case "readingSettings":
        tabName = i18n.t("setting.enabledInReadingConfig");
        break;
      case "previewSettings":
        tabName = i18n.t("setting.enabledInPreviewConfig");
        break;
      case "sourceSettings":
        tabName = i18n.t("setting.enabledInSourceConfig");
        break;
      case "outlineSettings":
        tabName = i18n.t("setting.enabledInOutlineConfig");
        break;
      case "quietOutlineSettings":
        tabName = i18n.t("setting.enabledInQuietOutlineConfig");
        break;
      case "fileExplorerSettings":
        tabName = i18n.t("setting.enabledInFileExplorerConfig");
        break;
      case "gutterSettings":
        tabName = i18n.t("setting.enabledInGutterConfig");
        break;
    }

    new Setting(containerEl)
      .setName(tabName)
      .setHeading()
      .addButton((button) => {
        button.setButtonText(i18n.t("button.back")).onClick(() => {
          this.update();
        });
      });

    //* enabledInEachNote
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInEachNote"))
      .setDesc(i18n.t("setting.enabledInEachNoteDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings[settingsType].enabledInEachNote ?? true)
          .onChange(async (value) => {
            settings[settingsType].enabledInEachNote = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName(i18n.t("setting.effect")).setHeading();

    //* decoratorMode
    new Setting(containerEl)
      .setName(i18n.t("setting.decoratorMode"))
      .setDesc(i18n.t("setting.decoratorModeDesc"))
      .addDropdown((dropdown) => {
        const options: Record<DecoratorMode, string> = {
          orderd: i18n.t("setting.ordered"),
          independent: i18n.t("setting.independent"),
          splice: i18n.t("setting.splice"),
          unordered: i18n.t("setting.unordered"),
        };
        dropdown
          .addOptions(options)
          .setValue(settings[settingsType].decoratorMode || "orderd")
          .onChange(async (value) => {
            settings[settingsType].decoratorMode = this.isDecoratorModeValue(
              value,
            )
              ? value
              : "orderd";

            switch (settings[settingsType].decoratorMode) {
              case "orderd":
                orderedManager.show();
                logicManager.show();
                independentManager.hide();
                spliceManager.hide();
                unorderedManager.hide();
                break;
              case "independent":
                independentManager.show();
                logicManager.show();
                orderedManager.hide();
                spliceManager.hide();
                unorderedManager.hide();
                break;
              case "splice":
                spliceManager.show();
                logicManager.show();
                orderedManager.hide();
                independentManager.hide();
                unorderedManager.hide();
                break;
              case "unordered":
                unorderedManager.show();
                orderedManager.hide();
                independentManager.hide();
                spliceManager.hide();
                logicManager.hide();
                break;
            }

            await this.plugin.saveSettings();
          });
      });

    //* opacity
    new Setting(containerEl)
      .setName(i18n.t("setting.opacity"))
      .setDesc(i18n.t("setting.opacityDesc"))
      .addSlider((slider) =>
        slider
          .setLimits(10, 100, 10)
          .setValue(settings[settingsType].opacity)
          .onChange(async (value) => {
            settings[settingsType].opacity = this.isOpacityValue(value)
              ? value
              : 20;
            await this.plugin.saveSettings();
          }),
      );

    //* position
    new Setting(containerEl)
      .setName(i18n.t("setting.position"))
      .setDesc(i18n.t("setting.positionDesc"))
      .addDropdown((dropdown) => {
        const options: Record<string, string> =
          settingsType === "outlineSettings" ||
          settingsType === "quietOutlineSettings" ||
          settingsType === "fileExplorerSettings"
            ? {
                before: i18n.t("setting.before"),
                after: i18n.t("setting.after"),
              }
            : {
                before: i18n.t("setting.before"),
                "before-inside": i18n.t("setting.beforeInside"),
                after: i18n.t("setting.after"),
                "after-inside": i18n.t("setting.afterInside"),
              };

        dropdown
          .addOptions(options)
          .setValue(settings[settingsType].position)
          .onChange(async (value) => {
            settings[settingsType].position = this.isPositionValue(value)
              ? value
              : "before";
            await this.plugin.saveSettings();
          });
      });

    //* maxRecLevel
    new Setting(containerEl)
      .setName(i18n.t("setting.maxRecLevel"))
      .setDesc(i18n.t("setting.maxRecLevelDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(1, 6, 1)
          .setValue(settings[settingsType].maxRecLevel ?? 6)
          .onChange(async (value) => {
            settings[settingsType].maxRecLevel = value;
            await this.plugin.saveSettings();
          });
      });

    const orderedManager = new SettingDisplayManager();
    this.orderedSettings(orderedManager, containerEl, settings[settingsType]);
    if (
      settings[settingsType].decoratorMode &&
      settings[settingsType].decoratorMode !== "orderd"
    ) {
      orderedManager.hide();
    }

    const independentManager = new SettingDisplayManager();
    if (!settings[settingsType].independentSettings) {
      settings[settingsType].independentSettings = defaultIndependentSettings();
    }
    this.independentSettings(
      independentManager,
      containerEl,
      settings[settingsType].independentSettings,
    );
    if (settings[settingsType].decoratorMode !== "independent") {
      independentManager.hide();
    }

    const spliceManager = new SettingDisplayManager();
    if (!settings[settingsType].spliceSettings) {
      settings[settingsType].spliceSettings = defaultSpliceSettings();
    }
    this.spliceSettings(
      spliceManager,
      containerEl,
      settings[settingsType].spliceSettings,
    );
    if (settings[settingsType].decoratorMode !== "splice") {
      spliceManager.hide();
    }

    const unorderedManager = new SettingDisplayManager();
    this.unorderedSettings(
      unorderedManager,
      containerEl,
      settings[settingsType],
    );
    if (settings[settingsType].decoratorMode !== "unordered") {
      unorderedManager.hide();
    }

    const logicManager = new SettingDisplayManager();
    this.logicSettings(logicManager, containerEl, settings[settingsType]);
    if (settings[settingsType].decoratorMode === "unordered") {
      logicManager.hide();
    }

    //* Scroll back to the top
    containerEl.scrollTo({ top: 0, behavior: "smooth" });
  }

  private orderedSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.ordered")).setHeading(),
    );

    //* orderedStyleType
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedStyleType"))
        .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
        .addDropdown((dropdown) =>
          dropdown
            .addOptions(this.styleTypeOptions)
            .setValue(settings.orderedStyleType)
            .onChange(async (value: OrderedCounterStyleType) => {
              settings.orderedStyleType = value;
              switch (value) {
                case "customIdent":
                  orderedCustomIdentsManager.show();
                  orderedSpecifiedStringManager.hide();
                  break;
                case "string":
                  orderedSpecifiedStringManager.show();
                  orderedCustomIdentsManager.hide();
                  break;
                default:
                  orderedCustomIdentsManager.hide();
                  orderedSpecifiedStringManager.hide();
                  break;
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* orderedDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedDelimiter"))
        .setDesc(i18n.t("setting.orderedDelimiterDesc"))
        .addText((text) =>
          text.setValue(settings.orderedDelimiter).onChange(async (value) => {
            settings.orderedDelimiter = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    //* orderedTrailingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedTrailingDelimiter)
            .onChange(async (value) => {
              settings.orderedTrailingDelimiter = value;
              if (value) {
                orderedCustomTrailingDelimiterManager.show();
              } else {
                orderedCustomTrailingDelimiterManager.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const orderedCustomTrailingDelimiterManager = new SettingDisplayManager();
    displayManager.add(orderedCustomTrailingDelimiterManager);

    //* orderedCustomTrailingDelimiter
    orderedCustomTrailingDelimiterManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.orderedCustomTrailingDelimiter || "")
            .onChange(async (value) => {
              settings.orderedCustomTrailingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.orderedTrailingDelimiter) {
      orderedCustomTrailingDelimiterManager.hide();
    }

    //* orderedLeadingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedLeadingDelimiter || false)
            .onChange(async (value) => {
              settings.orderedLeadingDelimiter = value;
              if (value) {
                orderedCustomLeadingDelimiterManager.show();
              } else {
                orderedCustomLeadingDelimiterManager.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const orderedCustomLeadingDelimiterManager = new SettingDisplayManager();
    displayManager.add(orderedCustomLeadingDelimiterManager);

    //* orderedCustomLeadingDelimiter
    orderedCustomLeadingDelimiterManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.orderedCustomLeadingDelimiter || "")
            .onChange(async (value) => {
              settings.orderedCustomLeadingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.orderedLeadingDelimiter) {
      orderedCustomLeadingDelimiterManager.hide();
    }

    const orderedCustomIdentsManager = new SettingDisplayManager();
    displayManager.add(orderedCustomIdentsManager);

    //* orderedCustomIdents
    orderedCustomIdentsManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomIdents"))
        .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
        .addText((text) =>
          text
            .setValue(settings.orderedCustomIdents)
            .onChange(async (value) => {
              settings.orderedCustomIdents = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    if (settings.orderedStyleType !== "customIdent") {
      orderedCustomIdentsManager.hide();
    }

    const orderedSpecifiedStringManager = new SettingDisplayManager();
    displayManager.add(orderedSpecifiedStringManager);

    //* orderedSpecifiedString
    orderedSpecifiedStringManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedSpecifiedString"))
        .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
        .addText((text) =>
          text
            .setValue(settings.orderedSpecifiedString)
            .onChange(async (value) => {
              settings.orderedSpecifiedString = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    if (settings.orderedStyleType !== "string") {
      orderedSpecifiedStringManager.hide();
    }
  }

  private independentSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: IndependentSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.independent"))
        .setHeading(),
    );

    //* orderedRecLevel
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedRecLevel"))
        .setDesc(i18n.t("setting.orderedRecLevelDesc"))
        .addSlider((slider) => {
          slider
            .setLimits(2, 6, 1)
            .setValue(settings.orderedRecLevel)
            .onChange(async (value) => {
              settings.orderedRecLevel = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    //* h1
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h1")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h1);

    //* h2
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h2")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h2);

    //* h3
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h3")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h3);

    //* h4
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h4")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h4);

    //* h5
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h5")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h5);

    //* h6
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h6")).setHeading(),
    );
    this.independentDecoratorSettings(displayManager, containerEl, settings.h6);
  }

  private unorderedSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.unordered"))
        .setHeading(),
    );

    //* unorderedLevelHeadings
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.unorderedLevelHeadings"))
        .setDesc(i18n.t("setting.unorderedLevelHeadingsDesc"))
        .addText((text) =>
          text
            .setValue(settings.unorderedLevelHeadings)
            .onChange(async (value) => {
              settings.unorderedLevelHeadings = value;
              await this.plugin.saveSettings();
            }),
        ),
    );
  }

  private logicSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.logic")).setHeading(),
    );

    //* orderedAllowZeroLevel
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedAllowZeroLevel"))
        .setDesc(i18n.t("setting.orderedAllowZeroLevelDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedAllowZeroLevel ?? false)
            .onChange(async (value) => {
              settings.orderedAllowZeroLevel = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* orderedBasedOnExisting
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedBasedOnExisting"))
        .setDesc(i18n.t("setting.orderedBasedOnExistingDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedBasedOnExisting ?? false)
            .onChange(async (value) => {
              settings.orderedBasedOnExisting = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* orderedAlwaysIgnore
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedAlwaysIgnore"))
        .setDesc(i18n.t("setting.orderedAlwaysIgnoreDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedAlwaysIgnore ?? false)
            .onChange(async (value) => {
              settings.orderedAlwaysIgnore = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* orderedIgnoreSingle
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedIgnoreSingle"))
        .setDesc(i18n.t("setting.orderedIgnoreSingleDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.orderedIgnoreSingle)
            .onChange(async (value) => {
              settings.orderedIgnoreSingle = value;
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* orderedIgnoreMaximum
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedIgnoreMaximum"))
        .setDesc(i18n.t("setting.orderedIgnoreMaximumDesc"))
        .addSlider((slider) =>
          slider
            .setLimits(1, 6, 1)
            .setValue(settings.orderedIgnoreMaximum ?? 6)
            .onChange(async (value) => {
              settings.orderedIgnoreMaximum = value;
              await this.plugin.saveSettings();
            }),
        ),
    );
  }

  private spliceSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: SpliceSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.splice")).setHeading(),
    );

    //* delimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedDelimiter"))
        .setDesc(i18n.t("setting.orderedDelimiterDesc"))
        .addText((text) =>
          text.setValue(settings.delimiter).onChange(async (value) => {
            settings.delimiter = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    //* trailingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.trailingDelimiter)
            .onChange(async (value) => {
              settings.trailingDelimiter = value;
              if (value) {
                customTrailingDelimiterManager.show();
              } else {
                customTrailingDelimiterManager.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const customTrailingDelimiterManager = new SettingDisplayManager();
    displayManager.add(customTrailingDelimiterManager);

    //* customTrailingDelimiter
    customTrailingDelimiterManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.customTrailingDelimiter || "")
            .onChange(async (value) => {
              settings.customTrailingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.trailingDelimiter) {
      customTrailingDelimiterManager.hide();
    }

    //* leadingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.leadingDelimiter || false)
            .onChange(async (value) => {
              settings.leadingDelimiter = value;
              if (value) {
                customLeadingDelimiterManater.show();
              } else {
                customLeadingDelimiterManater.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const customLeadingDelimiterManater = new SettingDisplayManager();
    displayManager.add(customLeadingDelimiterManater);

    //* customLeadingDelimiter
    customLeadingDelimiterManater.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.customLeadingDelimiter || "")
            .onChange(async (value) => {
              settings.customLeadingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.leadingDelimiter) {
      customLeadingDelimiterManater.hide();
    }

    //* h1
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h1")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h1);

    //* h2
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h2")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h2);

    //* h3
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h3")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h3);

    //* h4
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h4")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h4);

    //* h5
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h5")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h5);

    //* h6
    displayManager.add(
      new Setting(containerEl).setName(i18n.t("setting.h6")).setHeading(),
    );
    this.spliceDecoratorSettings(displayManager, containerEl, settings.h6);
  }

  private manageFolderBlacklist(scrollToTop = false) {
    const {
      containerEl,
      plugin: { settings, i18n },
    } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(i18n.t("setting.folderBlacklist"))
      .setHeading()
      .addButton((button) => {
        button.setButtonText(i18n.t("button.back")).onClick(() => {
          this.update();
        });
      });

    settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(
          i18n.t("setting.folderBlocklistIndex", {
            index: index + 1,
          }),
        )
        .addText((text) => {
          text.setValue(folder).onChange(async (value) => {
            settings.folderBlacklist[index] = value;
            await this.plugin.saveSettings();
          });

          const suggest = new FolderSuggest(this.app, text.inputEl);
          suggest.onSelect(async (value) => {
            text.setValue(value);
            settings.folderBlacklist[index] = value;
            suggest.close();
            await this.plugin.saveSettings();
          });
        })
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
            .setDestructive()
            .onClick(async () => {
              settings.folderBlacklist.splice(index, 1);
              await this.plugin.saveSettings();
              this.manageFolderBlacklist();
            });
        });
    });

    new Setting(containerEl).addButton((button) => {
      button
        .setButtonText(i18n.t("button.add"))
        .setCta()
        .setTooltip(i18n.t("setting.folderBlocklistAddTip"))
        .onClick(async () => {
          settings.folderBlacklist.push("");
          await this.plugin.saveSettings();
          this.manageFolderBlacklist();
        });
    });

    //* Scroll back to the top
    if (scrollToTop) {
      containerEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  private manageFileRegexBlacklist(scrollToTop = false) {
    const {
      containerEl,
      plugin: { settings, i18n },
    } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(i18n.t("setting.fileRegexBlacklist"))
      .setHeading()
      .addButton((button) => {
        button.setButtonText(i18n.t("button.back")).onClick(() => {
          this.update();
        });
      });

    settings.fileRegexBlacklist.forEach((regex, index) => {
      new Setting(containerEl)
        .setName(
          i18n.t("setting.fileRegexBlocklistIndex", {
            index: index + 1,
          }),
        )
        .addText((text) =>
          text
            .setPlaceholder(i18n.t("setting.fileRegexBlocklistPlaceholder"))
            .setValue(regex)
            .onChange(async (value) => {
              settings.fileRegexBlacklist[index] = value.trim();
              await this.plugin.saveSettings();
            }),
        )
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
            .setDestructive()
            .onClick(async () => {
              settings.fileRegexBlacklist.splice(index, 1);
              await this.plugin.saveSettings();
              this.manageFileRegexBlacklist();
            });
        });
    });

    new Setting(containerEl).addButton((button) => {
      button
        .setButtonText(i18n.t("button.add"))
        .setCta()
        .setTooltip(i18n.t("setting.fileRegexBlocklistAddTip"))
        .onClick(async () => {
          settings.fileRegexBlacklist.push("");
          await this.plugin.saveSettings();
          this.manageFileRegexBlacklist();
        });
    });

    //* Scroll back to the top
    if (scrollToTop) {
      containerEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  private independentDecoratorSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: IndependentDecoratorSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    //* styleType
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedStyleType"))
        .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
        .addDropdown((dropdown) =>
          dropdown
            .addOptions(this.styleTypeOptions)
            .setValue(settings.styleType)
            .onChange(async (value: OrderedCounterStyleType) => {
              settings.styleType = value;
              switch (value) {
                case "customIdent":
                  customIdentsManager.show();
                  specifiedStringManager.hide();
                  break;
                case "string":
                  specifiedStringManager.show();
                  customIdentsManager.hide();
                  break;
                default:
                  customIdentsManager.hide();
                  specifiedStringManager.hide();
                  break;
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    //* delimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedDelimiter"))
        .setDesc(i18n.t("setting.orderedDelimiterDesc"))
        .addText((text) =>
          text.setValue(settings.delimiter).onChange(async (value) => {
            settings.delimiter = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    //* trailingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.trailingDelimiter)
            .onChange(async (value) => {
              settings.trailingDelimiter = value;
              if (value) {
                customTrailingDelimiterManager.show();
              } else {
                customTrailingDelimiterManager.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const customTrailingDelimiterManager = new SettingDisplayManager();
    displayManager.add(customTrailingDelimiterManager);

    //* customTrailingDelimiter
    customTrailingDelimiterManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.customTrailingDelimiter || "")
            .onChange(async (value) => {
              settings.customTrailingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.trailingDelimiter) {
      customTrailingDelimiterManager.hide();
    }

    //* leadingDelimiter
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
        .addToggle((toggle) =>
          toggle
            .setValue(settings.leadingDelimiter || false)
            .onChange(async (value) => {
              settings.leadingDelimiter = value;
              if (value) {
                customLeadingDelimiterManager.show();
              } else {
                customLeadingDelimiterManager.hide();
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const customLeadingDelimiterManager = new SettingDisplayManager();
    displayManager.add(customLeadingDelimiterManager);

    //* customLeadingDelimiter
    customLeadingDelimiterManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
        .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
        .addText((text) => {
          text
            .setValue(settings.customLeadingDelimiter || "")
            .onChange(async (value) => {
              settings.customLeadingDelimiter = value;
              await this.plugin.saveSettings();
            });
        }),
    );

    if (!settings.leadingDelimiter) {
      customLeadingDelimiterManager.hide();
    }

    const customIdentsManager = new SettingDisplayManager();
    displayManager.add(customIdentsManager);

    //* customIdents
    customIdentsManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomIdents"))
        .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
        .addText((text) =>
          text.setValue(settings.customIdents).onChange(async (value) => {
            settings.customIdents = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    if (settings.styleType !== "customIdent") {
      customIdentsManager.hide();
    }

    const specifiedStringManager = new SettingDisplayManager();
    displayManager.add(specifiedStringManager);

    //* specifiedString
    specifiedStringManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedSpecifiedString"))
        .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
        .addText((text) =>
          text.setValue(settings.specifiedString).onChange(async (value) => {
            settings.specifiedString = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    if (settings.styleType !== "string") {
      specifiedStringManager.hide();
    }
  }

  private spliceDecoratorSettings(
    displayManager: SettingDisplayManager,
    containerEl: HTMLElement,
    settings: SpliceDecoratorSettings,
  ) {
    const {
      plugin: { i18n },
    } = this;

    //* styleType
    displayManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedStyleType"))
        .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
        .addDropdown((dropdown) =>
          dropdown
            .addOptions(this.styleTypeOptions)
            .setValue(settings.styleType)
            .onChange(async (value: OrderedCounterStyleType) => {
              settings.styleType = value;
              switch (value) {
                case "customIdent":
                  customIdentsManager.show();
                  specifiedStringManager.hide();
                  break;
                case "string":
                  specifiedStringManager.show();
                  customIdentsManager.hide();
                  break;
                default:
                  customIdentsManager.hide();
                  specifiedStringManager.hide();
                  break;
              }
              await this.plugin.saveSettings();
            }),
        ),
    );

    const customIdentsManager = new SettingDisplayManager();
    displayManager.add(customIdentsManager);

    //* customIdents
    customIdentsManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedCustomIdents"))
        .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
        .addText((text) =>
          text.setValue(settings.customIdents).onChange(async (value) => {
            settings.customIdents = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    if (settings.styleType !== "customIdent") {
      customIdentsManager.hide();
    }

    const specifiedStringManager = new SettingDisplayManager();
    displayManager.add(specifiedStringManager);

    //* specifiedString
    specifiedStringManager.add(
      new Setting(containerEl)
        .setName(i18n.t("setting.orderedSpecifiedString"))
        .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
        .addText((text) =>
          text.setValue(settings.specifiedString).onChange(async (value) => {
            settings.specifiedString = value;
            await this.plugin.saveSettings();
          }),
        ),
    );

    if (settings.styleType !== "string") {
      specifiedStringManager.hide();
    }
  }
}
