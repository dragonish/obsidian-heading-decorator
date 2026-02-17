import { editorLivePreviewField } from "obsidian";
import {
  ViewPlugin,
  ViewUpdate,
  EditorView,
  gutter,
  GutterMarker,
} from "@codemirror/view";
import { Prec, RangeSet, RangeSetBuilder } from "@codemirror/state";
import type { HeadingPluginData } from "../common/data";
import { className } from "../common/data";
import { createCounterFromSettings } from "../common/counter-factory";
import { Heading } from "../common/heading";
import { updateEditorMode } from "./editor";

class HeadingGutterMarker extends GutterMarker {
  readonly content: string;
  readonly level: number;
  readonly opacity: OpacityOptions;

  constructor(content: string, level: number, opacity: OpacityOptions) {
    super();
    this.content = content;
    this.level = level;
    this.opacity = opacity;
  }

  toDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = className.gutterMarker;
    div.dataset.decoratorOpacity = `${this.opacity}%`;
    div.dataset.decoratorLevel = this.level.toString();
    div.textContent = this.content;
    return div;
  }

  eq(other: HeadingGutterMarker): boolean {
    return (
      this.content === other.content &&
      this.level === other.level &&
      this.opacity === other.opacity
    );
  }
}

export function createHeadingGutterExtension(
  getPluginData: () => Promise<HeadingPluginData>,
  showBeforeLineNumbers: boolean
): Array<ViewPlugin<HeadingGutterViewPlugin> | ReturnType<typeof Prec.high>> {
  const markers = ViewPlugin.fromClass(
    class HeadingGutterViewPlugin {
      markers: RangeSet<HeadingGutterMarker> = RangeSet.empty;
      private getPluginData: () => Promise<HeadingPluginData>;

      constructor(view: EditorView) {
        this.getPluginData = getPluginData;
        this.buildMarkers(view, view.state.field(editorLivePreviewField));
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.transactions.some((tr) =>
            tr.effects.some((e) => e.is(updateEditorMode))
          )
        ) {
          this.buildMarkers(
            update.view,
            update.state.field(editorLivePreviewField)
          );
        }
      }

      private async buildMarkers(
        view: EditorView,
        isLivePreviewMode: boolean
      ) {
        const pluginData = await this.getPluginData();

        const enabled =
          (isLivePreviewMode && pluginData.enabledInPreview) ||
          (!isLivePreviewMode && pluginData.enabledInSource);

        if (!enabled) {
          this.markers = RangeSet.empty;
          view.requestMeasure();
          return;
        }

        const doc = view.state.doc;
        const { gutterSettings } = pluginData;
        const { opacity } = gutterSettings;
        const counter = createCounterFromSettings(gutterSettings, doc);

        const builder = new RangeSetBuilder<HeadingGutterMarker>();
        const heading = new Heading();

        for (let lineIndex = 1; lineIndex <= doc.lines; lineIndex++) {
          const line = doc.line(lineIndex);
          const lineText = line.text;
          const nextLineIndex = lineIndex + 1;
          const nextLineText =
            nextLineIndex <= doc.lines ? doc.line(nextLineIndex).text : "";
          const level = heading.handler(lineIndex, lineText, nextLineText);
          if (level === -1) {
            continue;
          }

          const content = counter.decorator(level);
          if (content) {
            const marker = new HeadingGutterMarker(content, level, opacity);
            builder.add(line.from, line.from, marker);
          }
        }

        this.markers = builder.finish();
        view.requestMeasure();
      }
    }
  );

  const gutterPrec = showBeforeLineNumbers ? Prec.high : Prec.low;
  return [
    markers,
    gutterPrec(
      gutter({
        class: className.gutter,
        markers(view) {
          return view.plugin(markers)?.markers ?? RangeSet.empty;
        },
      })
    ),
  ];
}

type HeadingGutterViewPlugin = {
  markers: RangeSet<HeadingGutterMarker>;
};
