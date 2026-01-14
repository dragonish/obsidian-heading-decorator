import { Setting } from "obsidian";

export class SettingDisplayManager {
  constructor(
    private items: Array<Setting | SettingDisplayManager> = [],
    private state: boolean = true
  ) {}

  add(item: Setting | SettingDisplayManager) {
    this.items.push(item);
  }

  hide() {
    this.state = false;
    this._hide();
  }

  show() {
    this.state = true;
    this._show();
  }

  private _hide() {
    this.items.forEach((item) => {
      if (item instanceof Setting) {
        item.settingEl.hide();
      } else {
        item._hide();
      }
    });
  }

  private _show() {
    if (this.state) {
      this.items.forEach((item) => {
        if (item instanceof Setting) {
          item.settingEl.show();
        } else {
          item._show();
        }
      });
    }
  }
}
