import type { OpacityOptions, PostionOptions } from "./data";
import {
  headingDecoratorClassName,
  beforeDecoratorClassName,
  afterDecoratorClassName,
} from "./data";

/**
 * Query the heading level of an HTML element.
 *
 * @param element
 * @returns Return `-1` for non-heading elements.
 */
export function queryHeadingLevelByElement(element: HTMLElement): number {
  switch (element.tagName.toLowerCase()) {
    case "h1":
      return 1;
    case "h2":
      return 2;
    case "h3":
      return 3;
    case "h4":
      return 4;
    case "h5":
      return 5;
    case "h6":
      return 6;
    default:
      return -1;
  }
}

/**
 * Get the class name for a given position.
 *
 * @param position The position to get the class name for.
 * @returns The class name.
 */
export function getPositionClassName(position: PostionOptions): string {
  switch (position) {
    case "before":
      return beforeDecoratorClassName;
    case "after":
      return afterDecoratorClassName;
    default:
      return "";
  }
}

/**
 * Decorate an HTML element with a given content, opacity and position.
 *
 * @param element The HTML element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 */
export function decorateHTMLElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions
): void {
  element.dataset.headingDecorator = content;
  element.dataset.decoratorOpacity = `${opacity}%`;
  element.classList.add(
    headingDecoratorClassName,
    getPositionClassName(position)
  );
}
