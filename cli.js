import { Wirth } from "./Wirth.js";

const fn = Deno.args[0];
const s = await Deno.readTextFile(fn);
new Wirth(s).run();
