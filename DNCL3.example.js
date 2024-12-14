import { DNCL3 } from "./DNCL3.js";

const name = Deno.args[0] ?? "test";
const fn = "examples/" + name + ".dncl3";

const s = await Deno.readTextFile(fn);
new DNCL3(s).run();
