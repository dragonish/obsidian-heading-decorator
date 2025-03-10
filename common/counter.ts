import type { LevelTuple, DecoratorOptions, PostionOptions } from "./data";
import * as presets from "@jsamr/counter-style/presets";

export class Counter {
  private levels: LevelTuple = [0, 0, 0, 0, 0, 0];
  private decoratorOptions: DecoratorOptions;

  constructor(decoratorOptions?: DecoratorOptions) {
    if (decoratorOptions) {
      this.decoratorOptions = decoratorOptions;
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
      const levels = this.handler(level);
      let results: string[] = [];
      const {
        styleType,
        delimiter = ".",
        trailingDelimiter = false,
        specifiedString = "#",
        customIdents = [],
      } = this.decoratorOptions;

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

      result = results.join(delimiter) + (trailingDelimiter ? delimiter : "");
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
