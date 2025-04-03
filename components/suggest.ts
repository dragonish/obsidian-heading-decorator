import { App, AbstractInputSuggest } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<string> {
  constructor(
    public app: App,
    public textInputEl: HTMLInputElement | HTMLDivElement
  ) {
    super(app, textInputEl);
  }

  getSuggestions(query: string): string[] {
    const folders = this.app.vault.getAllFolders();
    return folders
      .map((folder) => folder.path)
      .filter((path) => path.toLowerCase().includes(query.toLowerCase()));
  }

  renderSuggestion(value: string, el: HTMLElement) {
    el.setText(value);
  }
}
