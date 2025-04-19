import type * as Presets from "@jsamr/counter-style/presets";

type CounterStyleType = Exclude<
  keyof typeof Presets,
  "circle" | "disc" | "square"
>;
export type OrderedCounterStyleType =
  | CounterStyleType
  | "customIdent"
  | "string";

export interface BaseDecoratorOptions {
  ordered: boolean;
  styleType?: OrderedCounterStyleType;
  delimiter?: string;
  trailingDelimiter?: boolean;
  customIdents?: string[];
  specifiedString?: string;
  ignoreTopLevel?: number;
  levelHeadings?: HeadingTuple;
  allowZeroLevel?: boolean;
}

interface OrderedDecoratorOptions {
  ordered: true;
  styleType: OrderedCounterStyleType;
  delimiter?: string;
  trailingDelimiter?: boolean;
  customIdents?: string[];
  specifiedString?: string;
  ignoreTopLevel?: number;
}

interface UnorderedDecoratorOptions {
  ordered: false;
  levelHeadings: HeadingTuple;
}

export type DecoratorOptions =
  | OrderedDecoratorOptions
  | UnorderedDecoratorOptions;

interface HeadingDecoratorSettings {
  enabledInEachNote?: boolean;

  ordered: boolean;
  opacity: OpacityOptions;
  position: PostionOptions;

  orderedStyleType: OrderedCounterStyleType;
  orderedDelimiter: string;
  orderedTrailingDelimiter: boolean;
  orderedCustomIdents: string;
  orderedSpecifiedString: string;
  orderedAllowZeroLevel?: boolean;
  orderedBasedOnExisting?: boolean;
  orderedIgnoreSingle: boolean;
  orderedIgnoreMaximum?: number;

  unorderedLevelHeadings: string;
}

export type HeadingPluginSettings = {
  metadataKeyword: string;
  folderBlacklist: string[];
  fileRegexBlacklist: string[];
  enabledInReading: boolean;
  enabledInPreview: boolean;
  enabledInSource: boolean;
  enabledInOutline: boolean;
} & Record<PluginDecoratorSettingsType, HeadingDecoratorSettings>;

export type HeadingPluginData = Omit<
  HeadingPluginSettings,
  | "metadataKeyword"
  | "folderBlacklist"
  | "fileRegexBlacklist"
  | "enabledInReading"
  | "readingSettings"
  | "enabledInOutline"
  | "outlineSettings"
>;

export const readingHeadingDecoratorClassName =
  "reading-custom-heading-decorator";
export const previewHeadingDecoratorClassName =
  "preview-custom-heading-decorator";
export const sourceHeadingDecoratorClassName =
  "source-custom-heading-decorator";
export const outlineHeadingDecoratorClassName =
  "outline-custom-heading-decorator";
export const beforeDecoratorClassName = "before-heading-decorator";
export const beforeInsideDecoratorClassName = "before-inside-heading-decorator";
export const afterDecoratorClassName = "after-heading-decorator";
export const afterInsideDecoratorClassName = "after-inside-heading-decorator";
export const headingsSelector =
  ".el-h1 h1, .el-h2 h2, .el-h3 h3, .el-h4 h4, .el-h5 h5, .el-h6 h6";
export const defaultHeadingTuple: HeadingTuple = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
];

export const orderedStyleTypeOptions: Record<OrderedCounterStyleType, string> =
  {
    decimal: "Decimal numbers",
    lowerAlpha: "Lowercase ASCII letters",
    upperAlpha: "Uppercase ASCII letters",
    cjkDecimal: "Han decimal numbers",
    decimalLeadingZero: "Decimal numbers (padded by initial zeros)",
    lowerRoman: "Lowercase roman numerals",
    upperRoman: "Uppercase roman numerals",
    lowerGreek: "Lowercase classical Greek",
    lowerLatin: "Lowercase Latin alphabet",
    upperLatin: "Uppercase Latin alphabet",
    arabicIndic: "Arabic-Indic numbers",
    armenian: "Traditional Armenian numbering",
    bengali: "Bengali numbering",
    cambodian: "Cambodian numbering",
    cjkEarthlyBranch: 'Han "Earthly Branch" ordinals',
    cjkHeavenlyStem: 'Han "Heavenly Stem" ordinals',
    devanagari: "Devanagari numbering",
    georgian: "Traditional Georgian numbering",
    gujarati: "Gujarati numbering",
    gurmukhi: "Gurmukhi numbering",
    hebrew: "Traditional Hebrew numbering",
    hiragana: "Dictionary-order hiragana lettering",
    hiraganaIroha: "Iroha-order hiragana lettering",
    japaneseFormal: "Japanese formal numbering",
    japaneseInformal: "Japanese informal numbering",
    kannada: "Kannada numbering",
    katana: "Dictionary-order katakana lettering",
    katanaIroha: "Iroha-order katakana lettering",
    khmer: "Khmer numbering",
    koreanHangulFormal: "Korean hangul numbering",
    koreanHanjaFormal: "Formal Korean Han numbering",
    koreanHanjaInformal: "Korean hanja numbering",
    lao: "Laotian numbering",
    lowerArmenian: "Lowercase Armenian numbering",
    malayalam: "Malayalam numbering",
    mongolian: "Mongolian numbering",
    myanmar: "Myanmar (Burmese) numbering",
    oriya: "Oriya numbering",
    persian: "Persian numbering",
    tamil: "Tamil numbering",
    telugu: "Telugu numbering",
    thai: "Thai numbering",
    tibetan: "Tibetan numbering",
    upperArmenian: "Traditional uppercase Armenian numbering",
    customIdent: "Custom list styles",
    string: "Specified string",
  };

