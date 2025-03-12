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
import { Counter, TopLevelQuerier } from "../common/counter";

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

  private getLevelFromLineText(lineText: string): number {
    let level = -1;
    if (lineText.startsWith("###### ")) {
      level = 6;
    } else if (lineText.startsWith("##### ")) {
      level = 5;
    } else if (lineText.startsWith("#### ")) {
      level = 4;
    } else if (lineText.startsWith("### ")) {
      level = 3;
    } else if (lineText.startsWith("## ")) {
      level = 2;
    } else if (lineText.startsWith("# ")) {
      level = 1;
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

  private async updateDecorations(view: EditorView, isLivePreviwMode: boolean) {
    const pluginData = await this.getPluginData();

    if (
      (isLivePreviwMode && pluginData.enabledInPreview) ||
      (!isLivePreviwMode && pluginData.enabledInSource)
    ) {
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
        unorderedLevelHeadings,
      } = isLivePreviwMode
        ? pluginData.previewSettings
        : pluginData.sourceSettings;

      let ignoreTopLevel = 0;
      if (ordered && orderedIgnoreSingle) {
        const queier = new TopLevelQuerier();
        for (const heading of pluginData.headingsCache) {
          const lineIndex = heading.position.start.line + 1;
          if (lineIndex > doc.lines) {
            continue;
          }
          const line = doc.line(lineIndex);
          const lineText = line.text;

          let level = this.getLevelFromLineText(lineText);
          if (level === -1) {
            const nextLineIndex = lineIndex + 1;
            if (nextLineIndex < doc.lines) {
              const nextLine = doc.line(nextLineIndex);
              const nextLineText = nextLine.text;
              level = this.getLevelFromNextLineText(nextLineText);
            }
          }

          queier.handler(level);
        }
        ignoreTopLevel = queier.query();
      }

      const counter = new Counter({
        ordered,
        styleType: orderedStyleType,
        delimiter: orderedDelimiter,
        trailingDelimiter: orderedTrailingDelimiter,
        customIdents: getOrderedCustomIdents(orderedCustomIdents),
        specifiedString: orderedSpecifiedString,
        ignoreTopLevel,
        levelHeadings: getUnorderedLevelHeadings(unorderedLevelHeadings),
      });

      for (const heading of pluginData.headingsCache) {
        //? Cache has latency, the level and position of the heading
        //? object is not real-time and need self-calculation.
        const lineIndex = heading.position.start.line + 1;
        if (lineIndex > doc.lines) {
          continue;
        }
        const line = doc.line(lineIndex);
        const lineText = line.text;

        let level = this.getLevelFromLineText(lineText);
        if (level === -1) {
          const nextLineIndex = lineIndex + 1;
          if (nextLineIndex < doc.lines) {
            const nextLine = doc.line(nextLineIndex);
            const nextLineText = nextLine.text;
            level = this.getLevelFromNextLineText(nextLineText);
          }
        }

        if (level === -1) {
          continue;
        }

        const content = counter.decorator(level, position);

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
