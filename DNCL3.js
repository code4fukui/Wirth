import { parseModule } from "https://code4fukui.github.io/acorn-es/parseModule.js";

const reserved = [
  "print", "input", "if", "then", "else", "while", "do", "until", "for", "to", "step", "function", "return",
  "and", "or", "not",
];

const isNumber = (c) => "0123456789".indexOf(c) >= 0;
const isOperator = (c) => "+-*/%=!<>,".indexOf(c) >= 0;
const isUpperAlphabet = (c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) >= 0;

const isConstantName = (s) => {
  for (const c of s) {
    if (!isUpperAlphabet(c) && c != "_") return false;
  }
  return true;
};

export class DNCL3 {
  constructor(s, callbackoutput) {
    this.s = s;
    this.p = 0;
    this.vars = {};
    this.callbackoutput = callbackoutput;
    this.parse();
  }
  output(s) {
    if (this.callbackoutput) {
      this.callbackoutput(s);
    } else {
      console.log(s);
    }
  }
  getChar() {
    const res = this.s[this.p];
    this.p++;
    return res;
  }
  getToken(reteol = false) {
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
        if (reteol && c == "\n") {
          return { pos, type: "eol" };
        } else if (c == " " || c == "\t" || c == "\n") {
          continue;
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
      const o = op.operator;
      if (o != "*" && o != "/" && o != "%" && o != "//") throw new Error("非対応の演算子が使われています: " + o);
      res = {
        type: "BinaryExpression",
        left: res,
        operator: o,
        right: v2,
      };
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
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "+",
          right: v2,
        };
      } else {
        if (typeof res == "string" || typeof v2 == "string") throw new Error("文字列では使用できない演算子です");
        if (op.operator == "-") {
          res = {
            type: "BinaryExpression",
            left: res,
            operator: "-",
            right: v2,
          };
        } else {
          throw new Error("未対応の演算子です : " + op.operator);
        }
      }
    }
  }
  parseExpression0() {
    let startp = this.p;
    for (;;) {
      const token = this.getToken(true);
      if (token.operator == "," || token.type == "{" || token.type == "}" || token.type == "eof" || token.type == "eol") {
        this.backToken(token);
        const exp = this.s.substring(startp, this.p) || '""';
        //console.log(exp);
        const ast = parseModule(exp);
        return ast.body[0].expression;
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
      return {
        type: "Literal",
        value: t1.value,
      };
    } else if (t1.type == "var") {
      return {
        type: "Identifier",
        name: t1.name,
      };
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
    if (["==", "!=", ">", "<", ">=", ">=", "<="].indexOf(op.operator) == -1) {
      throw new Error("条件式で未対応の演算子です : " + op.operator);
    }
    return {
      type: "BinaryExpression",
      left: v1,
      operator: op.operator,
      right: v2,
    };
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
    if (flg) {
      return n;
    } else {
      return {
        type: "UnaryExpression",
        operator: "not",
        argument: n,
      };
    }
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
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "and",
          right: v2,
        };
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
        res = {
          type: "BinaryExpression",
          left: res,
          operator: "or",
          right: v2,
        };
      } else {
        throw new Error("未対応の演算子です : " + op.operator);
      }
    }
  }
  parseCommand(body) {
    const token = this.getToken();
    //console.log("parseCommand", token);
    if (token.type == "eof") return false;
    if (token.type == "}") {
      this.backToken(token);
      return false;
    }
    if (token.type == "print") {
      const res = [];
      for (;;) {
        res.push(this.getExpression());
        const op = this.getToken();
        if (op.type == "eol" || op.type == "eof" || op.type == "else") {
          this.backToken(op);
          break;
        }
        if (op.operator != ",") {
          this.backToken(op);
          break;
          //throw new Error("表示はコンマ区切りのみ対応しています");
        }
      }
      body.push({
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: "print",
          },
          arguments: res,
        },
      });
    } else if (token.type == "var") {
      let token2 = token;
      const res = [];
      for (;;) {
        const op = this.getToken();
        if (op.type != "operator" || op.operator != "=") throw new Error("代入は変数の後に = で続ける必要があります");
        res.push({
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "Identifier",
            name: token2.name,
          },
          right: this.getExpression(),
        });
        //if (isConstantName(token2.name) && this.vars[token2.name] !== undefined) throw new Error("定数には再代入できません");
        //this.vars[token2.name] = val;

        const op2 = this.getToken();
        if (op2.type == "eol" || op2.type == "eof") {
          this.backToken(op2);
          break;
        }
        if (op2.operator != ",") {
          //throw new Error("代入はコンマ区切りのみ対応しています");
          this.backToken(op2);
          break;
        }
        token2 = this.getToken();
        if (token2.type != "var") throw new Error("コンマ区切りで続けられるのは代入文のみです");
      }
      if (res.length == 1) {
        body.push({
          type: "ExpressionStatement",
          expression: res[0],
        });
      } else {
        body.push({
          type: "ExpressionStatement",
          expression: {
            type: "SequenceExpression",
            expressions: res,
          }
        });
      }
    } else if (token.type == "if") {
      const cond = this.getCondition();
      const tthen = this.getToken();
      //console.log("tthen", tthen);
      if (tthen.type != "{") throw new Error(`if文の条件の後に"{"がありません`);
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (endblacket.type != "}") throw new Error(`"}"で閉じられていません`);
          break;
        }
      }
      const telse = this.getToken();
      if (telse.type == "else") {
        const telse2 = this.getToken();
        if (telse2.type == "if") {
          this.backToken(telse2);
          const bodyelse = [];
          this.parseCommand(bodyelse);
          console.log(bodyelse)
          body.push({
            type: "IfStatement",
            test: cond,
            consequent: {
              type: "BlockStatement",
              body: then,
            },
            alternate: bodyelse[0],
          });        
          return true;
        }
        if (telse2.type != "{") throw new Error(`else文の条件の後に"{"がありません`);
        const bodyelse = [];
        for (;;) {
          if (!this.parseCommand(bodyelse)) {
            const endblacket = this.getToken();
            if (endblacket.type != "}") throw new Error(`"}"で閉じられていません`);
            break;
          }
        }
        body.push({
          type: "IfStatement",
          test: cond,
          consequent: {
            type: "BlockStatement",
            body: then,
          },
          alternate: {
            type: "BlockStatement",
            body: bodyelse,
          },
        });        
      } else {
        this.backToken(telse);
        body.push({
          type: "IfStatement",
          test: cond,
          consequent: {
            type: "BlockStatement",
            body: then,
          },
          alternate: null,
        });
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
  parse() {
    const body = [];
    while (this.parseCommand(body));
    const ast = { "type": "Program", body };
    this.ast = ast;
  }
  runBlock(ast) {
    const body = ast.type == "BlockStatement" || ast.type == "Program" ? ast.body : [ast];
    for (const cmd of body) {
      if (cmd.type == "ExpressionStatement") {
        if (cmd.expression.type == "AssignmentExpression") {
          const name = cmd.expression.left.name;
          if (this.vars[name] !== undefined && isConstantName(name)) {
            throw new Error("定数には再代入できません");
          }
          this.vars[name] = this.calcExpression(cmd.expression.right);
        } else if (cmd.expression.type == "CallExpression") {
          if (cmd.expression.callee.name != "print") throw new Error("print以外の関数には非対応です");
          this.output(cmd.expression.arguments.map(i => this.calcExpression(i)).join(" "));
        }
      } else if (cmd.type == "IfStatement") {
        const cond = this.calcExpression(cmd.test);
        if (cond) {
          this.runBlock(cmd.consequent);
        } else if (cmd.alternate) {
          this.runBlock(cmd.alternate);
        }
      }
    }
  }
  run() {
    this.runBlock(this.ast);
  }
  calcExpression(ast) {
    if (ast.type == "Literal") {
      return ast.value;
    } else if (ast.type == "Identifier") {
      if (this.vars[ast.name] === undefined) {
        throw new Error("初期化されていない変数 " + ast.name + " が使われました");
      }
      return this.vars[ast.name];
    } else if (ast.type == "UnaryExpression") {
      const n = this.calcExpression(ast.argument);
      return !n;
    } else if (ast.type == "BinaryExpression" || ast.type == "LogicalExpression") {
      const n = this.calcExpression(ast.left);
      const m = this.calcExpression(ast.right);
      const op = ast.operator;
      if (typeof n == "string" || typeof m == "string") {
        if (op != "+" && op != "==" && op != "!=") throw new Error("文字列では使用できない演算子です: " + op);
      }
      if (op == "+") {
        return n + m;
      } else if (op == "-") {
        return n - m;
      } else if (op == "*") {
        return n * m;
      } else if (op == "/") {
        return n / m;
      } else if (op == "%") {
        return n % m;
      } else if (op == "//") {
        return Math.floor(n / m);
      } else if (op == "==") {
        return n == m;
      } else if (op == "!=") {
        return n != m;
      } else if (op == "<") {
        return n < m;
      } else if (op == "<=") {
        return n <= m;
      } else if (op == ">") {
        return n > m;
      } else if (op == ">=") {
        return n >= m;
      } else if (op == "and") {
        return n && m;
      } else if (op == "or") {
        return n || m;
      } else {
        throw new Error("対応していない演算子が使われました");
      }
    } else {
      throw new Error("対応していない expression type が使われました。 " + ast.type);
    }
  }
}
