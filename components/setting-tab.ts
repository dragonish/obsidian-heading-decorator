import { App, PluginSettingTab, Setting } from "obsidian";
import type { HeadingPlugin } from "./plugin";
import type { OrderedCounterStyleType } from "../common/data";
import { orderedStyleTypeOptions } from "../common/options";
import { FolderSuggest } from "./suggest";

export class HeadingSettingTab extends PluginSettingTab {
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
      .setName(this.plugin.i18n.t("setting.metadataKeyword"))
      .addText((text) =>
        text
          .setPlaceholder(
            this.plugin.i18n.t("setting.metadataKeywordPlaceholder")
          )
          .setValue(this.plugin.settings.metadataKeyword)
          .onChange(async (value) => {
            this.plugin.settings.metadataKeyword = value.trim();
            await this.plugin.saveSettings();
          })
      );

    const metadataKeywordDesc = createFragment();
    const metadataKeywordDescTuple = this.plugin.i18n.getPlaceholderTuple(
      "setting.metadataKeywordDesc"
    );
    metadataKeywordDesc.append(
      metadataKeywordDescTuple[0],
      createEl("a", {
        href: "https://help.obsidian.md/Editing+and+formatting/Properties",
        text: this.plugin.i18n.t("setting.properties"),
      }),
      metadataKeywordDescTuple[1]
    );
    metadataKeywordSetting.descEl.appendChild(metadataKeywordDesc);

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.reading"))
      .setHeading();

