import { editorLivePreviewField } from "obsidian";
import {
  ViewUpdate,
  PluginValue,
  EditorView,
  DecorationSet,
  Decoration,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { HeadingWidget } from "./weight";
import type { HeadingPluginData } from "../common/data";
import { className, findFirstCharacterIndex } from "../common/data";
import { createCounterFromSettings } from "../common/counter-factory";
import { Heading } from "../common/heading";

/** A StateEffect for updating decorations */
const updateHeadingDecorations = StateEffect.define<DecorationSet>();

/** A StateField to manage the decorations */
export const headingDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },

  update(decorations, tr) {
    for (const e of tr.effects) {
      if (e.is(updateHeadingDecorations)) {
        // Completely replace old decorations
        return e.value;
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** A StateEffect for editor mode */
export const updateEditorMode = StateEffect.define<boolean>();

/** A StateField to manage the editor mode */
export const editorModeField = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(updateEditorMode)) {
        return e.value;
      }
    }
    return value;
  },
});

export class HeadingEditorViewPlugin implements PluginValue {
  getPluginData: () => Promise<HeadingPluginData>;

  constructor(
    view: EditorView,
    getPluginData: () => Promise<HeadingPluginData>
  ) {
    this.getPluginData = getPluginData;
    this.updateDecorations(view, view.state.field(editorLivePreviewField));
  }

  update(update: ViewUpdate) {
    if (
      update.docChanged ||
      update.viewportChanged ||
      update.transactions.some((tr) =>
        tr.effects.some((e) => e.is(updateEditorMode))
      )
    ) {
      this.updateDecorations(
        update.view,
        update.state.field(editorLivePreviewField)
      );
    }
  }

  destroy() {
    // Cleanup if needed
  }

  private async updateDecorations(view: EditorView, isLivePreviwMode: boolean) {
    const pluginData = await this.getPluginData();

    if (
      (isLivePreviwMode && pluginData.enabledInPreview) ||
      (!isLivePreviwMode && pluginData.enabledInSource)
    ) {
      //? Cache has latency, the level and position of the heading
      //? object is not real-time and need self-calculation.
      const builder = new RangeSetBuilder<Decoration>();
      const doc = view.state.doc;

      const settings = isLivePreviwMode
        ? pluginData.previewSettings
        : pluginData.sourceSettings;

      const { position, opacity } = settings;

      const counter = createCounterFromSettings(settings, doc);

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
          const widget = new HeadingWidget(
            isLivePreviwMode,
            content,
            opacity,
            position,
            level
          );
          const deco = Decoration.widget({
            widget,
            side: this.getSide(position),
            block: false,
          });

          let hideDeco: Decoration | null = null;
          if (!isLivePreviwMode) {
            const hideNumberSigns = pluginData.sourceHideNumberSigns;
            if (hideNumberSigns) {
              hideDeco = Decoration.mark({
                class: className.hideSourceNumberSigns,
              });
            }
          }

          if (position === "before-inside") {
            const charIndex = isLivePreviwMode
              ? findFirstCharacterIndex(lineText)
              : 0;
            builder.add(line.from + charIndex, line.from + charIndex, deco);

            if (hideDeco) {
              const cIndex = findFirstCharacterIndex(lineText);
              if (cIndex > 0) {
                builder.add(line.from, line.from + cIndex, hideDeco);
              }
            }
          } else if (position === "before") {
            builder.add(line.from, line.from, deco);

            if (hideDeco) {
              const cIndex = findFirstCharacterIndex(lineText);
              if (cIndex > 0) {
                builder.add(line.from, line.from + cIndex, hideDeco);
              }
            }
          } else {
            if (hideDeco) {
              const cIndex = findFirstCharacterIndex(lineText);
              if (cIndex > 0) {
                builder.add(line.from, line.from + cIndex, hideDeco);
              }
            }

            builder.add(line.to, line.to, deco);
          }
        }
      }

      const newDecorations = builder.finish();

      view.dispatch({
        effects: updateHeadingDecorations.of(newDecorations),
      });
    } else {
      // Clear decorations if not enabled in the current mode
      view.dispatch({
        effects: updateHeadingDecorations.of(Decoration.none),
      });
    }
  }

  private getSide(position: PostionOptions): number {
    if (position.includes("before")) {
      return position.includes("inside") ? 1 : -1;
    } else {
      return position.includes("inside") ? -1 : 1;
    }
  }
}
