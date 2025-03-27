import { editorLivePreviewField } from "obsidian";
import {
  ViewUpdate,
  PluginValue,
  EditorView,
  DecorationSet,
  Decoration,
} from "@codemirror/view";
import { RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import type { HeadingPluginData } from "../common/data";
import {
  previewHeadingDecoratorClassName,
  sourceHeadingDecoratorClassName,
  getUnorderedLevelHeadings,
  getOrderedCustomIdents,
} from "../common/data";
import { getPositionClassName } from "../common/dom";
import { Counter, Querier } from "../common/counter";
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

export class HeadingViewPlugin implements PluginValue {
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

      const {
        ordered,
        position,
        opacity,
        orderedStyleType,
        orderedDelimiter,
        orderedTrailingDelimiter,
        orderedCustomIdents,
        orderedSpecifiedString,
        orderedIgnoreSingle,
        orderedBasedOnExisting,
        orderedAllowZeroLevel,
        unorderedLevelHeadings,
      } = isLivePreviwMode
        ? pluginData.previewSettings
        : pluginData.sourceSettings;

      let ignoreTopLevel = 0;
      if (ordered && (orderedIgnoreSingle || orderedBasedOnExisting)) {
        const queier = new Querier(orderedAllowZeroLevel);
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

          queier.handler(level);

          ignoreTopLevel = queier.query(orderedIgnoreSingle);
          if (ignoreTopLevel === 0) {
            break;
          }
        }
      }

      const counter = new Counter({
        ordered,
        styleType: orderedStyleType,
        delimiter: orderedDelimiter,
        trailingDelimiter: orderedTrailingDelimiter,
        customIdents: getOrderedCustomIdents(orderedCustomIdents),
        specifiedString: orderedSpecifiedString,
        ignoreTopLevel,
        allowZeroLevel: orderedAllowZeroLevel,
        levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
      });

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

        const headingClassName = isLivePreviwMode
          ? previewHeadingDecoratorClassName
          : sourceHeadingDecoratorClassName;
        const deco = Decoration.line({
          attributes: {
            class: `${headingClassName} ${getPositionClassName(position)}`,
            "data-heading-decorator": content,
            "data-decorator-opacity": `${opacity}%`,
          },
        });
        builder.add(line.from, line.from, deco);
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
}
