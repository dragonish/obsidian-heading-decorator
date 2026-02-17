import type * as Presets from "@jsamr/counter-style/presets";

type CounterStyleType = Exclude<
  keyof typeof Presets,
  "circle" | "disc" | "square"
>;
export type OrderedCounterStyleType =
  | CounterStyleType
  | "customIdent"
  | "string";

export interface OrderedDecoratorOptions {
  styleType?: OrderedCounterStyleType;
  delimiter?: string;
  trailingDelimiter?: boolean;
  customTrailingDelimiter?: string;
  leadingDelimiter?: boolean;
  customLeadingDelimiter?: string;
  customIdents?: string[];
  specifiedString?: string;
  ignoreTopLevel?: number;
  allowZeroLevel?: boolean;
  maxRecLevel?: number;
}

export interface IndependentDecoratorSettings {
  styleType: OrderedCounterStyleType;
  delimiter: string;
  trailingDelimiter: boolean;
  customTrailingDelimiter: string;
  leadingDelimiter: boolean;
  customLeadingDelimiter: string;
  customIdents: string;
  specifiedString: string;
}

export interface SpliceDecoratorSettings {
  styleType: OrderedCounterStyleType;
  customIdents: string;
  specifiedString: string;
}

export interface IndependentDecoratorOptions {
  maxRecLevel?: number;
  allowZeroLevel?: boolean;
  ignoreTopLevel?: number;
  orderedRecLevel?: number;

  h1?: Partial<IndependentDecoratorSettings>;
  h2?: Partial<IndependentDecoratorSettings>;
  h3?: Partial<IndependentDecoratorSettings>;
  h4?: Partial<IndependentDecoratorSettings>;
  h5?: Partial<IndependentDecoratorSettings>;
  h6?: Partial<IndependentDecoratorSettings>;
}

export interface IndependentSettings {
  orderedRecLevel: number;

  h1: IndependentDecoratorSettings;
  h2: IndependentDecoratorSettings;
  h3: IndependentDecoratorSettings;
  h4: IndependentDecoratorSettings;
  h5: IndependentDecoratorSettings;
  h6: IndependentDecoratorSettings;
}

export interface SpliceDecoratorOptions {
  maxRecLevel?: number;
  allowZeroLevel?: boolean;
  ignoreTopLevel?: number;

  delimiter?: string;
  trailingDelimiter?: boolean;
  customTrailingDelimiter?: string;
  leadingDelimiter?: boolean;
  customLeadingDelimiter?: string;

  h1?: Partial<SpliceDecoratorSettings>;
  h2?: Partial<SpliceDecoratorSettings>;
  h3?: Partial<SpliceDecoratorSettings>;
  h4?: Partial<SpliceDecoratorSettings>;
  h5?: Partial<SpliceDecoratorSettings>;
  h6?: Partial<SpliceDecoratorSettings>;
}

export interface SpliceSettings {
  delimiter: string;
  trailingDelimiter: boolean;
  customTrailingDelimiter: string;
  leadingDelimiter: boolean;
  customLeadingDelimiter: string;

  h1: SpliceDecoratorSettings;
  h2: SpliceDecoratorSettings;
  h3: SpliceDecoratorSettings;
  h4: SpliceDecoratorSettings;
  h5: SpliceDecoratorSettings;
  h6: SpliceDecoratorSettings;
}

export interface HeadingDecoratorSettings {
  enabledInEachNote?: boolean;

  decoratorMode?: DecoratorMode;
  opacity: OpacityOptions;
  position: PostionOptions;
  maxRecLevel?: number;

  orderedAllowZeroLevel?: boolean;
  orderedBasedOnExisting?: boolean;
  orderedAlwaysIgnore?: boolean;
  orderedIgnoreMaximum?: number;
  orderedIgnoreSingle: boolean;

  orderedStyleType: OrderedCounterStyleType;
  orderedDelimiter: string;
  orderedTrailingDelimiter: boolean;
  orderedCustomTrailingDelimiter?: string;
  orderedLeadingDelimiter?: boolean;
  orderedCustomLeadingDelimiter?: string;
  orderedCustomIdents: string;
  orderedSpecifiedString: string;

