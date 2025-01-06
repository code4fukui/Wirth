import { dir2array } from "https://js.sabae.cc/dir2array.js";

const fromext = Deno.args[0];
const toext = Deno.args[1];
console.log(fromext, "->", toext);

const fns = await dir2array("./");
for (const fn of fns) {
  if (!fn.endsWith("." + fromext)) continue;
  await Deno.rename(fn, fn.substring(0, fn.length - fromext.length) + toext);
}
