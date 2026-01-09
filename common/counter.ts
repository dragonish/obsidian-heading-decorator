import type {
  OrderedDecoratorOptions,
  IndependentDecoratorOptions,
  IndependentDecoratorSettings,
} from "./data";
import { getOrderedCustomIdents } from "./data";
import * as presets from "@jsamr/counter-style/presets";

export class Querier {
  protected maxRecLevel: number;
  private allowZeroLevel?: boolean;
  private levels: LevelTuple = [0, 0, 0, 0, 0, 0];
  private baseLevels?: LevelTuple;
  private highestLevel: number;

  constructor(allowZeroLevel?: boolean, maxRecLevel = 6) {
    this.allowZeroLevel = allowZeroLevel;
    this.maxRecLevel = maxRecLevel;
    this.highestLevel = this.maxRecLevel;
  }

  handler(level: number): number[] {
    if (level < 1 || level > this.maxRecLevel) {
      return [];
    }

    for (let i = 1; i <= this.maxRecLevel; i++) {
      if (i < level && !this.allowZeroLevel && this.levels[i - 1] === 0) {
        this.levels[i - 1] = 1;
      } else if (i > level) {
        this.levels[i - 1] = 0;
      }
    }
    this.levels[level - 1]++;

    if (this.baseLevels == undefined) {
      this.baseLevels = [...this.levels];
      for (let i = 1; i <= this.maxRecLevel; i++) {
        if (i > level) {
          this.baseLevels[i - 1] = 1;
        }
      }
    }

    if (level < this.highestLevel) {
      this.highestLevel = level;
    }

    return this.levels.slice(0, level);
  }

  query(ignoreSingle = false, ignoreMaximum = 6): number {
    let res = this.highestLevel - 1;

    if (ignoreSingle) {
      const baseLevels: LevelTuple =
        this.baseLevels ??
        (this.allowZeroLevel ? [0, 0, 0, 0, 0, 1] : [1, 1, 1, 1, 1, 1]);
      for (let i = 0; i < 6; i++) {
        if (this.levels[i] < baseLevels[i] + 1) {
          res = i + 1;
        } else {
          break;
        }
      }

      if (res > ignoreMaximum) {
        res = ignoreMaximum;
      }
    }

    return res;
  }
}

export class OrderedCounter extends Querier implements Counter {
  constructor(private decoratorOptions: OrderedDecoratorOptions) {
    super(decoratorOptions?.allowZeroLevel, decoratorOptions?.maxRecLevel);

    if (!decoratorOptions.styleType) {
      this.decoratorOptions.styleType = "decimal"; // Default to ordered if no options are provided
    }
  }

  decorator(level: number): string {
    let result = "";
    if (level < 1 || level > this.maxRecLevel) {
      return result;
    }

    let results: string[] = [];
    const {
      styleType = "decimal",
      delimiter = ".",
      trailingDelimiter = false,
      customTrailingDelimiter = "",
      leadingDelimiter = false,
      customLeadingDelimiter = "",
      specifiedString = "#",
      customIdents = [],
      ignoreTopLevel = 0,
    } = this.decoratorOptions;
    const levels = this.handler(level).slice(ignoreTopLevel);

    switch (styleType) {
      case "customIdent":
        results = levels.map((l) =>
          l > customIdents.length ? l.toString() : customIdents[l - 1]
        );
        break;
      case "string":
        results = levels.map(() => specifiedString.trim() || "#");
        break;
      default:
        results = levels.map((l) => presets[styleType].renderCounter(l));
    }

    result = results.join(delimiter);
    if (result.length > 0) {
      result =
        (leadingDelimiter ? customLeadingDelimiter || delimiter : "") +
        result +
        (trailingDelimiter ? customTrailingDelimiter || delimiter : "");
    }

    return result;
  }
}

export class IndependentCounter extends Querier implements Counter {
  constructor(private decoratorOptions: IndependentDecoratorOptions) {
    super(decoratorOptions?.allowZeroLevel, decoratorOptions?.maxRecLevel);
  }

  decorator(level: number): string {
    let result = "";
    if (level < 1 || level > this.maxRecLevel) {
      return result;
    }

    let results: string[] = [];
    let used: Partial<IndependentDecoratorSettings>;
    const {
      h1 = {},
      h2 = {},
      h3 = {},
      h4 = {},
      h5 = {},
      h6 = {},
      orderedRecLevel = 6,
      ignoreTopLevel = 0,
    } = this.decoratorOptions;
    let levels = this.handler(level).slice(ignoreTopLevel);

    if (levels.length === 0) {
      return result;
    }

    const current = Math.min(level, orderedRecLevel);
    switch (current) {
      case 6:
        used = h6;
        break;
      case 5:
        used = h5;
        break;
      case 4:
        used = h4;
        break;
      case 3:
        used = h3;
        break;
      case 2:
        used = h2;
        break;
      case 1:
      default:
        used = h1;
        break;
    }
    if (level <= current) {
      levels = levels.slice(-1);
    } else {
      levels = levels.slice(current - ignoreTopLevel - 1);
    }

    const {
      styleType = "decimal",
      delimiter = ".",
      trailingDelimiter = false,
      customTrailingDelimiter = "",
      leadingDelimiter = false,
      customLeadingDelimiter = "",
      customIdents = "",
      specifiedString = "#",
    } = used;

    switch (styleType) {
      case "customIdent":
        results = levels.map((l) => {
          const ci = getOrderedCustomIdents(customIdents);
          return l > ci.length ? l.toString() : ci[l - 1];
        });
        break;
      case "string":
        results = levels.map(() => specifiedString.trim() || "#");
        break;
      default:
        results = levels.map((l) => presets[styleType].renderCounter(l));
        break;
    }

    result = results.join(delimiter);
    if (result.length > 0) {
      result =
        (leadingDelimiter ? customLeadingDelimiter || delimiter : "") +
        result +
        (trailingDelimiter ? customTrailingDelimiter || delimiter : "");
    }

    return result;
  }
}

export class UnorderedCounter implements Counter {
  constructor(private levelHeadings: HeadingTuple, private maxRecLevel = 6) {}

  decorator(level: number): string {
    let result = "";
    if (level < 1 || level > this.maxRecLevel) {
      return result;
    }

    result = this.levelHeadings[level - 1];
    return result;
  }

  handler(): void {
    //* do nothing.
  }
}
