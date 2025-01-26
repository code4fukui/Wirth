import { Wirth } from "./Wirth.js";

const scrs = document.querySelectorAll(`script[type="text/wirth"]`);
for (const scr of scrs) {
  const src = scr.textContent;
  const runtime = new Wirth(src, (s) => {
    alert(s);
  });
  await runtime.run();
}