    //* enabledInReading
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInReading"))
      .setDesc(this.plugin.i18n.t("setting.enabledInReadingDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInReading)
          .onChange(async (value) => {
            this.plugin.settings.enabledInReading = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInReadingManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("readingSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.livePreview"))
      .setHeading();

    //* enabledInPreview
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInPreview"))
      .setDesc(this.plugin.i18n.t("setting.enabledInPreviewDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInPreview)
          .onChange(async (value) => {
            this.plugin.settings.enabledInPreview = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInPreviewManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("previewSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.sourceMode"))
      .setHeading();

    //* enabledInSource
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInSource"))
      .setDesc(this.plugin.i18n.t("setting.enabledInSourceDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInSource)
          .onChange(async (value) => {
            this.plugin.settings.enabledInSource = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInSourceManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("sourceSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.outline"))
      .setHeading();

    //* enabledInOutline
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInOutline"))
      .setDesc(this.plugin.i18n.t("setting.enabledInOutlineDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInOutline)
          .onChange(async (value) => {
            this.plugin.settings.enabledInOutline = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInOutlineManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("outlineSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.quietOutline"))
      .setHeading();

    //* enabledInQuietOutline
    const enabledInQuietOutlineSetting = new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInQuietOutline"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInQuietOutline)
          .onChange(async (value) => {
            this.plugin.settings.enabledInQuietOutline = value;
            await this.plugin.saveSettings();
          })
      );

    const enabledInQuietOutlineDesc = createFragment();
    const enabledInQuietOutLineDescTuple = this.plugin.i18n.getPlaceholderTuple(
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

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInQuietOutlineManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("quietOutlineSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.fileExplorer"))
      .setHeading();

    //* enabledInFileExplorer
    const enabledInFileExplorerSetting = new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInFileExplorer"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInFileExplorer)
          .onChange(async (value) => {
            this.plugin.settings.enabledInFileExplorer = value;
            await this.plugin.saveSettings();
          })
      );

    const enabledInFileExplorerDesc = createFragment();
    const enabledInFileExplorerDescTuple = this.plugin.i18n.getPlaceholderTuple(
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

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInFileExplorerManage"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageHeadingDecoratorSettings("fileExplorerSettings");
          });
      });

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.blocklist"))
      .setHeading();

    //* folderBlacklist
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.folderBlacklist"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
            this.manageFolderBlacklist(true);
          });
      });

    //* fileRegexBlacklist
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.fileRegexBlacklist"))
      .addButton((button) => {
        button
          .setButtonText(this.plugin.i18n.t("button.manage"))
          .onClick(() => {
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
    const { containerEl } = this;

    containerEl.empty();

    let tabName = "";
    switch (settingsType) {
      case "readingSettings":
        tabName = this.plugin.i18n.t("setting.enabledInReadingManage");
        break;
      case "previewSettings":
        tabName = this.plugin.i18n.t("setting.enabledInPreviewManage");
        break;
      case "sourceSettings":
        tabName = this.plugin.i18n.t("setting.enabledInSourceManage");
        break;
      case "outlineSettings":
        tabName = this.plugin.i18n.t("setting.enabledInOutlineManage");
        break;
      case "quietOutlineSettings":
        tabName = this.plugin.i18n.t("setting.enabledInQuietOutlineManage");
        break;
      case "fileExplorerSettings":
        tabName = this.plugin.i18n.t("setting.enabledInFileExplorerManage");
        break;
    }

    new Setting(containerEl)
      .setName(tabName)
      .setHeading()
      .addButton((button) => {
        button.setButtonText(this.plugin.i18n.t("button.back")).onClick(() => {
          this.display();
        });
      });

    //* enabledInEachNote
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.enabledInEachNote"))
      .setDesc(this.plugin.i18n.t("setting.enabledInEachNoteDesc"))
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

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.effect"))
      .setHeading();

    //* ordered
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.ordered"))
      .setDesc(this.plugin.i18n.t("setting.orderedDesc"))
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
      .setName(this.plugin.i18n.t("setting.opacity"))
      .setDesc(this.plugin.i18n.t("setting.opacityDesc"))
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
      .setName(this.plugin.i18n.t("setting.position"))
      .setDesc(this.plugin.i18n.t("setting.positionDesc"))
      .addDropdown((dropdown) => {
        const options: Record<string, string> =
          settingsType === "outlineSettings" ||
          settingsType === "quietOutlineSettings" ||
          settingsType === "fileExplorerSettings"
            ? {
                before: this.plugin.i18n.t("setting.before"),
                after: this.plugin.i18n.t("setting.after"),
              }
            : {
                before: this.plugin.i18n.t("setting.before"),
                "before-inside": this.plugin.i18n.t("setting.beforeInside"),
                after: this.plugin.i18n.t("setting.after"),
                "after-inside": this.plugin.i18n.t("setting.afterInside"),
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

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.ordered"))
      .setHeading();

    //* orderedStyleType
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.orderedStyleType"))
      .setDesc(this.plugin.i18n.t("setting.orderedStyleTypeDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedDelimiter"))
      .setDesc(this.plugin.i18n.t("setting.orderedDelimiterDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedTrailingDelimiter"))
      .setDesc(this.plugin.i18n.t("setting.orderedTrailingDelimiterDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedCustomIdents"))
      .setDesc(this.plugin.i18n.t("setting.orderedCustomIdentsDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedSpecifiedString"))
      .setDesc(this.plugin.i18n.t("setting.orderedSpecifiedStringDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedAllowZeroLevel"))
      .setDesc(this.plugin.i18n.t("setting.orderedAllowZeroLevelDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedBasedOnExisting"))
      .setDesc(this.plugin.i18n.t("setting.orderedBasedOnExistingDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedIgnoreSingle"))
      .setDesc(this.plugin.i18n.t("setting.orderedIgnoreSingleDesc"))
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
      .setName(this.plugin.i18n.t("setting.orderedIgnoreMaximum"))
      .setDesc(this.plugin.i18n.t("setting.orderedIgnoreMaximumDesc"))
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

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.unordered"))
      .setHeading();

    //* unorderedLevelHeadings
    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.unorderedLevelHeadings"))
      .setDesc(this.plugin.i18n.t("setting.unorderedLevelHeadingsDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings[settingsType].unorderedLevelHeadings)
          .onChange(async (value) => {
            this.plugin.settings[settingsType].unorderedLevelHeadings = value;
            await this.plugin.saveSettings();
          })
      );

    if (settingsType === "sourceSettings") {
      new Setting(containerEl)
        .setName(this.plugin.i18n.t("setting.other"))
        .setHeading();

      //* hideNumberSigns
      new Setting(containerEl)
        .setName(this.plugin.i18n.t("setting.hideNumberSigns"))
        .setDesc(this.plugin.i18n.t("setting.hideNumberSignsDesc"))
        .addToggle((toggle) => {
          toggle
            .setValue(
              this.plugin.settings[settingsType].hideNumberSigns ?? false
            )
            .onChange(async (value) => {
              this.plugin.settings[settingsType].hideNumberSigns = value;
              await this.plugin.saveSettings();
            });
        });
    }

    //* Scroll back to the top
    containerEl.scrollTo({ top: 0, behavior: "smooth" });
  }

  private manageFolderBlacklist(scrollToTop = false) {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.folderBlacklist"))
      .setHeading()
      .addButton((button) => {
        button.setButtonText(this.plugin.i18n.t("button.back")).onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(
          this.plugin.i18n.t("setting.folderBlocklistIndex", {
            index: index + 1,
          })
        )
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
            .setButtonText(this.plugin.i18n.t("button.delete"))
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
        .setButtonText(this.plugin.i18n.t("button.add"))
        .setCta()
        .setTooltip(this.plugin.i18n.t("setting.folderBlocklistAddTip"))
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
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(this.plugin.i18n.t("setting.fileRegexBlacklist"))
      .setHeading()
      .addButton((button) => {
        button.setButtonText(this.plugin.i18n.t("button.back")).onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.fileRegexBlacklist.forEach((regex, index) => {
      new Setting(containerEl)
        .setName(
          this.plugin.i18n.t("setting.fileRegexBlocklistIndex", {
            index: index + 1,
          })
        )
        .addText((text) =>
          text
            .setPlaceholder(
              this.plugin.i18n.t("setting.fileRegexBlocklistPlaceholder")
            )
            .setValue(regex)
            .onChange(async (value) => {
              this.plugin.settings.fileRegexBlacklist[index] = value.trim();
              await this.plugin.saveSettings();
            })
        )
        .addButton((button) => {
          button
            .setButtonText(this.plugin.i18n.t("button.delete"))
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
        .setButtonText(this.plugin.i18n.t("button.add"))
        .setCta()
        .setTooltip(this.plugin.i18n.t("setting.fileRegexBlocklistAddTip"))
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
