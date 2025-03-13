type SpecialState = "" | "metadata" | "codeBlocks" | "math";

interface CodeBlocks {
  graveCount: number;
}

export class Heading {
  private state: SpecialState;
  private codeBlocks: CodeBlocks;
  private nextLineNum: number;
  private readonly METADATA_BORDER = "---";

  constructor() {
    this.state = "";
    this.codeBlocks = { graveCount: 0 };
    this.nextLineNum = 1;
  }

  handler(lineStart: number, lineText: string, nextLineText?: string): number {
    if (lineStart < this.nextLineNum) {
      return -1;
    }
    this.nextLineNum = lineStart + 1;

    if (lineStart === 1 && lineText === this.METADATA_BORDER) {
      this.state = "metadata";
      return -1;
    }

    if (this.state === "") {
      const codeBlocks = lineText.match(/^[ ]{0,3}(`{3,})[^`]*$/);
      if (codeBlocks) {
        this.state = "codeBlocks";
        this.codeBlocks.graveCount = codeBlocks[1].length;
        return -1;
      }

      const math = lineText.match(/^[ ]{0,3}\$\$(.*)/);
      if (math && !math[1].trim().endsWith("$$")) {
        this.state = "math";
        return -1;
      }

      let level = this.getLevelFromLineText(lineText);
      if (level === -1 && lineText.trim() && nextLineText?.trim()) {
        level = this.getLevelFromNextLineText(nextLineText);
        if (level > 0) {
          this.nextLineNum++;
        }
      }
      return level;
    } else {
      if (this.state === "metadata") {
        if (lineText === this.METADATA_BORDER) {
          this.state = "";
        }
      } else if (this.state === "codeBlocks") {
        const endCodeBlocks = lineText.match(/^[ ]{0,3}(`{3,})([^`]*)$/);
        if (endCodeBlocks) {
          const graveCount = endCodeBlocks[1].length;
          if (
            graveCount >= this.codeBlocks.graveCount &&
            endCodeBlocks[2].trim().length === 0
          ) {
            this.state = "";
          }
        }
      } else if (this.state === "math") {
        if (lineText.trim().endsWith("$$")) {
          this.state = "";
        }
      }

      return -1;
    }
  }

  private getLevelFromLineText(lineText: string): number {
    let level = -1;
    const matches = lineText.match(/^[ ]{0,3}(#{1,6}\s+|#{1,6}$)/);
    if (matches) {
      level = matches[1].trim().length;
    }
    return level;
  }

  private getLevelFromNextLineText(nextLineText: string): number {
    let level = -1;
    if (nextLineText.match(/^=+\s*$/)) {
      level = 1;
    } else if (nextLineText.match(/^-+\s*$/)) {
      level = 2;
    }
    return level;
  }
}
