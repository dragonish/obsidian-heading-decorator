import { MarkdownPostProcessorContext } from "obsidian";
import type { HeadingDecoratorSettings } from "../common/data";
import {
  headingDecoratorClassName,
  readingHeadingDecoratorClassName,
  getOrderedCustomIdents,
  getPositionClassName,
  getUnorderedLevelHeadings,
} from "../common/data";
import { Heading } from "../common/heading";
import { Querier, Counter } from "../common/counter";

/**
 * Handles ordered headings of reading view.
 *
 * @param settings The heading decorator settings.
 * @param context The markdown post processor context.
 * @param headingElements The heading elements to be processed.
 * @param sourceArr The source content of the file as an array of lines.
 */
export function readingOrderedHandler(
  settings: HeadingDecoratorSettings,
  context: MarkdownPostProcessorContext,
  headingElements: HTMLElement[],
  sourceArr: string[]
): void {
  const {
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
    orderedIgnoreSingle,
    orderedIgnoreMaximum = 6,
    orderedAlwaysIgnore,
    orderedBasedOnExisting,
    orderedAllowZeroLevel,
  } = settings;

  let ignoreTopLevel = 0;
  const ignoreSingle = !orderedAlwaysIgnore && orderedIgnoreSingle;
  const ignoreLimit = orderedAlwaysIgnore ? orderedIgnoreMaximum : 0;
  if (ignoreSingle || orderedBasedOnExisting) {
    const queier = new Querier(orderedAllowZeroLevel, maxRecLevel);
    const heading = new Heading();
    for (let lineIndex = 1; lineIndex <= sourceArr.length; lineIndex++) {
      const lineText = sourceArr[lineIndex - 1];
      const nextLineIndex = lineIndex + 1;
      const nextLineText =
        nextLineIndex <= sourceArr.length ? sourceArr[nextLineIndex - 1] : "";
      const level = heading.handler(lineIndex, lineText, nextLineText);
      if (level === -1) {
        continue;
      }

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

  const counter = new Counter({
    ordered: true,
    maxRecLevel,
    delimiter: orderedDelimiter,
    trailingDelimiter: orderedTrailingDelimiter,
    customTrailingDelimiter: orderedCustomTrailingDelimiter,
    leadingDelimiter: orderedLeadingDelimiter,
    customLeadingDelimiter: orderedCustomLeadingDelimiter,
    styleType: orderedStyleType,
    customIdents: getOrderedCustomIdents(orderedCustomIdents),
    specifiedString: orderedSpecifiedString,
    ignoreTopLevel,
    allowZeroLevel: orderedAllowZeroLevel,
  });
  const heading = new Heading();
  let headingIndex = 1;

  headingElements.forEach((headingElement) => {
    const sectionInfo = context.getSectionInfo(headingElement);
    if (!sectionInfo) {
      return;
    }

    const lineStart = sectionInfo.lineStart + 1;
    if (lineStart > sourceArr.length) {
      return;
    }

    for (let lineIndex = headingIndex; lineIndex <= lineStart; lineIndex++) {
      const lineText = sourceArr[lineIndex - 1];
      const nextLineIndex = lineIndex + 1;
      const nextLineText =
        nextLineIndex <= sourceArr.length ? sourceArr[nextLineIndex - 1] : "";
      const level = heading.handler(lineIndex, lineText, nextLineText);
      if (lineIndex === lineStart) {
        //? 1. When using the page preview feature to only reference fragments, the
        //? relative position of rows is incorrect.
        //? 2. In the split editing scenario, there may be a delay in the information
        //? on the reading tab.
        const elementLevel = queryHeadingLevelByElement(headingElement);
        if (elementLevel === level) {
          const decoratorContent = counter.decorator(level);
          decorateHTMLElement(
            headingElement,
            decoratorContent,
            opacity,
            position
          );
        }

        headingIndex = lineIndex + 1;
      } else {
        counter.handler(level);
      }
    }
  });
}

/**
 * Handles unordered headings of reading view.
 *
 * @param settings The heading decorator settings.
 * @param headingElements The unordered heading elements to be processed.
 */
export function readingUnorderedHandler(
  settings: HeadingDecoratorSettings,
  headingElements: HTMLElement[]
): void {
  const { opacity, position, maxRecLevel, unorderedLevelHeadings } = settings;

  const counter = new Counter({
    ordered: false,
    maxRecLevel,
    levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
  });

  headingElements.forEach((headingElement) => {
    const level = queryHeadingLevelByElement(headingElement);
    const decoratorContent = counter.decorator(level);
    decorateHTMLElement(headingElement, decoratorContent, opacity, position);
  });
}

/**
 * Query the heading level of an HTML element.
 *
 * @param element
 * @returns Return `-1` for non-heading elements.
 */
function queryHeadingLevelByElement(element: HTMLElement): number {
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
 * Decorate an HTML element with a given content, opacity and position.
 *
 * @param element The HTML element to decorate.
 * @param content The content to decorate with.
 * @param opacity The opacity of the decorator.
 * @param position The position of the decorator.
 */
function decorateHTMLElement(
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
