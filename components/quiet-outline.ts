import type { HeadingDecoratorSettings } from "../common/data";
import {
  quietOutlineHeadingDecoratorClassName,
  quietOutlineContainerClassName,
  beforeDecoratorClassName,
  afterDecoratorClassName,
  getOrderedCustomIdents,
  getUnorderedLevelHeadings,
} from "../common/data";
import { Querier, Counter } from "../common/counter";

/**
 * Handles the quiet outline for a given set of heading elements.
 *
 * @param settings - The settings to use for the quiet outline.
 * @param container - The container element to add the quiet outline to.
 * @param headingElements - The heading elements to process.
 */
export function quietOutlineHandler(
  settings: HeadingDecoratorSettings,
  container: HTMLElement,
  headingElements: NodeListOf<HTMLElement>
): void {
  const {
    opacity,
    position,
    ordered,
    maxRecLevel,
    orderedDelimiter,
    orderedTrailingDelimiter,
    orderedCustomTrailingDelimiter,
    orderedStyleType,
    orderedSpecifiedString,
    orderedCustomIdents,
    orderedAlwaysIgnore,
    orderedIgnoreSingle,
    orderedIgnoreMaximum = 6,
    orderedBasedOnExisting,
    orderedAllowZeroLevel,
    unorderedLevelHeadings,
  } = settings;

  container.classList.add(quietOutlineContainerClassName);

  let ignoreTopLevel = 0;
  if (ordered) {
    const ignoreSingle = !orderedAlwaysIgnore && orderedIgnoreSingle;
    const ignoreLimit = orderedAlwaysIgnore ? orderedIgnoreMaximum : 0;
    if (ignoreSingle || orderedBasedOnExisting) {
      const queier = new Querier(orderedAllowZeroLevel, maxRecLevel);
      for (const eleIndex in headingElements) {
        const level = queryHeadingLevelByQuietOutlineElement(
          headingElements[eleIndex]
        );
        queier.handler(level);
        ignoreTopLevel = queier.query(ignoreSingle, orderedIgnoreMaximum);
        if (ignoreTopLevel <= ignoreLimit) {
          break;
        }
      }
    }
    if (ignoreTopLevel < ignoreLimit) {
      ignoreTopLevel = ignoreLimit;
    }
  }

  const counter = new Counter({
    ordered,
    maxRecLevel,
    delimiter: orderedDelimiter,
    trailingDelimiter: orderedTrailingDelimiter,
    customTrailingDelimiter: orderedCustomTrailingDelimiter,
    styleType: orderedStyleType,
    customIdents: getOrderedCustomIdents(orderedCustomIdents),
    specifiedString: orderedSpecifiedString,
    ignoreTopLevel,
    allowZeroLevel: orderedAllowZeroLevel,
    levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
  });

  headingElements.forEach((headingEle) => {
    const level = queryHeadingLevelByQuietOutlineElement(headingEle);
    const decoratorContent = counter.decorator(level);
    decorateQuietOutlineElement(
      headingEle,
      decoratorContent,
      opacity,
      position
    );
  });
}

/**
 * Cancel the decoration for all headings in a container.
 *
 * @param container The container element that contains the headings.
 */
export function cancelQuietOutlineDecoration(container: HTMLElement): void {
  if (container.classList.contains(quietOutlineContainerClassName)) {
    container.classList.remove(quietOutlineContainerClassName);

    const headingElements =
      container.querySelectorAll<HTMLElement>(".n-tree-node");

    headingElements.forEach((ele) => {
      cancelQuietOutlineDecorator(ele);
    });
  }
}

/**
 * Query the heading level of an HTML element that is part of the quiet outline.
 *
 * @param element
 * @returns The heading level or `-1` if not found.
 */
function queryHeadingLevelByQuietOutlineElement(element: HTMLElement): number {
  const classList = element.classList;
  if (classList.contains("level-1")) {
    return 1;
  } else if (classList.contains("level-2")) {
    return 2;
  } else if (classList.contains("level-3")) {
    return 3;
  } else if (classList.contains("level-4")) {
    return 4;
  } else if (classList.contains("level-5")) {
    return 5;
  } else if (classList.contains("level-6")) {
    return 6;
  }

  return -1;
}

/**
 * Decorate an HTML element that is part of the quiet outline with a heading decorator.
 *
 * @param element The HTML element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 */
function decorateQuietOutlineElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions
): void {
  const nodeContent = element.querySelector<HTMLElement>(
    ".n-tree-node-content"
  );
  if (nodeContent) {
    nodeContent.dataset.headingDecorator = content;
    nodeContent.dataset.decoratorOpacity = `${opacity}%`;

    const isAfter = position.includes("after");
    //? Remove potential residual class names
    nodeContent.classList.remove(
      isAfter ? beforeDecoratorClassName : afterDecoratorClassName
    );
    nodeContent.classList.add(
      quietOutlineHeadingDecoratorClassName,
      isAfter ? afterDecoratorClassName : beforeDecoratorClassName
    );
  }
}

/**
 * Cancel the decorator from an HTML element that is part of the quiet outline.
 *
 * @param element The HTML element to cancel the decorator.
 */
function cancelQuietOutlineDecorator(element: HTMLElement): void {
  const nodeContent = element.querySelector<HTMLElement>(
    ".n-tree-node-content"
  );
  if (nodeContent) {
    delete nodeContent.dataset.headingDecorator;
    delete nodeContent.dataset.decoratorOpacity;
    nodeContent.classList.remove(
      quietOutlineHeadingDecoratorClassName,
      beforeDecoratorClassName,
      afterDecoratorClassName
    );
  }
}