  independentSettings?: IndependentSettings;
  spliceSettings?: SpliceSettings;

  unorderedLevelHeadings: string;
}

export type HeadingPluginSettings = {
  metadataKeyword: string;
  folderBlacklist: string[];
  fileRegexBlacklist: string[];
  enabledInReading: boolean;
  enabledReadingSettings: boolean;
  readingRenderPolicy: RenderPolicy;
  enabledInPreview: boolean;
  enabledPreviewSettings: boolean;
  enabledInSource: boolean;
  enabledSourceSettings: boolean;
  sourceHideNumberSigns: boolean;
  useGutter: boolean;
  gutterPosition: GutterPosition;
  gutterFontSize: GutterFontSize;
  enabledGutterSettings: boolean;
  enabledInOutline: boolean;
  enabledOutlineSettings: boolean;
  enabledInQuietOutline: boolean;
  enabledQuietOutlineSettings: boolean;
  enabledInFileExplorer: boolean;
  enabledFileExplorerSettings: boolean;
} & Record<PluginDecoratorSettingsType, HeadingDecoratorSettings>;

export type HeadingPluginData = Omit<
  HeadingPluginSettings,
  | "commonSettings"
  | "metadataKeyword"
  | "folderBlacklist"
  | "fileRegexBlacklist"
  | "enabledInReading"
  | "enabledReadingSettings"
  | "readingRenderPolicy"
  | "readingSettings"
  | "enabledPreviewSettings"
  | "enabledSourceSettings"
  | "useGutter"
  | "gutterPosition"
  | "gutterFontSize"
  | "enabledGutterSettings"
  | "enabledInOutline"
  | "outlineSettings"
  | "enabledInQuietOutline"
  | "enabledOutlineSettings"
  | "quietOutlineSettings"
  | "enabledQuietOutlineSettings"
  | "enabledInFileExplorer"
  | "enabledFileExplorerSettings"
  | "fileExplorerSettings"
>;

export const className = {
  heading: "custom-heading-decorator",
  reading: "reading-custom-heading-decorator",
  preview: "preview-custom-heading-decorator",
  source: "source-custom-heading-decorator",
  outline: "outline-custom-heading-decorator",
  outlineContainer: "outline-custom-heading-container",
  quietOutline: "quiet-outline-custom-heading-decorator",
  quietOutlineContainer: "quiet-outline-custom-heading-container",
  fileExplorer: "file-explorer-custom-heading-decorator",
  fileExplorerContainer: "file-explorer-custom-heading-container",
  gutter: "heading-decorator-gutter",
  gutterMarker: "heading-decorator-gutter-marker",
  before: "before-heading-decorator",
  beforeInside: "before-inside-heading-decorator",
  after: "after-heading-decorator",
  afterInside: "after-inside-heading-decorator",
  hideSourceNumberSigns: "hide-source-number-signs",
};

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
const defaultCustomidents =
  "Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ";

function defaultIndependentDecoratorSettings(): IndependentDecoratorSettings {
  return {
    styleType: "decimal",
    delimiter: ".",
    trailingDelimiter: false,
    customTrailingDelimiter: "",
    leadingDelimiter: false,
    customLeadingDelimiter: "",
    customIdents: defaultCustomidents,
    specifiedString: "#",
  };
}

function defaultSpliceDecoratorSettings(): SpliceDecoratorSettings {
  return {
    styleType: "decimal",
    customIdents: defaultCustomidents,
    specifiedString: "#",
  };
}

/**
 * Defaults independent settings
 *
 * @returns independent settings
 */
export function defaultIndependentSettings(): IndependentSettings {
  return {
    orderedRecLevel: 6,
    h1: defaultIndependentDecoratorSettings(),
    h2: defaultIndependentDecoratorSettings(),
    h3: defaultIndependentDecoratorSettings(),
    h4: defaultIndependentDecoratorSettings(),
    h5: defaultIndependentDecoratorSettings(),
    h6: defaultIndependentDecoratorSettings(),
  };
}

/**
 * Defaults splice settings
 *
 * @returns splice settings
 */
