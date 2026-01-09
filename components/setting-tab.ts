import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import type { HeadingPlugin } from "./plugin";
import type {
  OrderedCounterStyleType,
  HeadingDecoratorSettings,
  IndependentDecoratorSettings,
  IndependentSettings,
} from "../common/data";
import { className, defaultIndependentSettings } from "../common/data";
import { getStyleTypeOptions } from "../common/options";
import { FolderSuggest } from "./suggest";

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
          .onChange((value) => {
            settings.metadataKeyword = value.trim();
            this.plugin.saveSettings();
          })
      );

    const metadataKeywordDesc = createFragment();
    const metadataKeywordDescTuple = i18n.getPlaceholderTuple(
      "setting.metadataKeywordDesc"
    );
    metadataKeywordDesc.append(
      metadataKeywordDescTuple[0],
      createEl("a", {
        href: "https://help.obsidian.md/Editing+and+formatting/Properties",
        text: i18n.t("setting.properties"),
      }),
      metadataKeywordDescTuple[1]
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

    new Setting(containerEl).setName(i18n.t("setting.reading")).setHeading();

    //* enabledInReading
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInReading"))
      .setDesc(i18n.t("setting.enabledInReadingDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInReading).onChange((value) => {
          settings.enabledInReading = value;
          value
            ? readingConfigContainerEl.show()
            : readingConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const readingConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let readingConfigBtn: ButtonOrUndefined;
    new Setting(readingConfigContainerEl)
      .setName(i18n.t("setting.enabledInReadingConfig"))
      .setDesc(i18n.t("setting.enabledInReadingConfigDesc"))
      .addToggle((toggle) => {
        toggle.setValue(settings.enabledReadingSettings).onChange((value) => {
          settings.enabledReadingSettings = value;
          readingConfigBtn?.setDisabled(!value);
          this.plugin.saveSettings();
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
      });

    //* readingRenderPolicy
    new Setting(readingConfigContainerEl)
      .setName(i18n.t("setting.renderPolicy"))
      .setDesc(i18n.t("setting.renderPolicyDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOptions({
            partial: i18n.t("setting.partial"),
            full: i18n.t("setting.full"),
          })
          .setValue(settings.readingRenderPolicy)
          .onChange((value) => {
            settings.readingRenderPolicy = this.isRenderPolicy(value)
              ? value
              : "partial";
            this.plugin.saveSettings();
          });
      });

    if (!settings.enabledInReading) {
      readingConfigContainerEl.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.livePreview"))
      .setHeading();

    //* enabledInPreview
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInPreview"))
      .setDesc(i18n.t("setting.enabledInPreviewDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInPreview).onChange((value) => {
          settings.enabledInPreview = value;
          value
            ? previewConfigContainerEl.show()
            : previewConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const previewConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let previewConfigBtn: ButtonOrUndefined;
    new Setting(previewConfigContainerEl)
      .setName(i18n.t("setting.enabledInPreviewConfig"))
      .setDesc(i18n.t("setting.enabledInPreviewConfigDesc"))
      .addToggle((toggle) => {
        toggle.setValue(settings.enabledPreviewSettings).onChange((value) => {
          settings.enabledPreviewSettings = value;
          previewConfigBtn?.setDisabled(!value);
          this.plugin.saveSettings();
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
      });

    if (!settings.enabledInPreview) {
      previewConfigContainerEl.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.sourceMode")).setHeading();

    //* enabledInSource
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInSource"))
      .setDesc(i18n.t("setting.enabledInSourceDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInSource).onChange((value) => {
          settings.enabledInSource = value;
          value
            ? sourceConfigContainerEl.show()
            : sourceConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const sourceConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let sourceConfigBtn: ButtonOrUndefined;
    new Setting(sourceConfigContainerEl)
      .setName(i18n.t("setting.enabledInSourceConfig"))
      .setDesc(i18n.t("setting.enabledInSourceConfigDesc"))
      .addToggle((toggle) => {
        toggle.setValue(settings.enabledSourceSettings).onChange((value) => {
          settings.enabledSourceSettings = value;
          sourceConfigBtn?.setDisabled(!value);
          this.plugin.saveSettings();
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
      });

    //* sourceHideNumberSigns
    new Setting(sourceConfigContainerEl)
      .setName(i18n.t("setting.hideNumberSigns"))
      .setDesc(i18n.t("setting.hideNumberSignsDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(settings.sourceHideNumberSigns ?? false)
          .onChange((value) => {
            settings.sourceHideNumberSigns = value;
            this.plugin.saveSettings();
          });
      });

    if (!settings.enabledInSource) {
      sourceConfigContainerEl.hide();
    }

    new Setting(containerEl).setName(i18n.t("setting.outline")).setHeading();

    //* enabledInOutline
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInOutline"))
      .setDesc(i18n.t("setting.enabledInOutlineDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInOutline).onChange((value) => {
          settings.enabledInOutline = value;
          value
            ? outlineConfigContainerEl.show()
            : outlineConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const outlineConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let outlineConfigBtn: ButtonOrUndefined;
    new Setting(outlineConfigContainerEl)
      .setName(i18n.t("setting.enabledInOutlineConfig"))
      .setDesc(i18n.t("setting.enabledInOutlineConfigDesc"))
      .addToggle((toggle) => {
        toggle.setValue(settings.enabledOutlineSettings).onChange((value) => {
          settings.enabledOutlineSettings = value;
          outlineConfigBtn?.setDisabled(!value);
          this.plugin.saveSettings();
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
      });

    if (!settings.enabledInOutline) {
      outlineConfigContainerEl.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.quietOutline"))
      .setHeading();

    //* enabledInQuietOutline
    const enabledInQuietOutlineSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInQuietOutline"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInQuietOutline).onChange((value) => {
          settings.enabledInQuietOutline = value;
          value
            ? quietOutlineConfigContainerEl.show()
            : quietOutlineConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const enabledInQuietOutlineDesc = createFragment();
    const enabledInQuietOutLineDescTuple = i18n.getPlaceholderTuple(
      "setting.enabledInQuietOutlineDesc"
    );
    enabledInQuietOutlineDesc.append(
      enabledInQuietOutLineDescTuple[0],
      createEl("a", {
        href: "https://github.com/guopenghui/obsidian-quiet-outline",
        text: "Quiet Outline",
      }),
      enabledInQuietOutLineDescTuple[1]
    );
    enabledInQuietOutlineSetting.descEl.appendChild(enabledInQuietOutlineDesc);

    const quietOutlineConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let quietOutlineConfigBtn: ButtonOrUndefined;
    new Setting(quietOutlineConfigContainerEl)
      .setName(i18n.t("setting.enabledInQuietOutlineConfig"))
      .setDesc(i18n.t("setting.enabledInQuietOutlineConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(settings.enabledQuietOutlineSettings)
          .onChange((value) => {
            settings.enabledQuietOutlineSettings = value;
            quietOutlineConfigBtn?.setDisabled(!value);
            this.plugin.saveSettings();
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
      });

    if (!settings.enabledInQuietOutline) {
      quietOutlineConfigContainerEl.hide();
    }

    new Setting(containerEl)
      .setName(i18n.t("setting.fileExplorer"))
      .setHeading();

    //* enabledInFileExplorer
    const enabledInFileExplorerSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInFileExplorer"))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabledInFileExplorer).onChange((value) => {
          settings.enabledInFileExplorer = value;
          value
            ? fileExplorerConfigContainerEl.show()
            : fileExplorerConfigContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const enabledInFileExplorerDesc = createFragment();
    const enabledInFileExplorerDescTuple = i18n.getPlaceholderTuple(
      "setting.enabledInFileExplorerDesc"
    );
    enabledInFileExplorerDesc.append(
      enabledInFileExplorerDescTuple[0],
      createEl("a", {
        href: "https://github.com/patrickchiang/obsidian-headings-in-explorer",
        text: "Headings in Explorer",
      }),
      enabledInFileExplorerDescTuple[1]
    );
    enabledInFileExplorerSetting.descEl.appendChild(enabledInFileExplorerDesc);

    const fileExplorerConfigContainerEl = containerEl.createDiv(
      className.settingItem
    );

    let fileExplorerConfigBtn: ButtonOrUndefined;
    new Setting(fileExplorerConfigContainerEl)
      .setName(i18n.t("setting.enabledInFileExplorerConfig"))
      .setDesc(i18n.t("setting.enabledInFileExplorerConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(settings.enabledFileExplorerSettings)
          .onChange((value) => {
            settings.enabledFileExplorerSettings = value;
            fileExplorerConfigBtn?.setDisabled(!value);
            this.plugin.saveSettings();
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
      });

    if (!settings.enabledInFileExplorer) {
      fileExplorerConfigContainerEl.hide();
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
    return ["orderd", "independent", "unordered"].includes(value);
  }

  private isPositionValue(value: string): value is PostionOptions {
    return ["before", "after", "before-inside", "after-inside"].includes(value);
  }

  private isRenderPolicy(value: string): value is RenderPolicy {
    return ["partial", "full"].includes(value);
  }

  private manageHeadingDecoratorSettings(
    settingsType: PluginDecoratorSettingsType
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
    }

    new Setting(containerEl)
      .setName(tabName)
      .setHeading()
      .addButton((button) => {
        button.setButtonText(i18n.t("button.back")).onClick(() => {
          this.display();
        });
      });

    //* enabledInEachNote
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInEachNote"))
      .setDesc(i18n.t("setting.enabledInEachNoteDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings[settingsType].enabledInEachNote ?? true)
          .onChange((value) => {
            settings[settingsType].enabledInEachNote = value;
            this.plugin.saveSettings();
          })
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
          unordered: i18n.t("setting.unordered"),
        };
        dropdown
          .addOptions(options)
          .setValue(settings[settingsType].decoratorMode || "orderd")
          .onChange((value) => {
            settings[settingsType].decoratorMode = this.isDecoratorModeValue(
              value
            )
              ? value
              : "orderd";

            switch (settings[settingsType].decoratorMode) {
              case "orderd":
                orderedContainerEl.show();
                logicContainerEl.show();
                independentContainerEl.hide();
                unorderedContainerEl.hide();
                break;
              case "independent":
                independentContainerEl.show();
                logicContainerEl.show();
                orderedContainerEl.hide();
                unorderedContainerEl.hide();
                break;
              case "unordered":
                unorderedContainerEl.show();
                orderedContainerEl.hide();
                independentContainerEl.hide();
                logicContainerEl.hide();
                break;
            }

            this.plugin.saveSettings();
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
          .onChange((value) => {
            settings[settingsType].opacity = this.isOpacityValue(value)
              ? value
              : 20;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip()
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
          .onChange((value) => {
            settings[settingsType].position = this.isPositionValue(value)
              ? value
              : "before";
            this.plugin.saveSettings();
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
          .onChange((value) => {
            settings[settingsType].maxRecLevel = value;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip();
      });

    const orderedContainerEl = containerEl.createDiv(
      className.settingContainer
    );
    this.orderedSettings(orderedContainerEl, settings[settingsType]);
    if (
      settings[settingsType].decoratorMode &&
      settings[settingsType].decoratorMode !== "orderd"
    ) {
      orderedContainerEl.hide();
    }

    const independentContainerEl = containerEl.createDiv(
      className.settingContainer
    );
    if (!settings[settingsType].independentSettings) {
      settings[settingsType].independentSettings = defaultIndependentSettings();
    }
    this.independentSettings(
      independentContainerEl,
      settings[settingsType].independentSettings
    );
    if (settings[settingsType].decoratorMode !== "independent") {
      independentContainerEl.hide();
    }

    const unorderedContainerEl = containerEl.createDiv(
      className.settingContainer
    );
    this.unorderedSettings(unorderedContainerEl, settings[settingsType]);
    if (settings[settingsType].decoratorMode !== "unordered") {
      unorderedContainerEl.hide();
    }

    const logicContainerEl = containerEl.createDiv(className.settingContainer);
    this.logicSettings(logicContainerEl, settings[settingsType]);
    if (settings[settingsType].decoratorMode === "unordered") {
      logicContainerEl.hide();
    }

    //* Scroll back to the top
    containerEl.scrollTo({ top: 0, behavior: "smooth" });
  }

  private orderedSettings(
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings
  ) {
    const {
      plugin: { i18n },
    } = this;

    new Setting(containerEl).setName(i18n.t("setting.ordered")).setHeading();

    //* orderedStyleType
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedStyleType"))
      .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(this.styleTypeOptions)
          .setValue(settings.orderedStyleType)
          .onChange((value: OrderedCounterStyleType) => {
            settings.orderedStyleType = value;
            switch (value) {
              case "customIdent":
                orderedCustomIdentsContainerEl.show();
                orderedSpecifiedStringContainerEl.hide();
                break;
              case "string":
                orderedSpecifiedStringContainerEl.show();
                orderedCustomIdentsContainerEl.hide();
                break;
              default:
                orderedCustomIdentsContainerEl.hide();
                orderedSpecifiedStringContainerEl.hide();
                break;
            }
            this.plugin.saveSettings();
          })
      );

    //* orderedDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedDelimiter"))
      .setDesc(i18n.t("setting.orderedDelimiterDesc"))
      .addText((text) =>
        text.setValue(settings.orderedDelimiter).onChange((value) => {
          settings.orderedDelimiter = value;
          this.plugin.saveSettings();
        })
      );

    //* orderedTrailingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.orderedTrailingDelimiter).onChange((value) => {
          settings.orderedTrailingDelimiter = value;
          value
            ? orderedCustomTrailingDelimiterContainerEl.show()
            : orderedCustomTrailingDelimiterContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const orderedCustomTrailingDelimiterContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* orderedCustomTrailingDelimiter
    new Setting(orderedCustomTrailingDelimiterContainerEl)
      .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(settings.orderedCustomTrailingDelimiter || "")
          .onChange((value) => {
            settings.orderedCustomTrailingDelimiter = value;
            this.plugin.saveSettings();
          });
      });

    if (!settings.orderedTrailingDelimiter) {
      orderedCustomTrailingDelimiterContainerEl.hide();
    }

    //* orderedLeadingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.orderedLeadingDelimiter || false)
          .onChange((value) => {
            settings.orderedLeadingDelimiter = value;
            value
              ? orderedCustomLeadingDelimiterContainerEl.show()
              : orderedCustomLeadingDelimiterContainerEl.hide();
            this.plugin.saveSettings();
          })
      );

    const orderedCustomLeadingDelimiterContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* orderedCustomLeadingDelimiter
    new Setting(orderedCustomLeadingDelimiterContainerEl)
      .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(settings.orderedCustomLeadingDelimiter || "")
          .onChange((value) => {
            settings.orderedCustomLeadingDelimiter = value;
            this.plugin.saveSettings();
          });
      });

    if (!settings.orderedLeadingDelimiter) {
      orderedCustomLeadingDelimiterContainerEl.hide();
    }

    const orderedCustomIdentsContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* orderedCustomIdents
    new Setting(orderedCustomIdentsContainerEl)
      .setName(i18n.t("setting.orderedCustomIdents"))
      .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
      .addText((text) =>
        text.setValue(settings.orderedCustomIdents).onChange((value) => {
          settings.orderedCustomIdents = value;
          this.plugin.saveSettings();
        })
      );

    if (settings.orderedStyleType !== "customIdent") {
      orderedCustomIdentsContainerEl.hide();
    }

    const orderedSpecifiedStringContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* orderedSpecifiedString
    new Setting(orderedSpecifiedStringContainerEl)
      .setName(i18n.t("setting.orderedSpecifiedString"))
      .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
      .addText((text) =>
        text.setValue(settings.orderedSpecifiedString).onChange((value) => {
          settings.orderedSpecifiedString = value;
          this.plugin.saveSettings();
        })
      );

    if (settings.orderedStyleType !== "string") {
      orderedSpecifiedStringContainerEl.hide();
    }
  }

  private independentSettings(
    containerEl: HTMLElement,
    settings: IndependentSettings
  ) {
    const {
      plugin: { i18n },
    } = this;

    new Setting(containerEl)
      .setName(i18n.t("setting.independent"))
      .setHeading();

    //* orderedRecLevel
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedRecLevel"))
      .setDesc(i18n.t("setting.orderedRecLevelDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(2, 6, 1)
          .setValue(settings.orderedRecLevel)
          .onChange((value) => {
            settings.orderedRecLevel = value;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip();
      });

    //* h1
    new Setting(containerEl).setName(i18n.t("setting.h1")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h1);

    //* h2
    new Setting(containerEl).setName(i18n.t("setting.h2")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h2);

    //* h3
    new Setting(containerEl).setName(i18n.t("setting.h3")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h3);

    //* h4
    new Setting(containerEl).setName(i18n.t("setting.h4")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h4);

    //* h5
    new Setting(containerEl).setName(i18n.t("setting.h5")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h5);

    //* h6
    new Setting(containerEl).setName(i18n.t("setting.h6")).setHeading();
    this.independentDecoratorSettings(containerEl, settings.h6);
  }

  private unorderedSettings(
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings
  ) {
    const {
      plugin: { i18n },
    } = this;

    new Setting(containerEl).setName(i18n.t("setting.unordered")).setHeading();

    //* unorderedLevelHeadings
    new Setting(containerEl)
      .setName(i18n.t("setting.unorderedLevelHeadings"))
      .setDesc(i18n.t("setting.unorderedLevelHeadingsDesc"))
      .addText((text) =>
        text.setValue(settings.unorderedLevelHeadings).onChange((value) => {
          settings.unorderedLevelHeadings = value;
          this.plugin.saveSettings();
        })
      );
  }

  private logicSettings(
    containerEl: HTMLElement,
    settings: HeadingDecoratorSettings
  ) {
    const {
      plugin: { i18n },
    } = this;

    new Setting(containerEl).setName(i18n.t("setting.logic")).setHeading();

    //* orderedAllowZeroLevel
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedAllowZeroLevel"))
      .setDesc(i18n.t("setting.orderedAllowZeroLevelDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.orderedAllowZeroLevel ?? false)
          .onChange((value) => {
            settings.orderedAllowZeroLevel = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedBasedOnExisting
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedBasedOnExisting"))
      .setDesc(i18n.t("setting.orderedBasedOnExistingDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.orderedBasedOnExisting ?? false)
          .onChange((value) => {
            settings.orderedBasedOnExisting = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedAlwaysIgnore
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedAlwaysIgnore"))
      .setDesc(i18n.t("setting.orderedAlwaysIgnoreDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.orderedAlwaysIgnore ?? false)
          .onChange((value) => {
            settings.orderedAlwaysIgnore = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedIgnoreSingle
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedIgnoreSingle"))
      .setDesc(i18n.t("setting.orderedIgnoreSingleDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.orderedIgnoreSingle).onChange((value) => {
          settings.orderedIgnoreSingle = value;
          this.plugin.saveSettings();
        })
      );

    //* orderedIgnoreMaximum
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedIgnoreMaximum"))
      .setDesc(i18n.t("setting.orderedIgnoreMaximumDesc"))
      .addSlider((slider) =>
        slider
          .setLimits(1, 6, 1)
          .setValue(settings.orderedIgnoreMaximum ?? 6)
          .onChange((value) => {
            settings.orderedIgnoreMaximum = value;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip()
      );
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
          this.display();
        });
      });

    settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(
          i18n.t("setting.folderBlocklistIndex", {
            index: index + 1,
          })
        )
        .addText((text) => {
          text.setValue(folder).onChange((value) => {
            settings.folderBlacklist[index] = value;
            this.plugin.saveSettings();
          });

          const suggest = new FolderSuggest(this.app, text.inputEl);
          suggest.onSelect((value) => {
            text.setValue(value);
            settings.folderBlacklist[index] = value;
            suggest.close();
            this.plugin.saveSettings();
          });
        })
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
            .setWarning()
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
          this.display();
        });
      });

    settings.fileRegexBlacklist.forEach((regex, index) => {
      new Setting(containerEl)
        .setName(
          i18n.t("setting.fileRegexBlocklistIndex", {
            index: index + 1,
          })
        )
        .addText((text) =>
          text
            .setPlaceholder(i18n.t("setting.fileRegexBlocklistPlaceholder"))
            .setValue(regex)
            .onChange((value) => {
              settings.fileRegexBlacklist[index] = value.trim();
              this.plugin.saveSettings();
            })
        )
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
            .setWarning()
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
    containerEl: HTMLElement,
    settings: IndependentDecoratorSettings
  ) {
    const {
      plugin: { i18n },
    } = this;

    //* styleType
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedStyleType"))
      .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(this.styleTypeOptions)
          .setValue(settings.styleType)
          .onChange((value: OrderedCounterStyleType) => {
            settings.styleType = value;
            switch (value) {
              case "customIdent":
                customIdentsContainerEl.show();
                specifiedStringContainerEl.hide();
                break;
              case "string":
                specifiedStringContainerEl.show();
                customIdentsContainerEl.hide();
                break;
              default:
                customIdentsContainerEl.hide();
                specifiedStringContainerEl.hide();
                break;
            }
            this.plugin.saveSettings();
          })
      );

    //* delimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedDelimiter"))
      .setDesc(i18n.t("setting.orderedDelimiterDesc"))
      .addText((text) =>
        text.setValue(settings.delimiter).onChange((value) => {
          settings.delimiter = value;
          this.plugin.saveSettings();
        })
      );

    //* trailingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle.setValue(settings.trailingDelimiter).onChange((value) => {
          settings.trailingDelimiter = value;
          value
            ? customTrailingDelimiterContainerEl.show()
            : customTrailingDelimiterContainerEl.hide();
          this.plugin.saveSettings();
        })
      );

    const customTrailingDelimiterContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* customTrailingDelimiter
    new Setting(customTrailingDelimiterContainerEl)
      .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(settings.customTrailingDelimiter || "")
          .onChange((value) => {
            settings.customTrailingDelimiter = value;
            this.plugin.saveSettings();
          });
      });

    if (!settings.trailingDelimiter) {
      customTrailingDelimiterContainerEl.hide();
    }

    //* leadingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.leadingDelimiter || false)
          .onChange((value) => {
            settings.leadingDelimiter = value;
            value
              ? customLeadingDelimiterContainerEl.show()
              : customLeadingDelimiterContainerEl.hide();
            this.plugin.saveSettings();
          })
      );

    const customLeadingDelimiterContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* customLeadingDelimiter
    new Setting(customLeadingDelimiterContainerEl)
      .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(settings.customLeadingDelimiter || "")
          .onChange((value) => {
            settings.customLeadingDelimiter = value;
            this.plugin.saveSettings();
          });
      });

    if (!settings.leadingDelimiter) {
      customLeadingDelimiterContainerEl.hide();
    }

    const customIdentsContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* customIdents
    new Setting(customIdentsContainerEl)
      .setName(i18n.t("setting.orderedCustomIdents"))
      .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
      .addText((text) =>
        text.setValue(settings.customIdents).onChange((value) => {
          settings.customIdents = value;
          this.plugin.saveSettings();
        })
      );

    if (settings.styleType !== "customIdent") {
      customIdentsContainerEl.hide();
    }

    const specifiedStringContainerEl = containerEl.createDiv(
      className.settingItem
    );

    //* specifiedString
    new Setting(specifiedStringContainerEl)
      .setName(i18n.t("setting.orderedSpecifiedString"))
      .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
      .addText((text) =>
        text.setValue(settings.specifiedString).onChange((value) => {
          settings.specifiedString = value;
          this.plugin.saveSettings();
        })
      );

    if (settings.styleType !== "string") {
      specifiedStringContainerEl.hide();
    }
  }
}
