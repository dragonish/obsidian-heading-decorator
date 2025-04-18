import "mocha";
import { expect } from "chai";
import {
  diffLevel,
  compareMarkdownText,
  getBoolean,
  checkEnabledCss,
  stringToRegex,
  findFirstCharacterIndex,
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
    expect(compareMarkdownText("`h1`", "h1")).to.be.true;
    expect(compareMarkdownText("`h1` h2", "h1 h2")).to.be.true;
    expect(compareMarkdownText("h1 `` ` ``", "h1 `")).to.be.true;
    expect(compareMarkdownText("*h1*", "h1")).to.be.true;
    expect(compareMarkdownText("**h1**", "h1")).to.be.true;
    expect(compareMarkdownText("_h1_", "h1")).to.be.true;
    expect(compareMarkdownText("__h1__", "h1")).to.be.true;
    expect(compareMarkdownText("==h1==", "h1")).to.be.true;
    expect(compareMarkdownText("~~h1~~", "h1")).to.be.true;
    expect(compareMarkdownText("h1 \\<content>", "h1 <content>")).to.be.true;
    expect(compareMarkdownText("[h1](/h1)", "h1")).to.be.true;
    expect(compareMarkdownText("[h1](/h1) content", "h1 content")).to.be.true;
    expect(compareMarkdownText("[[h1]]", "h1")).to.be.true;
    expect(compareMarkdownText("[[h2|h1]]", "h1")).to.be.true;
    expect(compareMarkdownText("[[h1#h2]]", "h1 > h2")).to.be.true;
    expect(compareMarkdownText("[[#h2]]", "h2")).to.be.true;
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

  it("stringToRegex", function () {
    expect(stringToRegex("")).to.be.null;
    expect(stringToRegex("abc")).to.be.null;
    expect(stringToRegex("/abc/")).to.be.an.instanceof(RegExp);
    expect(stringToRegex("/abc/ig")).to.be.an.instanceof(RegExp);
    expect(stringToRegex("/a\\/bc/ig")).to.be.an.instanceof(RegExp);
    expect(stringToRegex("/abc/a")).to.be.null;
  });

  it("findFirstCharacterIndex", function () {
    expect(findFirstCharacterIndex("")).to.equal(0);
    expect(findFirstCharacterIndex(" ")).to.equal(0);
    expect(findFirstCharacterIndex("# h1")).to.equal(2);
    expect(findFirstCharacterIndex("## h2")).to.equal(3);
    expect(findFirstCharacterIndex("#\th1")).to.equal(2);
    expect(findFirstCharacterIndex(" # h1")).to.equal(3);
    expect(findFirstCharacterIndex("h1")).to.equal(0);
    expect(findFirstCharacterIndex(" h1")).to.equal(1);
  });
});
