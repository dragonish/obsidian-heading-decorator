import { i18n } from "../locales";
import type { OrderedCounterStyleType } from "./data";
import * as presets from "@jsamr/counter-style/presets";

export function getStyleTypeOptions(): Record<OrderedCounterStyleType, string> {
  const styleTypeOptions: Record<OrderedCounterStyleType, string> = {
    decimal: i18n.t("style.decimal"),
    lowerAlpha: i18n.t("style.lowerAlpha"),
    upperAlpha: i18n.t("style.upperAlpha"),
    cjkDecimal: i18n.t("style.cjkDecimal"),
    decimalLeadingZero: i18n.t("style.decimalLeadingZero"),
    lowerRoman: i18n.t("style.lowerRoman"),
    upperRoman: i18n.t("style.upperRoman"),
    lowerGreek: i18n.t("style.lowerGreek"),
    lowerLatin: i18n.t("style.lowerLatin"),
    upperLatin: i18n.t("style.upperLatin"),
    arabicIndic: i18n.t("style.arabicIndic"),
    armenian: i18n.t("style.armenian"),
    bengali: i18n.t("style.bengali"),
    cambodian: i18n.t("style.cambodian"),
    cjkEarthlyBranch: i18n.t("style.cjkEarthlyBranch"),
    cjkHeavenlyStem: i18n.t("style.cjkHeavenlyStem"),
    devanagari: i18n.t("style.devanagari"),
    georgian: i18n.t("style.georgian"),
    gujarati: i18n.t("style.gujarati"),
    gurmukhi: i18n.t("style.gurmukhi"),
    hebrew: i18n.t("style.hebrew"),
    hiragana: i18n.t("style.hiragana"),
    hiraganaIroha: i18n.t("style.hiraganaIroha"),
    japaneseFormal: i18n.t("style.japaneseFormal"),
    japaneseInformal: i18n.t("style.japaneseInformal"),
    kannada: i18n.t("style.kannada"),
    katana: i18n.t("style.katana"),
    katanaIroha: i18n.t("style.katanaIroha"),
    khmer: i18n.t("style.khmer"),
    koreanHangulFormal: i18n.t("style.koreanHangulFormal"),
    koreanHanjaFormal: i18n.t("style.koreanHanjaFormal"),
    koreanHanjaInformal: i18n.t("style.koreanHanjaInformal"),
    lao: i18n.t("style.lao"),
    lowerArmenian: i18n.t("style.lowerArmenian"),
    malayalam: i18n.t("style.malayalam"),
    mongolian: i18n.t("style.mongolian"),
    myanmar: i18n.t("style.myanmar"),
    oriya: i18n.t("style.oriya"),
    persian: i18n.t("style.persian"),
    tamil: i18n.t("style.tamil"),
    telugu: i18n.t("style.telugu"),
    thai: i18n.t("style.thai"),
    tibetan: i18n.t("style.tibetan"),
    upperArmenian: i18n.t("style.upperArmenian"),
    customIdent: i18n.t("style.customIdent"),
    string: i18n.t("style.string"),
  };

  const styleTypes = Object.keys(styleTypeOptions) as OrderedCounterStyleType[];
  for (const t of styleTypes) {
    if (t !== "customIdent" && t !== "string") {
      const style = presets[t];
      styleTypeOptions[t] = `${styleTypeOptions[t]} (${style.renderCounter(
        1
      )} ${style.renderCounter(2)} ${style.renderCounter(3)})`;
    }
  }

  return styleTypeOptions;
}