export function defaultSpliceSettings(): SpliceSettings {
  return {
    delimiter: ".",
    trailingDelimiter: false,
    customTrailingDelimiter: "",
    leadingDelimiter: false,
    customLeadingDelimiter: "",
    h1: defaultSpliceDecoratorSettings(),
    h2: defaultSpliceDecoratorSettings(),
    h3: defaultSpliceDecoratorSettings(),
    h4: defaultSpliceDecoratorSettings(),
    h5: defaultSpliceDecoratorSettings(),
    h6: defaultSpliceDecoratorSettings(),
  };
}

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
    maxRecLevel: 6,
    decoratorMode: "orderd",
    orderedDelimiter: ".",
    orderedTrailingDelimiter: false,
    orderedCustomTrailingDelimiter: "",
    orderedLeadingDelimiter: false,
    orderedCustomLeadingDelimiter: "",
    orderedStyleType: "decimal",
    orderedCustomIdents: defaultCustomidents,
    orderedSpecifiedString: "#",
    orderedAllowZeroLevel: false,
    orderedBasedOnExisting: false,
    orderedAlwaysIgnore: false,
    orderedIgnoreSingle: false,
    orderedIgnoreMaximum: 6,
    independentSettings: defaultIndependentSettings(),
    spliceSettings: defaultSpliceSettings(),
    unorderedLevelHeadings: defaultHeadingTuple.join(" "),
  };
}

/**
 * Default plugin settings.
 *
 * @returns default plugin settings.
 */
export function defaultSettings(): HeadingPluginSettings {
  return {
    metadataKeyword: "heading",
    fileRegexBlacklist: [],
    folderBlacklist: [],
    enabledInReading: true,
    enabledReadingSettings: false,
    readingSettings: defaultHeadingDecoratorSettings(),
    readingRenderPolicy: "partial",
    enabledInPreview: true,
    enabledPreviewSettings: false,
    previewSettings: defaultHeadingDecoratorSettings(),
    enabledInSource: false,
    enabledSourceSettings: false,
    sourceSettings: defaultHeadingDecoratorSettings(),
    sourceHideNumberSigns: false,
    useGutter: false,
    gutterPosition: "before-line-numbers",
    gutterFontSize: 15,
    enabledGutterSettings: false,
    gutterSettings: { ...defaultHeadingDecoratorSettings(), opacity: 80 },
    enabledInOutline: false,
    enabledOutlineSettings: false,
    outlineSettings: defaultHeadingDecoratorSettings(),
    enabledInQuietOutline: false,
    enabledQuietOutlineSettings: false,
    quietOutlineSettings: defaultHeadingDecoratorSettings(),
    enabledInFileExplorer: false,
    enabledFileExplorerSettings: false,
    fileExplorerSettings: defaultHeadingDecoratorSettings(),
    commonSettings: defaultHeadingDecoratorSettings(),
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
 * Get the class name for a given position.
 *
 * @param position The position to get the class name for.
 * @param ignoreInsideFlag Whether to ignore the inside flag.
 * @returns The class name.
 */
export function getPositionClassName(
  position: PostionOptions,
  ignoreInsideFlag?: boolean
): string {
  switch (position) {
    case "before":
      return className.before;
    case "after":
      return className.after;
    case "before-inside":
      return ignoreInsideFlag ? className.before : className.beforeInside;
    case "after-inside":
      return ignoreInsideFlag ? className.after : className.afterInside;
    default:
      return "";
  }
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
      source.replaceAll(/[-+>`=_~*\\\s]/g, "") ===
      outline.replaceAll(/[-+>`=_~*\\\s]/g, "")
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
 * @returns CSSEnabledStatus object.
 */
export function checkEnabledCSS(
  cssString: string,
  mode: HeadingMetadataSettingsType
) {
  const status: CSSEnabledStatus = {
    mode: null,
    all: null,
  };
  const cssClasses = cssString.split(" ").map((c) => c.trim());
  for (const cssClass of cssClasses) {
    switch (cssClass) {
      case `enable-${mode}-heading`:
        status.mode = true;
        break;
      case `disable-${mode}-heading`:
        status.mode = false;
        break;
      case "enable-heading":
        status.all = true;
        break;
      case "disable-heading":
        status.all = false;
        break;
    }
  }

  return status;
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
