import { DNCL3 } from "./DNCL3.js";

const scrs = document.querySelectorAll("script[type=dncl]");
for (const scr of scrs) {
  const src = scr.textContent;
  const dncl = new DNCL3(src, (s) => {
    alert(s);
  });
  dncl.run();
}
