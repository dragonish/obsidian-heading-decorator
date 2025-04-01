import { Component, View } from "obsidian";

export class OutlineChildComponent extends Component {
  private leafId: string;
  private view: View | null;
  private containerEl: HTMLElement | null;
  private callback: () => void;
  private observer: MutationObserver | null = null;
  private config: MutationObserverInit = {
    childList: true,
    subtree: true,
  };

  constructor(
    leafId: string,
    view: View,
    containerEl: HTMLElement,
    callback: () => void
  ) {
    super();
    this.leafId = leafId;
    this.view = view;
    this.containerEl = containerEl;
    this.callback = callback;
  }

  equal(leafId: string): boolean {
    return this.leafId === leafId;
  }

  detach(): void {
    this.view?.removeChild(this);
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
    this.view = null;
  }
}
