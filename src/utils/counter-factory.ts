import type { HeadingDecoratorSettings } from "./data";
import { getUnorderedLevelHeadings, getOrderedCustomIdents } from "./data";
import {
  Querier,
  UnorderedCounter,
  OrderedCounter,
  IndependentCounter,
  SpliceCounter,
} from "./counter";
import { Heading } from "./heading";

interface DocumentLineReader {
  lines: number;
  line(n: number): { text: string };
}

export function createCounterFromSettings(
  settings: HeadingDecoratorSettings,
  doc: DocumentLineReader
): Counter {
  const {
    decoratorMode = "orderd",
    maxRecLevel,
    orderedStyleType,
    orderedDelimiter,
    orderedTrailingDelimiter,
    orderedCustomTrailingDelimiter,
    orderedLeadingDelimiter,
    orderedCustomLeadingDelimiter,
    orderedCustomIdents,
    orderedSpecifiedString,
    orderedAlwaysIgnore,
    orderedIgnoreSingle,
    orderedIgnoreMaximum = 6,
    orderedBasedOnExisting,
    orderedAllowZeroLevel,
    unorderedLevelHeadings,
    independentSettings,
    spliceSettings,
  } = settings;

  if (decoratorMode === "unordered") {
    return new UnorderedCounter(
      getUnorderedLevelHeadings(unorderedLevelHeadings),
      maxRecLevel
    );
  }

  let ignoreTopLevel = 0;
  const ignoreSingle = !orderedAlwaysIgnore && orderedIgnoreSingle;
  const ignoreLimit = orderedAlwaysIgnore ? orderedIgnoreMaximum : 0;
  if (ignoreSingle || orderedBasedOnExisting) {
    const querier = new Querier(orderedAllowZeroLevel, maxRecLevel);
    const heading = new Heading();
    for (let lineIndex = 1; lineIndex <= doc.lines; lineIndex++) {
      const line = doc.line(lineIndex);
      const lineText = line.text;
      const nextLineIndex = lineIndex + 1;
      const nextLineText =
        nextLineIndex <= doc.lines ? doc.line(nextLineIndex).text : "";
      const level = heading.handler(lineIndex, lineText, nextLineText);
      if (level === -1) {
        continue;
      }

      querier.handler(level);

      ignoreTopLevel = querier.query(ignoreSingle, orderedIgnoreMaximum);
      if (ignoreTopLevel <= ignoreLimit) {
        break;
      }
    }
  }
  if (ignoreTopLevel < ignoreLimit) {
    ignoreTopLevel = ignoreLimit;
  }

  if (decoratorMode === "independent") {
    return new IndependentCounter({
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
    return new SpliceCounter({
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
    return new OrderedCounter({
      maxRecLevel,
      ignoreTopLevel,
      allowZeroLevel: orderedAllowZeroLevel,
      styleType: orderedStyleType,
      delimiter: orderedDelimiter,
      trailingDelimiter: orderedTrailingDelimiter,
      customTrailingDelimiter: orderedCustomTrailingDelimiter,
      leadingDelimiter: orderedLeadingDelimiter,
      customLeadingDelimiter: orderedCustomLeadingDelimiter,
      customIdents: getOrderedCustomIdents(orderedCustomIdents),
      specifiedString: orderedSpecifiedString,
    });
  }
}
