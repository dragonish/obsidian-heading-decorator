import "mocha";
import { expect } from "chai";
import { diffLevel, compareMarkdownText } from "../../common/data";

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
});
