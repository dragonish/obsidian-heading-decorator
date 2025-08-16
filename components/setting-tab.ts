import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import type { HeadingPlugin } from "./plugin";
import type { OrderedCounterStyleType } from "../common/data";
import { orderedStyleTypeOptions } from "../common/options";
import { FolderSuggest } from "./suggest";

type ButtonOrUndefined = ButtonComponent | undefined;

export class HeadingSettingTab extends PluginSettingTab {
  plugin: HeadingPlugin;

  constructor(app: App, plugin: HeadingPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {
      containerEl,
      plugin: { i18n },
    } = this;

    containerEl.empty();

    //* metadataKeyword
    const metadataKeywordSetting = new Setting(containerEl)
      .setName(i18n.t("setting.metadataKeyword"))
      .addText((text) =>
        text
          .setPlaceholder(i18n.t("setting.metadataKeywordPlaceholder"))
          .setValue(this.plugin.settings.metadataKeyword)
          .onChange((value) => {
            this.plugin.settings.metadataKeyword = value.trim();
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
        toggle
          .setValue(this.plugin.settings.enabledInReading)
          .onChange((value) => {
            this.plugin.settings.enabledInReading = value;
            this.plugin.saveSettings();
          })
      );

    let readingConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInReadingConfig"))
      .setDesc(i18n.t("setting.enabledInReadingConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledReadingSettings)
          .onChange((value) => {
            this.plugin.settings.enabledReadingSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledReadingSettings);
      });

    new Setting(containerEl)
      .setName(i18n.t("setting.livePreview"))
      .setHeading();

    //* enabledInPreview
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInPreview"))
      .setDesc(i18n.t("setting.enabledInPreviewDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInPreview)
          .onChange((value) => {
            this.plugin.settings.enabledInPreview = value;
            this.plugin.saveSettings();
          })
      );

    let previewConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInPreviewConfig"))
      .setDesc(i18n.t("setting.enabledInPreviewConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledPreviewSettings)
          .onChange((value) => {
            this.plugin.settings.enabledPreviewSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledPreviewSettings);
      });

    new Setting(containerEl).setName(i18n.t("setting.sourceMode")).setHeading();

    //* enabledInSource
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInSource"))
      .setDesc(i18n.t("setting.enabledInSourceDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInSource)
          .onChange((value) => {
            this.plugin.settings.enabledInSource = value;
            this.plugin.saveSettings();
          })
      );

    let sourceConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInSourceConfig"))
      .setDesc(i18n.t("setting.enabledInSourceConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledSourceSettings)
          .onChange((value) => {
            this.plugin.settings.enabledSourceSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledSourceSettings);
      });

    //* sourceHideNumberSigns
    new Setting(containerEl)
      .setName(i18n.t("setting.hideNumberSigns"))
      .setDesc(i18n.t("setting.hideNumberSignsDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.sourceHideNumberSigns ?? false)
          .onChange((value) => {
            this.plugin.settings.sourceHideNumberSigns = value;
            this.plugin.saveSettings();
          });
      });

    new Setting(containerEl).setName(i18n.t("setting.outline")).setHeading();

    //* enabledInOutline
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInOutline"))
      .setDesc(i18n.t("setting.enabledInOutlineDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInOutline)
          .onChange((value) => {
            this.plugin.settings.enabledInOutline = value;
            this.plugin.saveSettings();
          })
      );

    let outlineConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInOutlineConfig"))
      .setDesc(i18n.t("setting.enabledInOutlineConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledOutlineSettings)
          .onChange((value) => {
            this.plugin.settings.enabledOutlineSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledOutlineSettings);
      });

    new Setting(containerEl)
      .setName(i18n.t("setting.quietOutline"))
      .setHeading();

    //* enabledInQuietOutline
    const enabledInQuietOutlineSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInQuietOutline"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInQuietOutline)
          .onChange((value) => {
            this.plugin.settings.enabledInQuietOutline = value;
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

    let quietOutlineConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInQuietOutlineConfig"))
      .setDesc(i18n.t("setting.enabledInQuietOutlineConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledQuietOutlineSettings)
          .onChange((value) => {
            this.plugin.settings.enabledQuietOutlineSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledQuietOutlineSettings);
      });

    new Setting(containerEl)
      .setName(i18n.t("setting.fileExplorer"))
      .setHeading();

    //* enabledInFileExplorer
    const enabledInFileExplorerSetting = new Setting(containerEl)
      .setName(i18n.t("setting.enabledInFileExplorer"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInFileExplorer)
          .onChange((value) => {
            this.plugin.settings.enabledInFileExplorer = value;
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

    let fileExplorerConfigBtn: ButtonOrUndefined;
    new Setting(containerEl)
      .setName(i18n.t("setting.enabledInFileExplorerConfig"))
      .setDesc(i18n.t("setting.enabledInFileExplorerConfigDesc"))
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.enabledFileExplorerSettings)
          .onChange((value) => {
            this.plugin.settings.enabledFileExplorerSettings = value;
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
          .setDisabled(!this.plugin.settings.enabledFileExplorerSettings);
      });

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

  private isPositionValue(value: string): value is PostionOptions {
    return ["before", "after", "before-inside", "after-inside"].includes(value);
  }

  private manageHeadingDecoratorSettings(
    settingsType: PluginDecoratorSettingsType
  ) {
    const {
      containerEl,
      plugin: { i18n },
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
          .setValue(
            this.plugin.settings[settingsType].enabledInEachNote ?? true
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].enabledInEachNote = value;
            this.plugin.saveSettings();
          })
      );

    new Setting(containerEl).setName(i18n.t("setting.effect")).setHeading();

    //* ordered
    new Setting(containerEl)
      .setName(i18n.t("setting.ordered"))
      .setDesc(i18n.t("setting.orderedDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].ordered)
          .onChange((value) => {
            this.plugin.settings[settingsType].ordered = value;
            this.plugin.saveSettings();
          })
      );

    //* opacity
    new Setting(containerEl)
      .setName(i18n.t("setting.opacity"))
      .setDesc(i18n.t("setting.opacityDesc"))
      .addSlider((slider) =>
        slider
          .setLimits(10, 100, 10)
          .setValue(this.plugin.settings[settingsType].opacity)
          .onChange((value) => {
            this.plugin.settings[settingsType].opacity = this.isOpacityValue(
              value
            )
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
          .setValue(this.plugin.settings[settingsType].position)
          .onChange((value) => {
            this.plugin.settings[settingsType].position = this.isPositionValue(
              value
            )
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
          .setValue(this.plugin.settings[settingsType].maxRecLevel ?? 6)
          .onChange((value) => {
            this.plugin.settings[settingsType].maxRecLevel = value;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip();
      });

    new Setting(containerEl).setName(i18n.t("setting.ordered")).setHeading();

    //* orderedStyleType
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedStyleType"))
      .setDesc(i18n.t("setting.orderedStyleTypeDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(orderedStyleTypeOptions)
          .setValue(this.plugin.settings[settingsType].orderedStyleType)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedStyleType =
              value as OrderedCounterStyleType;
            this.plugin.saveSettings();
          })
      );

    //* orderedDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedDelimiter"))
      .setDesc(i18n.t("setting.orderedDelimiterDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedDelimiter)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedDelimiter = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedTrailingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedTrailingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].orderedTrailingDelimiter)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedTrailingDelimiter = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedCustomTrailingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedCustomTrailingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomTrailingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(
            this.plugin.settings[settingsType].orderedCustomTrailingDelimiter ||
              ""
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedCustomTrailingDelimiter =
              value;
            this.plugin.saveSettings();
          });
      });

    //* orderedLeadingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedLeadingDelimiterDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedLeadingDelimiter || false
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedLeadingDelimiter = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedCustomLeadingDelimiter
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedCustomLeadingDelimiter"))
      .setDesc(i18n.t("setting.orderedCustomLeadingDelimiterDesc"))
      .addText((text) => {
        text
          .setValue(
            this.plugin.settings[settingsType].orderedCustomLeadingDelimiter ||
              ""
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedCustomLeadingDelimiter =
              value;
            this.plugin.saveSettings();
          });
      });

    //* orderedCustomIdents
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedCustomIdents"))
      .setDesc(i18n.t("setting.orderedCustomIdentsDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedCustomIdents)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedCustomIdents = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedSpecifiedString
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedSpecifiedString"))
      .setDesc(i18n.t("setting.orderedSpecifiedStringDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].orderedSpecifiedString)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedSpecifiedString = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedAllowZeroLevel
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedAllowZeroLevel"))
      .setDesc(i18n.t("setting.orderedAllowZeroLevelDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedAllowZeroLevel ?? false
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedAllowZeroLevel = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedBasedOnExisting
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedBasedOnExisting"))
      .setDesc(i18n.t("setting.orderedBasedOnExistingDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedBasedOnExisting ?? false
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedBasedOnExisting = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedAlwaysIgnore
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedAlwaysIgnore"))
      .setDesc(i18n.t("setting.orderedAlwaysIgnoreDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(
            this.plugin.settings[settingsType].orderedAlwaysIgnore ?? false
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedAlwaysIgnore = value;
            this.plugin.saveSettings();
          })
      );

    //* orderedIgnoreSingle
    new Setting(containerEl)
      .setName(i18n.t("setting.orderedIgnoreSingle"))
      .setDesc(i18n.t("setting.orderedIgnoreSingleDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings[settingsType].orderedIgnoreSingle)
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedIgnoreSingle = value;
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
          .setValue(
            this.plugin.settings[settingsType].orderedIgnoreMaximum ?? 6
          )
          .onChange((value) => {
            this.plugin.settings[settingsType].orderedIgnoreMaximum = value;
            this.plugin.saveSettings();
          })
          .setDynamicTooltip()
      );

    new Setting(containerEl).setName(i18n.t("setting.unordered")).setHeading();

    //* unorderedLevelHeadings
    new Setting(containerEl)
      .setName(i18n.t("setting.unorderedLevelHeadings"))
      .setDesc(i18n.t("setting.unorderedLevelHeadingsDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].unorderedLevelHeadings)
          .onChange((value) => {
            this.plugin.settings[settingsType].unorderedLevelHeadings = value;
            this.plugin.saveSettings();
          })
      );

    //* Scroll back to the top
    containerEl.scrollTo({ top: 0, behavior: "smooth" });
  }

  private manageFolderBlacklist(scrollToTop = false) {
    const {
      containerEl,
      plugin: { i18n },
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

    this.plugin.settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(
          i18n.t("setting.folderBlocklistIndex", {
            index: index + 1,
          })
        )
        .addText((text) => {
          text.setValue(folder).onChange((value) => {
            this.plugin.settings.folderBlacklist[index] = value;
            this.plugin.saveSettings();
          });

          const suggest = new FolderSuggest(this.app, text.inputEl);
          suggest.onSelect((value) => {
            text.setValue(value);
            this.plugin.settings.folderBlacklist[index] = value;
            suggest.close();
            this.plugin.saveSettings();
          });
        })
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
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
        .setButtonText(i18n.t("button.add"))
        .setCta()
        .setTooltip(i18n.t("setting.folderBlocklistAddTip"))
        .onClick(async () => {
          this.plugin.settings.folderBlacklist.push("");
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
      plugin: { i18n },
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

    this.plugin.settings.fileRegexBlacklist.forEach((regex, index) => {
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
              this.plugin.settings.fileRegexBlacklist[index] = value.trim();
              this.plugin.saveSettings();
            })
        )
        .addButton((button) => {
          button
            .setButtonText(i18n.t("button.delete"))
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
        .setButtonText(i18n.t("button.add"))
        .setCta()
        .setTooltip(i18n.t("setting.fileRegexBlocklistAddTip"))
        .onClick(async () => {
          this.plugin.settings.fileRegexBlacklist.push("");
          await this.plugin.saveSettings();
          this.manageFileRegexBlacklist();
        });
    });

    //* Scroll back to the top
    if (scrollToTop) {
      containerEl.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}
