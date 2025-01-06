import { Virth } from "./Virth.js";

const scrs = document.querySelectorAll(`script[type="text/virth"]`);
for (const scr of scrs) {
  const src = scr.textContent;
  const runtime = new Virth(src, (s) => {
    alert(s);
  });
  runtime.run();
}
