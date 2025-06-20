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

    const heading3 = new Heading();
    expect(heading3.handler(1, "", "---")).to.equal(-1);
    expect(heading3.handler(2, "---")).to.equal(-1);
    expect(heading3.handler(3, " ", "==")).to.equal(-1);
    expect(heading3.handler(4, "==")).to.equal(-1);
    expect(heading3.handler(5, "This is a heading 1", "==")).to.equal(1);
    expect(heading3.handler(6, "==", "==")).to.equal(-1);
    expect(heading3.handler(7, "==")).to.equal(-1);
    expect(heading3.handler(8, "")).to.equal(-1);
    expect(heading3.handler(9, "==", "==")).to.equal(1);
    expect(heading3.handler(10, "==", "==")).to.equal(-1);
    expect(heading3.handler(11, "==", "==")).to.equal(1);
    expect(heading3.handler(12, "==")).to.equal(-1);
    expect(heading3.handler(13, "")).to.equal(-1);
    expect(heading3.handler(14, "This is a heading 1", "==")).to.equal(1);
    expect(heading3.handler(15, "==", "==")).to.equal(-1);
    expect(heading3.handler(16, "==", "==")).to.equal(1);
    expect(heading3.handler(17, "==", "==")).to.equal(-1);
    expect(heading3.handler(18, "==", "")).to.equal(-1);
    expect(heading3.handler(19, "")).to.equal(-1);

    const heading4 = new Heading();
    expect(heading4.handler(1, "This is a heading 2", "-")).to.equal(2);
    expect(heading4.handler(2, "-")).to.equal(-1);
    expect(heading4.handler(3, "This is a heading 2", "- ")).to.equal(-1);
    expect(heading4.handler(4, "- ")).to.equal(-1);
    expect(heading4.handler(5, "This is a heading 2", " -")).to.equal(-1);
    expect(heading4.handler(6, " -")).to.equal(-1);
    expect(heading4.handler(7, "This is a heading 2", "--")).to.equal(2);
    expect(heading4.handler(8, "--")).to.equal(-1);
    expect(heading4.handler(9, "This is a heading 2", "-- ")).to.equal(2);
    expect(heading4.handler(10, "-- ")).to.equal(-1);
    expect(heading4.handler(11, "This is a heading 2", " --")).to.equal(-1);
    expect(heading4.handler(12, " --")).to.equal(-1);
    expect(heading4.handler(13, "This is a heading 2", "---")).to.equal(2);
    expect(heading4.handler(14, "---")).to.equal(-1);
    expect(heading4.handler(15, "This is a heading 2", "--- ")).to.equal(2);
    expect(heading4.handler(16, "--- ")).to.equal(-1);
    expect(heading4.handler(17, "This is a heading 2", " ---")).to.equal(-1);
    expect(heading4.handler(18, " ---")).to.equal(-1);
    expect(heading4.handler(19, "-", "-")).to.equal(-1);
    expect(heading4.handler(20, "-")).to.equal(-1);
    expect(heading4.handler(21, "")).to.equal(-1);
    expect(heading4.handler(22, "- ", "-")).to.equal(-1);
    expect(heading4.handler(23, "-")).to.equal(-1);
    expect(heading4.handler(24, "")).to.equal(-1);
    expect(heading4.handler(25, "-", "==")).to.equal(-1);
    expect(heading4.handler(26, "==")).to.equal(-1);
    expect(heading4.handler(27, "")).to.equal(-1);
    expect(heading4.handler(28, "- ", "==")).to.equal(-1);
    expect(heading4.handler(29, "==")).to.equal(-1);
    expect(heading4.handler(30, "")).to.equal(-1);
    expect(heading4.handler(31, " -", "==")).to.equal(-1);
    expect(heading4.handler(32, "==", "")).to.equal(-1);
    expect(heading4.handler(33, "")).to.equal(-1);
    expect(heading4.handler(34, "---", "==")).to.equal(-1);
    expect(heading4.handler(35, "==")).to.equal(-1);
    expect(heading4.handler(36, "")).to.equal(-1);
    expect(heading4.handler(37, "--- ", "==")).to.equal(-1);
    expect(heading4.handler(38, "==")).to.equal(-1);
    expect(heading4.handler(39, "")).to.equal(-1);
    expect(heading4.handler(40, " ---", "==")).to.equal(-1);
    expect(heading4.handler(41, "==")).to.equal(-1);
    expect(heading4.handler(41, "")).to.equal(-1);
    expect(heading4.handler(42, "-", "-")).to.equal(-1);
    expect(heading4.handler(43, "-", "-")).to.equal(-1);
    expect(heading4.handler(44, "-", "-")).to.equal(-1);
    expect(heading4.handler(45, "-", "-")).to.equal(-1);
    expect(heading4.handler(46, "-")).to.equal(-1);

    const heading5 = new Heading();
    expect(heading5.handler(1, ">This is a heading 1", "==")).to.equal(-1);
    expect(heading5.handler(2, "==")).to.equal(-1);
    expect(heading5.handler(3, "\tThis is a heading 1", "==")).to.equal(-1);
    expect(heading5.handler(4, "==")).to.equal(-1);
    expect(heading5.handler(5, "    This is a heading 1", "==")).to.equal(-1);
    expect(heading5.handler(6, "==")).to.equal(-1);

    const heading6 = new Heading();
    expect(heading6.handler(1, "- item a", "\t- item b")).to.equal(-1);
    expect(heading6.handler(2, "\t- item b", "- item c")).to.equal(-1);
    expect(heading6.handler(3, "- item c", "-")).to.equal(-1);
    expect(heading6.handler(4, "-", "")).to.equal(-1);
    expect(heading6.handler(5, "", "Heading 2")).to.equal(-1);
    expect(heading6.handler(6, "Heading 2", "-")).to.equal(2);
    expect(heading6.handler(7, "-", "")).to.equal(-1);
    expect(heading6.handler(8, "", "* item d")).to.equal(-1);
    expect(heading6.handler(9, "* item d", "-")).to.equal(-1);
    expect(heading6.handler(10, "-", "")).to.equal(-1);
    expect(heading6.handler(11, "", "+ item e")).to.equal(-1);
    expect(heading6.handler(12, "+ item e", "-")).to.equal(-1);
    expect(heading6.handler(13, "-", "")).to.equal(-1);

    const heading7 = new Heading();
    expect(heading7.handler(1, "1. item a", "-")).to.equal(-1);
    expect(heading7.handler(2, "-", "")).to.equal(-1);
    expect(heading7.handler(3, "", "1) item b")).to.equal(-1);
    expect(heading7.handler(4, "1) item b", "-")).to.equal(-1);
    expect(heading7.handler(5, "-", "")).to.equal(-1);
  });
});
