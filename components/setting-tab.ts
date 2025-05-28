import { App, PluginSettingTab, Setting } from "obsidian";
import type { HeadingPlugin } from "./plugin";
import type { OrderedCounterStyleType } from "../common/data";
import { orderedStyleTypeOptions } from "../common/data";
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

    const metadataKeywordDesc = createFragment();
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
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Manage outline plugin heading decorator")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("outlineSettings");
        });
      });

    new Setting(containerEl).setName("Quiet Outline plugin").setHeading();

    //* enabledInQuietOutline
    const enabledInQuietOutlineSetting = new Setting(containerEl)
      .setName('Enabled in "Quiet Outline" plugin')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInQuietOutline)
          .onChange(async (value) => {
            this.plugin.settings.enabledInQuietOutline = value;
            await this.plugin.saveSettings();
          })
      );

    const enabledInQuietOutlineDesc = createFragment();
    enabledInQuietOutlineDesc.append(
      "Allow to decorate the heading under the ",
      createEl("a", {
        href: "https://github.com/guopenghui/obsidian-quiet-outline",
        text: "Quiet Outline",
      }),
      " plugin."
    );
    enabledInQuietOutlineSetting.descEl.appendChild(enabledInQuietOutlineDesc);

    new Setting(containerEl)
      .setName('Manage "Quiet Outline" plugin heading decorator')
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("quietOutlineSettings");
        });
      });

    new Setting(containerEl)
      .setName("Headings in Explorer plugin")
      .setHeading();

    //* enabledInFileExplorer
    const enabledInFileExplorerSetting = new Setting(containerEl)
      .setName('Enabled in "Headings in Explorer" plugin')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabledInFileExplorer)
          .onChange(async (value) => {
            this.plugin.settings.enabledInFileExplorer = value;
            await this.plugin.saveSettings();
          })
      );

    const enabledInFileExplorerDesc = createFragment();
    enabledInFileExplorerDesc.append(
      "Allow to decorate the heading under the ",
      createEl("a", {
        href: "https://github.com/patrickchiang/obsidian-headings-in-explorer",
        text: "Headings in Explorer",
      }),
      " plugin."
    );
    enabledInFileExplorerSetting.descEl.appendChild(enabledInFileExplorerDesc);

    new Setting(containerEl)
      .setName('Manage "Headings in Explorer" plugin heading decorator')
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageHeadingDecoratorSettings("fileExplorerSettings");
        });
      });

    new Setting(containerEl).setName("Blocklist").setHeading();

    //* folderBlacklist
    new Setting(containerEl)
      .setName("Manage folder blocklist")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
          this.manageFolderBlacklist(true);
        });
      });

    //* fileRegexBlacklist
    new Setting(containerEl)
      .setName("Manage note name regex blocklist")
      .addButton((button) => {
        button.setButtonText("Manage").onClick(() => {
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
      case "quietOutlineSettings":
        tabName = 'Manage "Quiet Outline" plugin heading decorator';
        break;
      case "fileExplorerSettings":
        tabName = 'Manage "Headings in Explorer" plugin heading decorator';
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
          settingsType === "outlineSettings" ||
          settingsType === "quietOutlineSettings" ||
          settingsType === "fileExplorerSettings"
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

    if (settingsType === "sourceSettings") {
      new Setting(containerEl).setName("Other").setHeading();

      //* hideNumberSigns
      new Setting(containerEl)
        .setName("Hide number signs on inactive lines")
        .setDesc(
          "Hide number signs (#) on inactive lines similar to live preview."
        )
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
      .setName("Manage folder blocklist")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back").onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.folderBlacklist.forEach((folder, index) => {
      new Setting(containerEl)
        .setName(`Folder blocklist ${index + 1}`)
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
        .setTooltip("Add a new folder to the blocklist")
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
      .setName("Manage note name regex blocklist")
      .setHeading()
      .addButton((button) => {
        button.setButtonText("Back").onClick(() => {
          this.display();
        });
      });

    this.plugin.settings.fileRegexBlacklist.forEach((regex, index) => {
      new Setting(containerEl)
        .setName(`Note name regex blocklist ${index + 1}`)
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
        .setTooltip("Add a new note name regex blocklist")
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
