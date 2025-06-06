import { Component, View } from "obsidian";

export class ViewChildComponent extends Component {
  private leafId: string;
  private view: View | null;
  private containerEl: HTMLElement | null;
  private decorationCallback: () => void;
  private cancelDecorationCallback: () => void;
  private observer: MutationObserver | null = null;
  private config: MutationObserverInit = {
    childList: true,
    subtree: true,
  };

  constructor(
    leafId: string,
    view: View,
    containerEl: HTMLElement,
    decorationCallback: () => void,
    cancelDecorationCallback: () => void
  ) {
    super();
    this.leafId = leafId;
    this.view = view;
    this.containerEl = containerEl;
    this.decorationCallback = decorationCallback;
    this.cancelDecorationCallback = cancelDecorationCallback;
  }

  equal(leafId: string): boolean {
    return this.leafId === leafId;
  }

  detach(): void {
    if (this.view) {
      //* Cancel decoration
      this.cancelDecorationCallback();

      this.view.removeChild(this);
    }
  }

  render(): void {
    this.observer?.disconnect();
    this.decorationCallback();
    if (this.containerEl) {
      this.observer?.observe(this.containerEl, this.config);
    }
  }

  onload(): void {
    this.decorationCallback();

    this.observer = new MutationObserver(() => {
      this.render();
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
