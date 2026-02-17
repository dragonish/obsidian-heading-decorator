type TupleOf<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

type LevelTuple = TupleOf<number, 6>;
type HeadingTuple = TupleOf<string, 6>;

type DecoratorMode = "orderd" | "independent" | "splice" | "unordered";
type OpacityOptions = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
type PostionOptions = "before" | "before-inside" | "after" | "after-inside";
type GutterPosition = "before-line-numbers" | "after-line-numbers";
type GutterFontSize = "ui-smaller" | "ui-small" | "ui-medium" | "ui-large";
type RenderPolicy = "partial" | "full";

type PluginDecoratorSettingsType =
  | "commonSettings"
  | "readingSettings"
  | "previewSettings"
  | "sourceSettings"
  | "outlineSettings"
  | "quietOutlineSettings"
  | "fileExplorerSettings"
  | "gutterSettings";

type HeadingMetadataSettingsType =
  | "reading"
  | "preview"
  | "source"
  | "outline"
  | "quiet-outline"
  | "file-explorer";
type HeadingMetaDataSettings = Record<
  HeadingMetadataSettingsType | "all",
  boolean
>;

interface CSSEnabledStatus {
  mode: boolean | null;
  all: boolean | null;
}

interface Counter {
  decorator(level: number): string;
  handler(level: number): unknown;
}
