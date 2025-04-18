import { htmlToMarkdown } from "obsidian";
import {
  headingDecoratorClassName,
  readingHeadingDecoratorClassName,
  beforeDecoratorClassName,
  beforeInsideDecoratorClassName,
  afterDecoratorClassName,
  afterInsideDecoratorClassName,
  outlineHeadingDecoratorClassName,
  compareMarkdownText,
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
 * @param ignoreInsideFlag Whether to ignore the inside flag.
 * @returns The class name.
 */
export function getPositionClassName(
  position: PostionOptions,
  ignoreInsideFlag?: boolean
): string {
  switch (position) {
    case "before":
      return beforeDecoratorClassName;
    case "after":
      return afterDecoratorClassName;
    case "before-inside":
      return ignoreInsideFlag
        ? beforeDecoratorClassName
        : beforeInsideDecoratorClassName;
    case "after-inside":
      return ignoreInsideFlag
        ? afterDecoratorClassName
        : afterInsideDecoratorClassName;
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
  if (content) {
    const span = element.createSpan({
      cls: [
        headingDecoratorClassName,
        readingHeadingDecoratorClassName,
        getPositionClassName(position),
      ],
      text: content,
      attr: {
        "data-decorator-opacity": `${opacity}%`,
      },
    });

    if (position === "before-inside") {
      const headingCollapseIndicator = element.find(
        ".heading-collapse-indicator"
      );
      if (headingCollapseIndicator) {
        headingCollapseIndicator.after(span);
      } else {
        const firstChild = element.firstChild;
        if (firstChild) {
          firstChild.before(span);
        } else {
          element.appendChild(span);
        }
      }
    } else if (position === "before") {
      const firstChild = element.firstChild;
      if (firstChild) {
        firstChild.before(span);
      } else {
        element.appendChild(span);
      }
    } else {
      element.appendChild(span);
    }
  }
}

/**
 * Get the tree item level of a given element.
 *
 * @param element The element to get the tree item level for.
 * @returns The tree item level.
 */
export function getTreeItemLevel(element: Element): number {
  let level = 0;
  let current = element.closest(".tree-item");
  while (current) {
    level++;
    current = current.parentElement?.closest(".tree-item") || null;
  }
  return level;
}

/**
 * Get the text of a given tree item.
 *
 * @param element The HTML element to get the text for.
 * @returns The text of the tree item.
 */
export function getTreeItemText(element: HTMLElement): string {
  const inner = element.querySelector<HTMLElement>(
    ".tree-item-self .tree-item-inner"
  );
  return inner ? inner.innerText : "";
}

/**
 * Decorate an outline HTML element with a given content, opacity and position.
 *
 * @param element The HTML element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 */
export function decorateOutlineElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions
): void {
  if (content) {
    const inner = element.querySelector<HTMLElement>(
      ".tree-item-self .tree-item-inner"
    );
    if (inner) {
      inner.dataset.headingDecorator = content;
      inner.dataset.decoratorOpacity = `${opacity}%`;
      inner.classList.add(
        outlineHeadingDecoratorClassName,
        getPositionClassName(position, true)
      );
    }
  }
}

/**
 * Compare heading text.
 *
 * @param source The source heading text.
 * @param outline The outline heading text.
 * @returns true if the two headings are equal, false otherwise.
 */
export function compareHeadingText(source: string, outline: string): boolean {
  return compareMarkdownText(htmlToMarkdown(source), htmlToMarkdown(outline));
}
