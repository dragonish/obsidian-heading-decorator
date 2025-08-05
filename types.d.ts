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

type OpacityOptions = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
type PostionOptions = "before" | "before-inside" | "after" | "after-inside";

type PluginDecoratorSettingsType =
  | "commonSettings"
  | "readingSettings"
  | "previewSettings"
  | "sourceSettings"
  | "outlineSettings"
  | "quietOutlineSettings"
  | "fileExplorerSettings";

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
