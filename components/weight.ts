import { EditorView, WidgetType } from "@codemirror/view";
import {
  previewHeadingDecoratorClassName,
  sourceHeadingDecoratorClassName,
} from "../common/data";
import { getPositionClassName } from "../common/dom";

export class HeadingWidget extends WidgetType {
  readonly isLivePreviwMode: boolean;
  readonly content: string;
  readonly opacity: OpacityOptions;
  readonly position: PostionOptions;

  constructor(
    isLivePreviwMode: boolean,
    content: string,
    opacity: OpacityOptions,
    position: PostionOptions
  ) {
    super();
    this.isLivePreviwMode = isLivePreviwMode;
    this.content = content;
    this.opacity = opacity;
    this.position = position;
  }

  toDOM(view: EditorView): HTMLElement {
    const headingClassName = this.isLivePreviwMode
      ? previewHeadingDecoratorClassName
      : sourceHeadingDecoratorClassName;

    const span = view.dom.createSpan({
      cls: [headingClassName, getPositionClassName(this.position)],
      text: this.content,
      attr: {
        "data-decorator-opacity": `${this.opacity}%`,
      },
    });

    return span;
  }

  eq(widget: HeadingWidget): boolean {
    return (
      widget.isLivePreviwMode === this.isLivePreviwMode &&
      widget.content === this.content &&
      widget.opacity === this.opacity &&
      widget.position === this.position
    );
  }

  destroy(dom: HTMLElement): void {
    dom.remove();
  }
}
