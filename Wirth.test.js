import * as t from "https://deno.land/std/testing/asserts.ts";
import { Wirth } from "./Wirth.js";

const run = (s) => {
  const res = [];
  const runtime = new Wirth(s, (s) => res.push(s));
  runtime.run();
  return res;
};

Deno.test("print", () => {
  t.assertEquals(run("print 3"), ["3"]);
  t.assertEquals(run(`print "ABC"`), ["ABC"]);
  t.assertEquals(run(`print "ABC", 3`), ["ABC 3"]);
});
Deno.test("var", () => {
  t.assertEquals(run("a = 1\nb = 2\nc = a + b\nprint c"), ["3"]);
  t.assertEquals(run(`a = "1"\nb = "2"\nc = a + b\nprint c`), ["12"]);
});
Deno.test("const", () => {
  t.assertEquals(run("A = 1\nprint A"), ["1"]);
  t.assertThrows(() => run("A = 1\nA = 2"));
  t.assertEquals(run("Aa = 1\nAa = 2\nprint Aa"), ["2"]);
});
