import "mocha";
import { expect } from "chai";
import { Counter } from "../../common/counter";

describe("common/counter", function () {
  it("Counter.handler", function () {
    const counter1 = new Counter();

    expect(counter1.handler(-1)).to.be.empty;
    expect(counter1.handler(0)).to.be.empty;
    expect(counter1.handler(7)).to.be.empty;

    expect(counter1.handler(1)).to.deep.equal([1]);
    expect(counter1.handler(2)).to.deep.equal([1, 1]);
    expect(counter1.handler(3)).to.deep.equal([1, 1, 1]);
    expect(counter1.handler(4)).to.deep.equal([1, 1, 1, 1]);
    expect(counter1.handler(5)).to.deep.equal([1, 1, 1, 1, 1]);
    expect(counter1.handler(6)).to.deep.equal([1, 1, 1, 1, 1, 1]);

    expect(counter1.handler(1)).to.deep.equal([2]);
    expect(counter1.handler(2)).to.deep.equal([2, 1]);
    expect(counter1.handler(3)).to.deep.equal([2, 1, 1]);
    expect(counter1.handler(4)).to.deep.equal([2, 1, 1, 1]);
    expect(counter1.handler(5)).to.deep.equal([2, 1, 1, 1, 1]);
    expect(counter1.handler(6)).to.deep.equal([2, 1, 1, 1, 1, 1]);

    expect(counter1.handler(2)).to.deep.equal([2, 2]);
    expect(counter1.handler(3)).to.deep.equal([2, 2, 1]);
    expect(counter1.handler(4)).to.deep.equal([2, 2, 1, 1]);
    expect(counter1.handler(5)).to.deep.equal([2, 2, 1, 1, 1]);
    expect(counter1.handler(6)).to.deep.equal([2, 2, 1, 1, 1, 1]);

    expect(counter1.handler(3)).to.deep.equal([2, 2, 2]);
    expect(counter1.handler(4)).to.deep.equal([2, 2, 2, 1]);
    expect(counter1.handler(5)).to.deep.equal([2, 2, 2, 1, 1]);
    expect(counter1.handler(6)).to.deep.equal([2, 2, 2, 1, 1, 1]);

    expect(counter1.handler(4)).to.deep.equal([2, 2, 2, 2]);
    expect(counter1.handler(5)).to.deep.equal([2, 2, 2, 2, 1]);
    expect(counter1.handler(6)).to.deep.equal([2, 2, 2, 2, 1, 1]);

    expect(counter1.handler(5)).to.deep.equal([2, 2, 2, 2, 2]);
    expect(counter1.handler(6)).to.deep.equal([2, 2, 2, 2, 2, 1]);

    expect(counter1.handler(6)).to.deep.equal([2, 2, 2, 2, 2, 2]);

    const counter2 = new Counter();

    expect(counter2.handler(2)).to.deep.equal([1, 1]);
    expect(counter2.handler(3)).to.deep.equal([1, 1, 1]);
    expect(counter2.handler(4)).to.deep.equal([1, 1, 1, 1]);
    expect(counter2.handler(5)).to.deep.equal([1, 1, 1, 1, 1]);
    expect(counter2.handler(6)).to.deep.equal([1, 1, 1, 1, 1, 1]);

    expect(counter2.handler(2)).to.deep.equal([1, 2]);
    expect(counter2.handler(3)).to.deep.equal([1, 2, 1]);
    expect(counter2.handler(4)).to.deep.equal([1, 2, 1, 1]);
    expect(counter2.handler(5)).to.deep.equal([1, 2, 1, 1, 1]);
    expect(counter2.handler(6)).to.deep.equal([1, 2, 1, 1, 1, 1]);

    expect(counter2.handler(4)).to.deep.equal([1, 2, 1, 2]);
    expect(counter2.handler(5)).to.deep.equal([1, 2, 1, 2, 1]);
    expect(counter2.handler(6)).to.deep.equal([1, 2, 1, 2, 1, 1]);

    const counter3 = new Counter();

    expect(counter3.handler(6)).to.deep.equal([1, 1, 1, 1, 1, 1]);
    expect(counter3.handler(1)).to.deep.equal([2]);
    expect(counter3.handler(6)).to.deep.equal([2, 1, 1, 1, 1, 1]);
  });

  it("Counter.decorator with default", function () {
    const counter = new Counter();
    expect(counter.decorator(-1)).to.be.empty;
    expect(counter.decorator(0)).to.empty;
    expect(counter.decorator(1)).to.equal("1");
    expect(counter.decorator(2)).to.equal("1.1");
    expect(counter.decorator(3)).to.equal("1.1.1");
    expect(counter.decorator(4)).to.equal("1.1.1.1");
    expect(counter.decorator(5)).to.equal("1.1.1.1.1");
    expect(counter.decorator(6)).to.equal("1.1.1.1.1.1");
    expect(counter.decorator(7)).to.empty;
  });

  it("Counter.decorator with unordered", function () {
    const counter = new Counter({
      ordered: false,
      levelHeadings: ["H1", "H2", "H3", "H4", "H5", "H6"],
    });
    expect(counter.decorator(-1)).to.be.empty;
    expect(counter.decorator(0)).to.empty;
    expect(counter.decorator(1)).to.equal("H1");
    expect(counter.decorator(2)).to.equal("H2");
    expect(counter.decorator(3)).to.equal("H3");
    expect(counter.decorator(4)).to.equal("H4");
    expect(counter.decorator(5)).to.equal("H5");
    expect(counter.decorator(6)).to.equal("H6");
    expect(counter.decorator(7)).to.empty;
  });

  it("Counter.decorator with decimal styleType", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "decimal",
    });
    expect(counter.decorator(-1)).to.be.empty;
    expect(counter.decorator(0)).to.be.empty;
    expect(counter.decorator(1)).to.equal("1");
    expect(counter.decorator(2)).to.equal("1.1");
    expect(counter.decorator(2)).to.equal("1.2");
    expect(counter.decorator(2)).to.equal("1.3");
    expect(counter.decorator(2)).to.equal("1.4");
    expect(counter.decorator(2)).to.equal("1.5");
    expect(counter.decorator(2)).to.equal("1.6");
    expect(counter.decorator(2)).to.equal("1.7");
    expect(counter.decorator(2)).to.equal("1.8");
    expect(counter.decorator(2)).to.equal("1.9");
    expect(counter.decorator(2)).to.equal("1.10");
    expect(counter.decorator(2)).to.equal("1.11");
    expect(counter.decorator(1)).to.equal("2");
    expect(counter.decorator(7)).to.be.empty;
  });

  it("Counter.decorator with lowerAlpha styleType", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "lowerAlpha",
    });
    expect(counter.decorator(1)).to.equal("a");
    expect(counter.decorator(2)).to.equal("a.a");
    expect(counter.decorator(2)).to.equal("a.b");
    expect(counter.decorator(2)).to.equal("a.c");
    expect(counter.decorator(2)).to.equal("a.d");
    expect(counter.decorator(2)).to.equal("a.e");
    expect(counter.decorator(2)).to.equal("a.f");
    expect(counter.decorator(2)).to.equal("a.g");
    expect(counter.decorator(2)).to.equal("a.h");
    expect(counter.decorator(2)).to.equal("a.i");
    expect(counter.decorator(2)).to.equal("a.j");
    expect(counter.decorator(2)).to.equal("a.k");
    expect(counter.decorator(2)).to.equal("a.l");
    expect(counter.decorator(2)).to.equal("a.m");
    expect(counter.decorator(2)).to.equal("a.n");
    expect(counter.decorator(2)).to.equal("a.o");
    expect(counter.decorator(2)).to.equal("a.p");
    expect(counter.decorator(2)).to.equal("a.q");
    expect(counter.decorator(2)).to.equal("a.r");
    expect(counter.decorator(2)).to.equal("a.s");
    expect(counter.decorator(2)).to.equal("a.t");
    expect(counter.decorator(2)).to.equal("a.u");
    expect(counter.decorator(2)).to.equal("a.v");
    expect(counter.decorator(2)).to.equal("a.w");
    expect(counter.decorator(2)).to.equal("a.x");
    expect(counter.decorator(2)).to.equal("a.y");
    expect(counter.decorator(2)).to.equal("a.z");
    expect(counter.decorator(2)).to.equal("a.aa");
    expect(counter.decorator(2)).to.equal("a.ab");
    expect(counter.decorator(1)).to.equal("b");
    expect(counter.decorator(7)).to.be.empty;
  });

  it("Counter.decorator with upperAlpha styleType", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "upperAlpha",
    });
    expect(counter.decorator(1)).to.equal("A");
    expect(counter.decorator(2)).to.equal("A.A");
    expect(counter.decorator(2)).to.equal("A.B");
    expect(counter.decorator(2)).to.equal("A.C");
    expect(counter.decorator(2)).to.equal("A.D");
    expect(counter.decorator(2)).to.equal("A.E");
    expect(counter.decorator(2)).to.equal("A.F");
    expect(counter.decorator(2)).to.equal("A.G");
    expect(counter.decorator(2)).to.equal("A.H");
    expect(counter.decorator(2)).to.equal("A.I");
    expect(counter.decorator(2)).to.equal("A.J");
    expect(counter.decorator(2)).to.equal("A.K");
    expect(counter.decorator(2)).to.equal("A.L");
    expect(counter.decorator(2)).to.equal("A.M");
    expect(counter.decorator(2)).to.equal("A.N");
    expect(counter.decorator(2)).to.equal("A.O");
    expect(counter.decorator(2)).to.equal("A.P");
    expect(counter.decorator(2)).to.equal("A.Q");
    expect(counter.decorator(2)).to.equal("A.R");
    expect(counter.decorator(2)).to.equal("A.S");
    expect(counter.decorator(2)).to.equal("A.T");
    expect(counter.decorator(2)).to.equal("A.U");
    expect(counter.decorator(2)).to.equal("A.V");
    expect(counter.decorator(2)).to.equal("A.W");
    expect(counter.decorator(2)).to.equal("A.X");
    expect(counter.decorator(2)).to.equal("A.Y");
    expect(counter.decorator(2)).to.equal("A.Z");
    expect(counter.decorator(2)).to.equal("A.AA");
    expect(counter.decorator(2)).to.equal("A.AB");
    expect(counter.decorator(1)).to.equal("B");
    expect(counter.decorator(7)).to.be.empty;
  });

  it("Counter.decorator with cjkDecimal styleType", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "cjkDecimal",
    });
    expect(counter.decorator(1)).to.equal("一");
    expect(counter.decorator(2)).to.equal("一.一");
    expect(counter.decorator(2)).to.equal("一.二");
    expect(counter.decorator(2)).to.equal("一.三");
    expect(counter.decorator(2)).to.equal("一.四");
    expect(counter.decorator(2)).to.equal("一.五");
    expect(counter.decorator(2)).to.equal("一.六");
    expect(counter.decorator(2)).to.equal("一.七");
    expect(counter.decorator(2)).to.equal("一.八");
    expect(counter.decorator(2)).to.equal("一.九");
    expect(counter.decorator(2)).to.equal("一.一〇");
    expect(counter.decorator(2)).to.equal("一.一一");
    expect(counter.decorator(2)).to.equal("一.一二");
    expect(counter.decorator(1)).to.equal("二");
  });

  it("Counter.decorator with customIdent styleType", function () {
    const counter1 = new Counter({
      ordered: true,
      styleType: "customIdent",
      customIdents: [],
    });
    expect(counter1.decorator(1)).to.equal("1");
    expect(counter1.decorator(2)).to.equal("1.1");
    expect(counter1.decorator(3)).to.equal("1.1.1");
    expect(counter1.decorator(4)).to.equal("1.1.1.1");
    expect(counter1.decorator(5)).to.equal("1.1.1.1.1");
    expect(counter1.decorator(6)).to.equal("1.1.1.1.1.1");
    expect(counter1.decorator(2)).to.equal("1.2");

    const counter2 = new Counter({
      ordered: true,
      styleType: "customIdent",
      customIdents: ["Ⓐ", "Ⓑ", "Ⓒ"],
    });
    expect(counter2.decorator(1)).to.equal("Ⓐ");
    expect(counter2.decorator(2)).to.equal("Ⓐ.Ⓐ");
    expect(counter2.decorator(3)).to.equal("Ⓐ.Ⓐ.Ⓐ");
    expect(counter2.decorator(4)).to.equal("Ⓐ.Ⓐ.Ⓐ.Ⓐ");
    expect(counter2.decorator(5)).to.equal("Ⓐ.Ⓐ.Ⓐ.Ⓐ.Ⓐ");
    expect(counter2.decorator(6)).to.equal("Ⓐ.Ⓐ.Ⓐ.Ⓐ.Ⓐ.Ⓐ");
    expect(counter2.decorator(2)).to.equal("Ⓐ.Ⓑ");
    expect(counter2.decorator(2)).to.equal("Ⓐ.Ⓒ");
    expect(counter2.decorator(2)).to.equal("Ⓐ.4");
    expect(counter2.decorator(2)).to.equal("Ⓐ.5");
    expect(counter2.decorator(2)).to.equal("Ⓐ.6");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.Ⓐ");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.Ⓑ");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.Ⓒ");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.4");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.5");
    expect(counter2.decorator(3)).to.equal("Ⓐ.6.6");
  });

  it("Counter.decorator with string styleType", function () {
    const counter1 = new Counter({
      ordered: true,
      styleType: "string",
    });
    expect(counter1.decorator(1)).to.equal("#");
    expect(counter1.decorator(2)).to.equal("#.#");
    expect(counter1.decorator(3)).to.equal("#.#.#");

    const counter2 = new Counter({
      ordered: true,
      styleType: "string",
      specifiedString: "*",
    });
    expect(counter2.decorator(1)).to.equal("*");
    expect(counter2.decorator(2)).to.equal("*.*");
    expect(counter2.decorator(3)).to.equal("*.*.*");

    const counter3 = new Counter({
      ordered: true,
      styleType: "string",
      specifiedString: "",
    });
    expect(counter3.decorator(1)).to.equal("#");
    expect(counter3.decorator(2)).to.equal("#.#");
    expect(counter3.decorator(3)).to.equal("#.#.#");
  });

  it("Counter.decorator with custom delimiter", function () {
    const counter1 = new Counter({
      ordered: true,
      styleType: "decimal",
    });
    expect(counter1.decorator(1)).to.equal("1");
    expect(counter1.decorator(2)).to.equal("1.1");

    const counter2 = new Counter({
      ordered: true,
      styleType: "decimal",
      delimiter: ",",
    });
    expect(counter2.decorator(1)).to.equal("1");
    expect(counter2.decorator(2)).to.equal("1,1");

    const counter3 = new Counter({
      ordered: true,
      styleType: "decimal",
      delimiter: "",
    });
    expect(counter3.decorator(1)).to.equal("1");
    expect(counter3.decorator(2)).to.equal("11");

    const counter4 = new Counter({
      ordered: true,
      styleType: "string",
      specifiedString: "#",
      delimiter: "",
    });
    expect(counter4.decorator(1)).to.equal("#");
    expect(counter4.decorator(2)).to.equal("##");
  });

  it("Counter.decorator with trailing delimiter", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "decimal",
      delimiter: ".",
      trailingDelimiter: true,
    });

    expect(counter.decorator(1)).to.equal("1.");
    expect(counter.decorator(2)).to.equal("1.1.");
  });

  it("Counter.decorator with position parameter", function () {
    const counter = new Counter({
      ordered: true,
      styleType: "decimal",
    });

    expect(counter.decorator(1)).to.equal("1");
    expect(counter.decorator(1, "before")).to.equal("2 ");
    expect(counter.decorator(2, "after")).to.equal(" 2.1");
  });
});
