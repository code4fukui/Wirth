import * as t from "https://deno.land/std/testing/asserts.ts";
import { DNCL3 } from "./DNCL3.js";

const run = (s) => {
  const res = [];
  const dncl3 = new DNCL3(s, (s) => res.push(s));
  dncl3.run();
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
