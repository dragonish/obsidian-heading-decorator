import { HeadingCache, htmlToMarkdown } from "obsidian";
import type { HeadingDecoratorSettings } from "../common/data";
import {
  className,
  getOrderedCustomIdents,
  getUnorderedLevelHeadings,
  diffLevel,
  compareMarkdownText,
} from "../common/data";
import {
  Querier,
  UnorderedCounter,
  OrderedCounter,
  IndependentCounter,
  SpliceCounter,
} from "../common/counter";

/**
 * Handle the outline rendering based on the given settings and heading elements.
 *
 * @param settings The heading decorator settings.
 * @param container The container element to render the outline.
 * @param headingElements The heading elements to render the outline.
 * @param cacheHeadings The cache headings to render the outline.
 */
export function outlineHandler(
  settings: HeadingDecoratorSettings,
  container: HTMLElement,
  headingElements: NodeListOf<HTMLElement>,
  cacheHeadings: HeadingCache[]
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
    spliceSettings,
  } = settings;

  container.classList.add(className.outlineContainer);

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
    } else if (decoratorMode === "splice") {
      counter = new SpliceCounter({
        maxRecLevel,
        ignoreTopLevel,
        allowZeroLevel: orderedAllowZeroLevel,
        delimiter: spliceSettings?.delimiter,
        trailingDelimiter: spliceSettings?.trailingDelimiter,
        customTrailingDelimiter: spliceSettings?.customTrailingDelimiter,
        leadingDelimiter: spliceSettings?.leadingDelimiter,
        customLeadingDelimiter: spliceSettings?.customLeadingDelimiter,
        h1: spliceSettings?.h1,
        h2: spliceSettings?.h2,
        h3: spliceSettings?.h3,
        h4: spliceSettings?.h4,
        h5: spliceSettings?.h5,
        h6: spliceSettings?.h6,
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

  let lastCacheLevel = 0;
  let lastReadLevel = 0;
  for (
    let i = 0, j = 0;
    i < headingElements.length && j < cacheHeadings.length;
    i++, j++
  ) {
    const readLevel = getTreeItemLevel(headingElements[i]);
    const readText = getTreeItemText(headingElements[i]);
    let cacheLevel = cacheHeadings[j].level;
    if (i > 0) {
      const diff = diffLevel(readLevel, lastReadLevel);
      while (
        j < cacheHeadings.length - 1 &&
        (diffLevel(cacheLevel, lastCacheLevel) !== diff ||
          !compareHeadingText(cacheHeadings[j].heading, readText))
      ) {
        counter.handler(cacheLevel);
        j++;
        cacheLevel = cacheHeadings[j].level;
      }
    }

    const decoratorContent = counter.decorator(cacheLevel);
    decorateOutlineElement(
      headingElements[i],
      decoratorContent,
      opacity,
      position,
      cacheLevel
    );

    lastCacheLevel = cacheLevel;
    lastReadLevel = readLevel;
  }
}

/**
 * Cancel the outline decoration for a given container.
 *
 * @param container The container element that holds the outline elements.
 */
export function cancelOutlineDecoration(container: HTMLElement): void {
  if (container.classList.contains(className.outlineContainer)) {
    container.classList.remove(className.outlineContainer);

    const headingElements =
      container.querySelectorAll<HTMLElement>(".tree-item");

    headingElements.forEach((ele) => {
      cancelOutlineDecorator(ele);
    });
  }
}

/**
 * Decorate an outline HTML element with a given content, opacity and position.
 *
 * @param element The HTML element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 * @param level The level of the heading.
 */
function decorateOutlineElement(
  element: HTMLElement,
  content: string,
  opacity: OpacityOptions,
  position: PostionOptions,
  level: number
): void {
  const inner = element.querySelector<HTMLElement>(
    ".tree-item-self .tree-item-inner"
  );
  if (inner) {
    inner.dataset.headingDecorator = content;
    inner.dataset.decoratorOpacity = `${opacity}%`;
    inner.dataset.decoratorLevel = level.toString();

    const isAfter = position.includes("after");
    //? Remove potential residual class names
    inner.classList.remove(isAfter ? className.before : className.after);
    inner.classList.add(
      className.outline,
      isAfter ? className.after : className.before
    );
  }
}

/**
 * Cancel an outline decorator from an HTML element.
 *
 * @param element The HTML element to cancel the decorator.
 */
function cancelOutlineDecorator(element: HTMLElement): void {
  const inner = element.querySelector<HTMLElement>(
    ".tree-item-self .tree-item-inner"
  );
  if (inner) {
    delete inner.dataset.headingDecorator;
    delete inner.dataset.decoratorOpacity;
    delete inner.dataset.decoratorLevel;
    inner.classList.remove(
      className.outline,
      className.before,
      className.after
    );
  }
}

/**
 * Get the tree item level of a given element.
 *
 * @param element The element to get the tree item level for.
 * @returns The tree item level.
 */
function getTreeItemLevel(element: Element): number {
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
function getTreeItemText(element: HTMLElement): string {
  const inner = element.querySelector<HTMLElement>(
    ".tree-item-self .tree-item-inner"
  );
  return inner ? inner.innerText : "";
}

/**
 * Compare heading text.
 *
 * @param source The source heading text.
 * @param outline The outline heading text.
 * @returns true if the two headings are equal, false otherwise.
 */
function compareHeadingText(source: string, outline: string): boolean {
  return compareMarkdownText(htmlToMarkdown(source), htmlToMarkdown(outline));
}
