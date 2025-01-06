import { Virth } from "./Virth.js";

const fn = Deno.args[0];
const s = await Deno.readTextFile(fn);
new Virth(s).run();
