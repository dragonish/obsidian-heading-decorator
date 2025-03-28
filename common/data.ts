import type * as Presets from "@jsamr/counter-style/presets";

type TupleOf<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type LevelTuple = TupleOf<number, 6>;
export type HeadingTuple = TupleOf<string, 6>;

export type OpacityOptions = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
export type PostionOptions = "before" | "after";

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
  ordered: boolean;
  opacity: OpacityOptions;
  position: PostionOptions;

  orderedStyleType: OrderedCounterStyleType;
  orderedDelimiter: string;
  orderedTrailingDelimiter: boolean;
  orderedCustomIdents: string;
  orderedSpecifiedString: string;
  orderedIgnoreSingle: boolean;
  orderedBasedOnExisting?: boolean;
  orderedAllowZeroLevel?: boolean;

  unorderedLevelHeadings: string;
}

export type PluginDecoratorSettingsType =
  | "readingSettings"
  | "previewSettings"
  | "sourceSettings";

export type HeadingPluginSettings = {
  enabledInReading: boolean;
  enabledInPreview: boolean;
  enabledInSource: boolean;
} & Record<PluginDecoratorSettingsType, HeadingDecoratorSettings>;

export type HeadingPluginData = Omit<
  HeadingPluginSettings,
  "enabledInReading" | "readingSettings"
>;

export const readingHeadingDecoratorClassName =
  "reading-custom-heading-decorator";
export const previewHeadingDecoratorClassName =
  "preview-custom-heading-decorator";
export const sourceHeadingDecoratorClassName =
  "source-custom-heading-decorator";
export const beforeDecoratorClassName = "before-heading-decorator";
export const afterDecoratorClassName = "after-heading-decorator";
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
    opacity: 20,
    position: "before",
    ordered: true,
    orderedDelimiter: ".",
    orderedTrailingDelimiter: false,
    orderedStyleType: "decimal",
    orderedCustomIdents: "Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ",
    orderedSpecifiedString: "#",
    orderedIgnoreSingle: false,
    orderedAllowZeroLevel: false,
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
