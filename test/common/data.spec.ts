import "mocha";
import { expect } from "chai";
import {
  diffLevel,
  compareMarkdownText,
  getBoolean,
  checkEnabledCss,
} from "../../common/data";

describe("common/data", function () {
  it("diffLevel", function () {
    expect(diffLevel(1, 1)).to.be.true;
    expect(diffLevel(2, 1)).to.be.false;
    expect(diffLevel(1, 2)).to.be.true;
    expect(diffLevel(3, 1)).be.false;
    expect(diffLevel(1, 3)).to.be.true;
    expect(diffLevel(4, 1)).be.false;
    expect(diffLevel(1, 4)).to.be.true;
    expect(diffLevel(5, 2)).be.false;
    expect(diffLevel(2, 5)).to.be.true;
    expect(diffLevel(6, 1)).be.false;
    expect(diffLevel(1, 6)).to.be.true;
  });

  it("compareMarkdownText", function () {
    expect(compareMarkdownText("", "")).to.be.true;
    expect(compareMarkdownText("h1", "h1")).to.be.true;
    expect(compareMarkdownText("h1", "h2")).to.be.false;
    expect(compareMarkdownText("h1", "`h1`")).to.be.true;
    expect(compareMarkdownText("h1 h2", "`h1` h2")).to.be.true;
    expect(compareMarkdownText("h1 `", "h1 `` ` ``")).to.be.true;
    expect(compareMarkdownText("h1", "*h1*")).to.be.true;
    expect(compareMarkdownText("h1", "**h1**")).to.be.true;
    expect(compareMarkdownText("h1", "_h1_")).to.be.true;
    expect(compareMarkdownText("h1", "__h1__")).to.be.true;
    expect(compareMarkdownText("h1", "==h1==")).to.be.true;
    expect(compareMarkdownText("h1", "~~h1~~")).to.be.true;
  });

  it("getBoolean", function () {
    expect(getBoolean(true)).to.be.true;
    expect(getBoolean(false)).to.be.false;
    expect(getBoolean("true")).to.be.true;
    expect(getBoolean("false")).to.be.false;
    expect(getBoolean("yes")).to.be.true;
    expect(getBoolean("no")).to.be.false;
    expect(getBoolean("on")).to.be.true;
    expect(getBoolean("off")).to.be.false;
    expect(getBoolean("1")).to.be.true;
    expect(getBoolean("0")).to.be.false;
    expect(getBoolean(1)).to.be.true;
    expect(getBoolean(0)).to.be.false;
    expect(getBoolean(null)).to.be.null;
    expect(getBoolean(undefined)).to.be.null;
    expect(getBoolean("")).to.be.null;
    expect(getBoolean("abc")).to.be.null;
    expect(getBoolean(123)).to.be.null;
    expect(getBoolean([])).to.be.null;
    expect(getBoolean({})).to.be.null;
  });

  it("checkEnabledCss", function () {
    expect(checkEnabledCss("", "reading")).to.be.null;
    expect(checkEnabledCss("enable-preview-heading", "reading")).to.be.null;
    expect(checkEnabledCss("enable-heading", "reading")).to.be.true;
    expect(checkEnabledCss("disable-heading", "reading")).to.be.false;
    expect(checkEnabledCss("enable-reading-heading", "reading")).to.be.true;
    expect(checkEnabledCss("disable-reading-heading", "reading")).to.be.false;
    expect(checkEnabledCss("enable-heading disable-heading", "reading")).to.be
      .true;
    expect(checkEnabledCss("disable-heading enable-heading", "reading")).to.be
      .false;
    expect(
      checkEnabledCss(
        "enable-reading-heading disable-reading-heading",
        "reading"
      )
    ).to.be.true;
    expect(
      checkEnabledCss(
        "disable-reading-heading enable-reading-heading",
        "reading"
      )
    ).to.be.false;
    expect(checkEnabledCss("enable-heading disable-reading-heading", "reading"))
      .to.be.true;
    expect(checkEnabledCss("disable-heading enable-reading-heading", "reading"))
      .to.be.false;
    expect(checkEnabledCss("enable-reading-heading disable-heading", "reading"))
      .to.be.true;
    expect(checkEnabledCss("disable-reading-heading enable-heading", "reading"))
      .to.be.false;
  });
});
