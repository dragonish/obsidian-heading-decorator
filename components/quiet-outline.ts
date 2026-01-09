import type { HeadingDecoratorSettings } from "../common/data";
import {
  className,
  getOrderedCustomIdents,
  getUnorderedLevelHeadings,
} from "../common/data";
import {
  Querier,
  UnorderedCounter,
  OrderedCounter,
  IndependentCounter,
} from "../common/counter";

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
    decoratorMode = "orderd",
    opacity,
    position,
    maxRecLevel,
    orderedDelimiter,
    orderedTrailingDelimiter,
    orderedCustomTrailingDelimiter,
    orderedLeadingDelimiter,
    orderedCustomLeadingDelimiter,
    orderedStyleType,
    orderedSpecifiedString,
    orderedCustomIdents,
    orderedAlwaysIgnore,
    orderedIgnoreSingle,
    orderedIgnoreMaximum = 6,
    orderedBasedOnExisting,
    orderedAllowZeroLevel,
    unorderedLevelHeadings,
    independentSettings,
  } = settings;

  container.classList.add(className.quietOutlineContainer);

  let counter: Counter;
  if (decoratorMode === "unordered") {
    counter = new UnorderedCounter(
      getUnorderedLevelHeadings(unorderedLevelHeadings),
      maxRecLevel
    );
  } else {
    let ignoreTopLevel = 0;
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

    if (decoratorMode === "independent") {
      counter = new IndependentCounter({
        maxRecLevel,
        ignoreTopLevel,
        allowZeroLevel: orderedAllowZeroLevel,
        orderedRecLevel: independentSettings?.orderedRecLevel,
        h1: independentSettings?.h1,
        h2: independentSettings?.h2,
        h3: independentSettings?.h3,
        h4: independentSettings?.h4,
        h5: independentSettings?.h5,
        h6: independentSettings?.h6,
      });
    } else {
      counter = new OrderedCounter({
        maxRecLevel,
        ignoreTopLevel,
        allowZeroLevel: orderedAllowZeroLevel,
        delimiter: orderedDelimiter,
        trailingDelimiter: orderedTrailingDelimiter,
        customTrailingDelimiter: orderedCustomTrailingDelimiter,
        leadingDelimiter: orderedLeadingDelimiter,
        customLeadingDelimiter: orderedCustomLeadingDelimiter,
        styleType: orderedStyleType,
        customIdents: getOrderedCustomIdents(orderedCustomIdents),
        specifiedString: orderedSpecifiedString,
      });
    }
  }

  headingElements.forEach((headingEle) => {
    const level = queryHeadingLevelByQuietOutlineElement(headingEle);
    const decoratorContent = counter.decorator(level);
    decorateQuietOutlineElement(
      headingEle,
      decoratorContent,
      opacity,
      position,
      level
    );
  });
}

/**
 * Cancel the decoration for all headings in a container.
 *
 * @param container The container element that contains the headings.
 */
export function cancelQuietOutlineDecoration(container: HTMLElement): void {
  if (container.classList.contains(className.quietOutlineContainer)) {
    container.classList.remove(className.quietOutlineContainer);

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
 * @param level The level of the heading.
 */
function decorateQuietOutlineElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions,
  level: number
): void {
  const nodeContent = element.querySelector<HTMLElement>(
    ".n-tree-node-content"
  );
  if (nodeContent) {
    nodeContent.dataset.headingDecorator = content;
    nodeContent.dataset.decoratorOpacity = `${opacity}%`;
    nodeContent.dataset.decoratorLevel = level.toString();

    const isAfter = position.includes("after");
    //? Remove potential residual class names
    nodeContent.classList.remove(isAfter ? className.before : className.after);
    nodeContent.classList.add(
      className.quietOutline,
      isAfter ? className.after : className.before
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
    delete nodeContent.dataset.decoratorLevel;
    nodeContent.classList.remove(
      className.quietOutline,
      className.before,
      className.after
    );
  }
}
