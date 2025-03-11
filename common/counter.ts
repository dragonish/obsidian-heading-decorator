import type {
  LevelTuple,
  BaseDecoratorOptions,
  DecoratorOptions,
  PostionOptions,
} from "./data";
import { defaultHeadingTuple } from "./data";
import * as presets from "@jsamr/counter-style/presets";

export class Counter {
  protected levels: LevelTuple = [0, 0, 0, 0, 0, 0];
  private decoratorOptions: DecoratorOptions;

  constructor(decoratorOptions?: BaseDecoratorOptions) {
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

  handler(level: number): number[] {
    if (level < 1 || level > 6) {
      return [];
    }

    for (let i = 1; i <= 6; i++) {
      if (i < level && this.levels[i - 1] === 0) {
        this.levels[i - 1] = 1;
      } else if (i > level) {
        this.levels[i - 1] = 0;
      }
    }
    this.levels[level - 1]++;

    return this.levels.slice(0, level);
  }

  decorator(level: number, postion?: PostionOptions): string {
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

    if (postion === "before") {
      return `${result} `;
    } else if (postion === "after") {
      return ` ${result}`;
    }
    return result;
  }
}

export class TopLevelQuerier extends Counter {
  constructor() {
    super();
  }

  query(): number {
    let res = 0;
    for (let i = 0; i < this.levels.length; i++) {
      if (this.levels[i] <= 1) {
        res = i + 1;
      } else {
        break;
      }
    }
    return res;
  }
}
