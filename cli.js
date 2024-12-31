import { DNCL3 } from "./DNCL3.js";

const fn = Deon.args[0];
const s = await Deno.readTextFile(fn);
new DNCL3(s).run();
