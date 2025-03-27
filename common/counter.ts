import type {
  LevelTuple,
  BaseDecoratorOptions,
  DecoratorOptions,
} from "./data";
import { defaultHeadingTuple } from "./data";
import * as presets from "@jsamr/counter-style/presets";

export class Querier {
  private allowZeroLevel?: boolean;
  private levels: LevelTuple = [0, 0, 0, 0, 0, 0];
  private baseLevels?: LevelTuple;
  private highestLevel: number;

  constructor(allowZeroLevel?: boolean) {
    this.allowZeroLevel = allowZeroLevel;
    this.highestLevel = 6;
  }

  handler(level: number): number[] {
    if (level < 1 || level > 6) {
      return [];
    }

    for (let i = 1; i <= 6; i++) {
      if (i < level && !this.allowZeroLevel && this.levels[i - 1] === 0) {
        this.levels[i - 1] = 1;
      } else if (i > level) {
        this.levels[i - 1] = 0;
      }
    }
    this.levels[level - 1]++;

    if (this.baseLevels == undefined) {
      this.baseLevels = [...this.levels];
      for (let i = 1; i <= 6; i++) {
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

  query(ignoreSingle = false): number {
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
    }

    return res;
  }
}

export class Counter extends Querier {
  private decoratorOptions: DecoratorOptions;

  constructor(decoratorOptions?: BaseDecoratorOptions) {
    super(decoratorOptions?.allowZeroLevel);

    if (decoratorOptions) {
      if (decoratorOptions.ordered) {
        const {
          styleType,
          delimiter,
          trailingDelimiter,
          customIdents,
          specifiedString,
          ignoreTopLevel,
        } = decoratorOptions;
        this.decoratorOptions = {
          ordered: true,
          styleType: styleType || "decimal",
          delimiter,
          trailingDelimiter,
          customIdents,
          specifiedString,
          ignoreTopLevel,
        };
      } else {
        this.decoratorOptions = {
          ordered: false,
          levelHeadings: decoratorOptions.levelHeadings || [
            ...defaultHeadingTuple,
          ],
        };
      }
    } else {
      this.decoratorOptions = { ordered: true, styleType: "decimal" }; // Default to ordered if no options are provided
    }
  }

  decorator(level: number): string {
    let result = "";
    if (level < 1 || level > 6) {
      return result;
    }

    if (this.decoratorOptions.ordered) {
      let results: string[] = [];
      const {
        styleType,
        delimiter = ".",
        trailingDelimiter = false,
        specifiedString = "#",
        customIdents = [],
        ignoreTopLevel = 0,
      } = this.decoratorOptions;
      const levels = this.handler(level).slice(ignoreTopLevel);

      switch (styleType) {
        case "customIdent":
          results = levels.map((level) =>
            level > customIdents.length
              ? level.toString()
              : customIdents[level - 1]
          );
          break;
        case "string":
          results = levels.map(() => specifiedString.trim() || "#");
          break;
        default:
          results = levels.map((level) =>
            presets[styleType].renderCounter(level)
          );
      }

      result = results.join(delimiter);
      result += result.length > 0 && trailingDelimiter ? delimiter : "";
    } else {
      result = this.decoratorOptions.levelHeadings[level - 1];
    }

    return result;
  }
}
