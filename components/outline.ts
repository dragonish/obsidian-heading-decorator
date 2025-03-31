import { Component } from "obsidian";

export class OutlineChildComponent extends Component {
  private containerEl: HTMLElement | null;
  private callback: () => void;
  private observer: MutationObserver | null = null;
  private config: MutationObserverInit = {
    childList: true,
    subtree: true,
  };

  constructor(containerEl: HTMLElement, callback: () => void) {
    super();
    this.containerEl = containerEl;
    this.callback = callback;
  }

  onload(): void {
    this.callback();

    this.observer = new MutationObserver(() => {
      this.observer?.disconnect();
      this.callback();
      if (this.containerEl) {
        this.observer?.observe(this.containerEl, this.config);
      }
    });

    if (this.containerEl) {
      this.observer.observe(this.containerEl, this.config);
    }
  }

  onunload(): void {
    this.observer?.takeRecords();
    this.observer?.disconnect();
    this.observer = null;
    this.containerEl = null;
  }
}
