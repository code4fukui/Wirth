const reserved = [
  "print", "input", "if", "then", "else", "while", "do", "until", "for", "to", "step", "function", "return",
  "and", "or", "not",
];

const isNumber = (c) => "0123456789".indexOf(c) >= 0;
const isOperator = (c) => "+-*/%=!<>,".indexOf(c) >= 0;

export class DNCL3 {
  constructor(s) {
    this.s = s;
    this.p = 0;
    this.vars = {};
  }
  getChar() {
    const res = this.s[this.p];
    this.p++;
    return res;
  }
  getToken() {
    const STATE_FIRST = 0;
    const STATE_WORD = 1;
    const STATE_STRING = 2;
    const STATE_COMMENT = 3;
    const STATE_NUMBER = 4;
    const STATE_OPERATOR = 5;
    let state = STATE_FIRST;
    const res = [];
    const pos = this.p;
    for (;;) {
      const c = this.getChar();
      if (state == STATE_FIRST) {
        if (c == " " || c == "\t") continue;
        else if (c == "\n") {
          return { pos, type: "eol" };
        } else if (c === undefined) {
          return { pos, type: "eof" };
        } else if (c == "#") {
          state = STATE_COMMENT;
        } else if (c == "{" || c == "}" || c == "(" || c == ")") {
          return { pos, type: c };
        } else if (c == '"') {
          state = STATE_STRING;
        } else if (isNumber(c) || c == ".") {
          res.push(c);
          state = STATE_NUMBER;
        } else if (isOperator(c)) {
          res.push(c);
          state = STATE_OPERATOR;
        } else {
          res.push(c);
          state = STATE_WORD;
        }
      } else if (state == STATE_WORD) {
        if (c == " " || c == "\t" || c == "\n" || isOperator(c) || c == ")" || c === undefined) {
          this.p--;
          const w = res.join("");
          if (reserved.indexOf(w) >= 0) {
            return { pos, type: w };
          } else {
            return { pos, type: "var", name: w };
          }
        } else {
          res.push(c);
        }
      } else if (state == STATE_STRING) {
        if (c == '"') {
          const w = res.join("");
          return { pos, type: "string", value: w };
        } else if (c == "\n" || c === undefined) {
          throw new Error("文字列が閉じられていません");
        } else {
          res.push(c);
        }
      } else if (state == STATE_COMMENT) {
        if (c == "\n") {
          return { pos, type: "eol" };
        } else if (c === undefined) {
          return { pos, type: "eof" };
        }
      } else if (state == STATE_NUMBER) {
        if (isNumber(c) || c == ".") {
          res.push(c);
        } else {
          this.p--;
          const w = res.join("");
          return { pos, type: "num", value: parseFloat(w) };
        }
      } else if (state == STATE_OPERATOR) {
        if (isOperator(c)) {
          res.push(c);
        } else {
          this.p--;
          const w = res.join("");
          return { pos, type: "operator", operator: w };
        }
      }
    }
  }
  backToken(token) {
    this.p = token.pos;
  }
  getExpression1() {
    let res = this.getValue();
    for (;;) {
      const op = this.getToken();
      if (op.type != "operator" || (
          op.operator != "*" &&
          op.operator != "/" &&
          op.operator != "%" &&
          op.operator != "//"
      )) {
        this.backToken(op);
        return res;
      }
      const v2 = this.getValue();
      if (typeof res == "string" || typeof v2 == "string") throw new Error("文字列では使用できない演算子です");
      if (op.operator == "*") {
        res *= v2;
      } else if (op.operator == "/") {
        res /= v2;
      } else if (op.operator == "%") {
        res %= v2;
      } else if (op.operator == "//") {
        res = Math.floor(res / v2);
      }
    }
  }
  getExpression() {
    let res = this.getExpression1();
    for (;;) {
      const op = this.getToken();
      if (op.type != "operator" || op.operator == ",") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getExpression1();
      if (op.operator == "+") {
        res += v2;
      } else {
        if (typeof res == "string" || typeof v2 == "string") throw new Error("文字列では使用できない演算子です");
        if (op.operator == "-") {
          res -= v2;
        } else {
          throw new Error("未対応の演算子です : " + op.operator);
        }
      }
    }
  }
  getValue() {
    const t1 = this.getToken();
    if (t1.type == "(") {
      const res = this.getExpression();
      const t2 = this.getToken();
      if (t2.type != ")") throw new Error("カッコが閉じられていません");
      return res;
    }
    if (t1.type == "num" || t1.type == "string") {
      return t1.value;
    } else if (t1.type == "var") {
      if (this.vars[t1.name] === undefined) {
        throw new Error("変数 " + t1.name + " は、未定義です");
      }
      return this.vars[t1.name];
    } else {
      throw new Error("式ではないものが指定されています : " + t1.type);
    }
  }
  getConditionValue1() {
    const t1 = this.getToken();
    if (t1.type == "(") {
      const res = this.getCondition();
      const t2 = this.getToken();
      if (t2.type != ")") throw new Error("カッコが閉じられていません");
      return res;
    } else {
      this.backToken(t1);
    }
    const v1 = this.getValue();
    const op = this.getToken();
    if (op.type != "operator") {
      this.backToken(op);
      return v1;
    }
    const v2 = this.getValue();
    if (op.operator == "==") {
      return v1 == v2;
    } else if (op.operator == "!=") {
      return v1 != v2;
    } else {
      if (typeof v1 == "string" || typeof v2 == "string") throw new Error("文字列の比較は == と != のみ使えます");
      if (op.operator == ">") {
        return v1 > v2;
      } else if (op.operator == "<") {
        return v1 < v2;
      } else if (op.operator == ">=") {
        return v1 >= v2;
      } else if (op.operator == "<=") {
        return v1 <= v2;
      } else {
        throw new Error("条件式で未対応の演算子です : " + op.operator);
      }
    }
  }
  getConditionValue() {
    const chknot = this.getToken();
    let flg = true;
    if (chknot.type == "not") {
      flg = false;
    } else {
      this.backToken(chknot);
    }
    const n = this.getConditionValue1();
    return flg ? n : !n;
  }
  getConditionAnd() {
    let res = this.getConditionValue();
    for (;;) {
      const op = this.getToken();
      if (op.type != "and") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getConditionValue();
      if (op.type == "and") {
        res &&= v2;
      } else {
        throw new Error("未対応の演算子です : " + op.operator);
      }
    }
  }
  getCondition() {
    let res = this.getConditionAnd();
    for (;;) {
      const op = this.getToken();
      if (op.type != "or") {
        this.backToken(op);
        return res;
      }
      const v2 = this.getConditionAnd();
      if (op.type == "or") {
        res ||= v2;
      } else {
        throw new Error("未対応の演算子です : " + op.operator);
      }
    }
  }
  runCommand() {
    const token = this.getToken();
    //console.log("runCommand", token);
    if (token.type == "eof") return false;
    if (token.type == "print") {
      const res = [];
      for (;;) {
        const n = this.getExpression();
        res.push(n);
        const op = this.getToken();
        if (op.type == "eol" || op.type == "eof" || op.type == "else") {
          this.backToken(op);
          break;
        }
        if (op.operator != ",") throw new Error("表示はコンマ区切りのみ対応しています");
      }
      console.log(res.join(" "));
    } else if (token.type == "var") {
      let token2 = token;
      for (;;) {
        const op = this.getToken();
        if (op.type != "operator" || op.operator != "=") throw new Error("代入は変数の後に = で続ける必要があります");
        const val = this.getExpression();
        this.vars[token2.name] = val;

        const op2 = this.getToken();
        if (op2.type == "eol" || op2.type == "eof") {
          this.backToken(op2);
          break;
        }
        if (op2.operator != ",") throw new Error("代入はコンマ区切りのみ対応しています");
        token2 = this.getToken();
        if (token2.type != "var") throw new Error("コンマ区切りで続けられるのは代入文のみです");
      }
    } else if (token.type == "if") {
      const cond = this.getCondition();
      const tthen = this.getToken();
      //console.log("tthen", tthen);
      if (tthen.type != "then") throw new Error("if文の条件の後にthenがありません");
      if (cond) {
        this.runCommand();
        const telse = this.getToken();
        //console.log("telse", telse)
        if (telse.type != "eol" && telse.type != "eof") {
          if (telse.type != "else") throw new Error("if文の条件の後にelseではないものがありました");
          this.skipCommandLine();
        } else {
          this.backToken(telse);
        }
      } else {
        this.skipCommandLine();
      }
    }
    //console.log(token);
    return true;
  }
  skipCommandLine() {
    for (;;) {
      const t = this.getToken();
      if (t.type == "else") return;
      if (t.type == "eol" || t.type == "eof") {
        this.backToken(t);
        return;
      }
    }
  }
  run() {
    while (this.runCommand());
  }
}
