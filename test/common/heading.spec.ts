import "mocha";
import { expect } from "chai";
import { Heading } from "../../common/heading";

describe("common/heading", function () {
  it("Heading.handler", function () {
    const heading1 = new Heading();

    expect(heading1.handler(1, "")).to.equal(-1);
    expect(heading1.handler(2, "# This is a heading 1")).to.equal(1);
    expect(heading1.handler(3, "## This is a heading 2")).to.equal(2);
    expect(heading1.handler(4, "### This is a heading 3")).to.equal(3);
    expect(heading1.handler(5, "#### This is a heading 4")).to.equal(4);
    expect(heading1.handler(6, "##### This is a heading 5")).to.equal(5);
    expect(heading1.handler(7, "###### This is a heading 6")).to.equal(6);
    expect(heading1.handler(8, "####### This is a heading 7")).to.equal(-1);
    expect(heading1.handler(9, "#")).to.equal(1);
    expect(heading1.handler(10, "## ")).to.equal(2);
    expect(heading1.handler(11, "This is a heading 1", "=")).to.equal(1);
    expect(heading1.handler(12, "=")).to.equal(-1);
    expect(heading1.handler(13, "This is a heading 2", "---  ")).to.equal(2);
    expect(heading1.handler(14, "---  ")).to.equal(-1);
    expect(heading1.handler(15, "This is a heading 2", " --")).to.equal(-1);
    expect(heading1.handler(16, " --")).to.equal(-1);
    expect(heading1.handler(17, "### This is a heading 3", "==")).to.equal(3);
    expect(heading1.handler(18, "==")).to.equal(-1);
    expect(heading1.handler(19, "###This is a heading 3")).to.equal(-1);
    expect(heading1.handler(20, " ### This is a heading 3")).to.equal(3);
    expect(heading1.handler(21, " ###This is a heading 3")).to.equal(-1);
    expect(heading1.handler(22, "  ### This is a heading 3")).to.equal(3);
    expect(heading1.handler(23, "   ### This is a heading 3")).to.equal(3);
    expect(heading1.handler(24, "    ### This is a heading 3")).to.equal(-1);

    const heading2 = new Heading();
    expect(heading2.handler(1, "---")).to.equal(-1);
    expect(heading2.handler(2, "# This is a heading 1")).to.equal(-1);
    expect(heading2.handler(3, "---")).to.equal(-1);
    expect(heading2.handler(4, "```")).to.equal(-1);
    expect(heading2.handler(5, "## This is a heading 2")).to.equal(-1);
    expect(heading2.handler(7, "```")).to.equal(-1);
    expect(heading2.handler(8, "### This is a heading 3")).to.equal(3);
    expect(heading2.handler(9, "````")).to.equal(-1);
    expect(heading2.handler(10, "#### This is a heading 4")).to.equal(-1);
    expect(heading2.handler(11, "```")).to.equal(-1);
    expect(heading2.handler(12, "##### This is a heading 5")).to.equal(-1);
    expect(heading2.handler(13, "````")).to.equal(-1);
    expect(heading2.handler(14, "###### This is a heading 6")).to.equal(6);
    expect(heading2.handler(15, "$$")).to.equals(-1);
    expect(heading2.handler(16, "### This is a heading 3")).to.equal(-1);
    expect(heading2.handler(17, "$$")).to.equal(-1);
    expect(heading2.handler(18, "#### This is a heading 4")).to.equal(4);
  });
});