/**
 * Default settings for heading decorator.
 *
 * @returns default settings for heading decorator.
 */
export function defaultHeadingDecoratorSettings(): HeadingDecoratorSettings {
  return {
    enabledInEachNote: true,
    opacity: 20,
    position: "before",
    ordered: true,
    orderedDelimiter: ".",
    orderedTrailingDelimiter: false,
    orderedStyleType: "decimal",
    orderedCustomIdents: "Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ",
    orderedSpecifiedString: "#",
    orderedAllowZeroLevel: false,
    orderedIgnoreSingle: false,
    orderedBasedOnExisting: false,
    orderedIgnoreMaximum: 6,
    unorderedLevelHeadings: defaultHeadingTuple.join(" "),
  };
}

/**
 * Get unordered level headings from settings.
 *
 * @param value - The value to split and filter.
 * @returns An array of strings representing the unordered level headings.
 */
export function getUnorderedLevelHeadings(value: string): HeadingTuple {
  const arr = value.split(/\s+/g).filter((v) => v);
  if (arr.length > 6) {
    return arr.slice(0, 6) as HeadingTuple;
  }
  return [...defaultHeadingTuple];
}

/**
 * Get ordered custom idents from settings.
 *
 * @param value - The value to split and filter.
 * @returns An array of strings representing the ordered custom idents.
 */
export function getOrderedCustomIdents(value: string) {
  return value.split(/\s+/g).filter((v) => v);
}

/**
 * Diff level between two numbers.
 *
 * @param current current level.
 * @param last last level.
 * @returns boolean. if current level is less than or equal to last level, return true. otherwise, return false.
 */
export function diffLevel(current: number, last: number): boolean {
  const diff = current - last;
  if (diff > 0) {
    return false;
  }
  return true;
}

/**
 * Compare Markdown text.
 *
 * @param source The source heading text.
 * @param outline The outline heading text.
 * @returns boolean. if left Markdown text is equal to right Markdown text, return true. otherwise, return false.
 */
export function compareMarkdownText(source: string, outline: string): boolean {
  if (source === outline) {
    return true;
  } else {
    source = source.replaceAll(/\[(.+)\]\(.*\)/g, "$1");

    if (source === outline) {
      return true;
    }

    source = source.replaceAll(/\[\[.+\|(.+)\]\]/g, "$1");
    if (source === outline) {
      return true;
    }

    source = source.replaceAll(/\[\[(.+)#(.+)\]\]/g, "$1 > $2");
    if (source === outline) {
      return true;
    }

    source = source.replaceAll(/\[\[#?(.+)\]\]/g, "$1");
    if (source === outline) {
      return true;
    }

    if (
      source.replaceAll(/[`=_~*\\\s]/g, "") ===
      outline.replaceAll(/[`=_~*\\\s]/g, "")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get boolean value from unknown.
 *
 * @param value unknown value.
 * @returns boolean or null. if value is boolean, return value. otherwise, return null or convert to boolean based on value. if value is not convertible to boolean, return null.
 */
export function getBoolean(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  } else {
    const trueSet = new Set<unknown>(["true", "yes", "on", "1", 1]);
    if (trueSet.has(value)) {
      return true;
    }

    const falseSet = new Set<unknown>(["false", "no", "off", "0", 0]);
    if (falseSet.has(value)) {
      return false;
    }
  }

  return null;
}

/**
 * Check if css string contains enable/disable heading classes.
 *
 * @param cssString CSS string.
 * @param mode Mode to check for.
 * @returns true if css string contains enable-${mode}-heading, false if it contains disable-${mode}-heading, and null otherwise.
 */
export function checkEnabledCss(
  cssString: string,
  mode: HeadingMetadataSettingsType
) {
  const cssClasses = cssString.split(" ").map((c) => c.trim());
  for (const cssClass of cssClasses) {
    switch (cssClass) {
      case `enable-${mode}-heading`:
        return true;
      case `disable-${mode}-heading`:
        return false;
      case "enable-heading":
        return true;
      case "disable-heading":
        return false;
    }
  }
  return null; // default to null if no matching class is found
}

/**
 * Converts a string to a regex object.
 * @param value The string to convert to a regex.
 * @returns A regex object if the string is a valid regex, otherwise null.
 */
export function stringToRegex(value: string) {
  const str = value.trim();
  if (!str) {
    return null;
  }

  try {
    const re = new RegExp(
      str.substring(1, str.lastIndexOf("/")),
      str.substring(str.lastIndexOf("/") + 1)
    );
    return re;
  } catch {
    return null;
  }
}

/**
 * Find the first non-hash character index in a string. If the string starts with a hash, it will find the first non-hash character after the hash. Otherwise, it will find the first non-space character.
 *
 * @param text The string to search.
 * @returns The index of the first non-hash character. If no such character exists, returns 0.
 */
export function findFirstCharacterIndex(text: string): number {
  if (text.trim().startsWith("#")) {
    for (let index = 0; index < text.length; index++) {
      if (text[index] !== "#" && text[index].trim()) {
        return index;
      }
    }
  } else {
    for (let index = 0; index < text.length; index++) {
      if (text[index].trim()) {
        return index;
      }
    }
  }
  return 0;
}
