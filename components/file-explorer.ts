import { HeadingCache } from "obsidian";
import type { HeadingDecoratorSettings } from "../common/data";
import {
  fileExplorerHeadingDecoratorClassName,
  fileExplorerContainerClassName,
  beforeDecoratorClassName,
  afterDecoratorClassName,
  getOrderedCustomIdents,
  getUnorderedLevelHeadings,
} from "../common/data";
import { Querier, Counter } from "../common/counter";

/**
 * File Explorer Heading Decorator.
 *
 * @param settings The heading decorator settings.
 * @param container The container element.
 * @param headingElements The heading elements.
 * @param cacheHeadings The cache headings.
 */
export function fileExplorerHandler(
  settings: HeadingDecoratorSettings,
  container: HTMLElement,
  headingElements: NodeListOf<HTMLElement>,
  cacheHeadings: HeadingCache[]
): void {
  const {
    opacity,
    position,
    ordered,
    orderedDelimiter,
    orderedTrailingDelimiter,
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

  container.classList.add(fileExplorerContainerClassName);

  let ignoreTopLevel = 0;
  if (ordered) {
    const ignoreSingle = !orderedAlwaysIgnore && orderedIgnoreSingle;
    const ignoreLimit = orderedAlwaysIgnore ? orderedIgnoreMaximum : 0;
    if (ignoreSingle || orderedBasedOnExisting) {
      const queier = new Querier(orderedAllowZeroLevel);
      for (const cacheHeading of cacheHeadings) {
        queier.handler(cacheHeading.level);
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
    delimiter: orderedDelimiter,
    trailingDelimiter: orderedTrailingDelimiter,
    styleType: orderedStyleType,
    customIdents: getOrderedCustomIdents(orderedCustomIdents),
    specifiedString: orderedSpecifiedString,
    ignoreTopLevel,
    allowZeroLevel: orderedAllowZeroLevel,
    levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
  });

  const marginMultiplier =
    parseInt(
      getComputedStyle(document.body).getPropertyValue(
        "--clickable-heading-margin-multiplier"
      )
    ) || 10;

  for (
    let i = 0, j = 0;
    i < headingElements.length && j < cacheHeadings.length;
    i++, j++
  ) {
    const readLevel = getFileHeadingItemLevel(
      headingElements[i],
      marginMultiplier
    );
    const readText = headingElements[i].innerText;
    let cacheLevel = cacheHeadings[j].level;

    while (
      j < cacheHeadings.length - 1 &&
      (cacheLevel !== readLevel || cacheHeadings[j].heading !== readText)
    ) {
      counter.handler(cacheLevel);
      j++;
      cacheLevel = cacheHeadings[j].level;
    }

    const decoratorContent = counter.decorator(cacheLevel);
    decorateFileHeadingElement(
      headingElements[i],
      decoratorContent,
      opacity,
      position
    );
  }
}

/**
 * Cancel the decoration of file headings in a container.
 *
 * @param container The container element containing the file headings.
 */
export function cancelFileExplorerDecoration(container: HTMLElement): void {
  if (container.classList.contains(fileExplorerContainerClassName)) {
    container.classList.remove(fileExplorerContainerClassName);

    const headingElements = container.querySelectorAll<HTMLElement>(
      ".file-heading-container .clickable-heading"
    );

    headingElements.forEach((ele) => {
      cancelFileHeadingDecorator(ele);
    });
  }
}

/**
 * Decorate a file heading element with a custom content and style.
 *
 * @param element The file heading element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 */
function decorateFileHeadingElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions
): void {
  element.dataset.headingDecorator = content;
  element.dataset.decoratorOpacity = `${opacity}%`;

  const isAfter = position.includes("after");
  //? Remove potential residual class names
  element.classList.remove(
    isAfter ? beforeDecoratorClassName : afterDecoratorClassName
  );
  element.classList.add(
    fileExplorerHeadingDecoratorClassName,
    isAfter ? afterDecoratorClassName : beforeDecoratorClassName
  );
}

/**
 * Cancel a file heading decorator from an element.
 *
 * @param element The file heading element to cancel decorator.
 */
function cancelFileHeadingDecorator(element: HTMLElement): void {
  delete element.dataset.headingDecorator;
  delete element.dataset.decoratorOpacity;
  element.classList.remove(
    fileExplorerHeadingDecoratorClassName,
    beforeDecoratorClassName,
    afterDecoratorClassName
  );
}

/**
 * Get the level of a file heading item based on its margin-left value.
 *
 * @param element The file heading item element.
 * @param marginMultiplier The multiplier used to calculate the level.
 * @returns The level of the file heading item.
 */
function getFileHeadingItemLevel(
  element: HTMLElement,
  marginMultiplier: number
): number {
  const marginLeft = element.style.marginLeft;
  if (marginLeft) {
    const value = parseInt(marginLeft.replace("px", ""));
    return Math.floor(value / marginMultiplier) + 1;
  }
  return 0;
}
