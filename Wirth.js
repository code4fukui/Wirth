import { DNCL3 } from "https://code4fukui.github.io/DNCL3/DNCL3.js";

const blacketmode = false;

export class Wirth extends DNCL3 {
  constructor(s, callbackoutput, callbackinput) {
    super(s, callbackoutput, callbackinput, blacketmode);
  }
}
