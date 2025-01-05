import { parseModule } from "https://code4fukui.github.io/acorn-es/parseModule.js";

const reserved = [
  "print",
  //"input",
  "if", "then", "else",
  "while", "do", "until", "for", "to", "step", "break",
  "function", "return",
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

const MAX_LOOP = 1000;

class Return {
  constructor(val) {
    this.val = val;
  }
  getValue() {
    return this.val;
  }
}

class Break {
}

export class DNCL3 {
  constructor(s, callbackoutput) {
    this.s = s.replaceAll("\r", "");
    this.vars = {};
    this.callbackoutput = callbackoutput;
    //this.parseTokens();
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
    const STATE_COMMENT_SINGLE = 4;
    const STATE_COMMENT_MULTI = 5;
    const STATE_COMMENT_MULTI2 = 6;
    const STATE_NUMBER = 7;
    const STATE_OPERATOR = 8;
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
        } else if (c == "{" || c == "}" || c == "(" || c == ")" || c == "[" || c == "]") {
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
        if (c == " " || c == "\t" || c == "\n" || isOperator(c) || c == "(" || c == ")" || c == "[" || c == "]" || c === undefined) {
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
        if (c == "=") {
          state = STATE_COMMENT_MULTI;
        } else {
          this.p--;
          state = STATE_COMMENT_SINGLE;
        }
      } else if (state == STATE_COMMENT_SINGLE) {
        if (c == "\n") {
          return { pos, type: "eol" };
        } else if (c === undefined) {
          return { pos, type: "eof" };
        }
      } else if (state == STATE_COMMENT_MULTI) {
        if (c == "=") {
          state = STATE_COMMENT_MULTI2;
        }
      } else if (state == STATE_COMMENT_MULTI2) {
        if (c == "#") {
          return { pos, type: "eol" };
        } else {
          state = STATE_COMMENT_MULTI;
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
          //throw new Error("未対応の演算子です : " + op.operator);
          this.backToken(op);
          return res;
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
    if (t1.type == "[") {
      const elements = [];
      for (;;) {
        const t2 = this.getToken();
        if (t2.type == "]") break;
        this.backToken(t2);
        elements.push(this.getExpression());
        const t3 = this.getToken();
        if (t3.type == "]") break;
        if (t3.type != "operator" && t3.operator != ",") throw new Error("配列の定義は , で区切る必要があります");
      }
      return {
        type: "ArrayExpression",
        elements,
      };
    }
    if (t1.type == "num" || t1.type == "string") {
      return {
        type: "Literal",
        value: t1.value,
      };
    } else if (t1.type == "operator" && t1.operator == "-") {
      return {
        type: "UnaryExpression",
        operator: "-",
        argument: this.getValue(),
      };
    } else if (t1.type == "var") {
      const chk = this.getToken();
      if (chk.type != "(") {
        this.backToken(chk);
        return this.getVar(t1.name);
      }
      // function call
      const args = [];
      const chk1 = this.getToken();
      if (chk1.type != ")") {
        this.backToken(chk1);
        for (;;) {
          args.push(this.getExpression());
          const chk2 = this.getToken();
          if (chk2.type == ")") break;
          if (chk2.type != "operator" && chk2.operator != ",") throw new Error("関数呼び出しのパラメータは , 区切りが必要です");
        }
      }
      return {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: t1.name,
        },
        arguments: args,
      };

      /*
    } else if (t1.operator == "-") {
      const t2 = this.getToken();
      if (t2.type == "num") {
        return {
          type: "Literal",
          value: -t2.value,
        };
      } else {
        throw new Error("式ではないものが指定されています : " + t1.type);
      }
      */
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
    //const v1 = this.getValue();
    const v1 = this.getExpression();
    const op = this.getToken();
    if (op.type != "operator") {
      this.backToken(op);
      return v1;
    }
    //const v2 = this.getValue();
    const v2 = this.getExpression();
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
  getVar(name) {
    let op = this.getToken();

    const array = [];
    for (;;) {
      if (op.type != "[") {
        this.backToken(op);
        break;
      }
      const idx = this.getExpression();
      const op2 = this.getToken();
      if (op2.type != "]") throw new Error("配列の要素指定が ] で囲われていません");
      array.push(idx);
      op = this.getToken();
    }
    if (array.length == 0) {
      return {
        type: "Identifier",
        name: name,
      };
    }
    let left = {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: name,
      },
      property: array[0],
      computed: true,
      //optional: false,
    };
    for (let i = 1; i < array.length; i++) {
      left = {
        type: "MemberExpression",
        object: left,
        property: array[i],
        computed: true,
        //optional: false,
      };
    }
    return left;
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
      const chk = this.getToken(true);
      if (chk.type == "eol" || chk.type == "eof") {
        this.backToken(chk);
      } else {
        this.backToken(chk);
        for (;;) {
          res.push(this.getExpression());
          const op = this.getToken();
          if (op.type == "eol" || op.type == "eof") {
            this.backToken(op);
            break;
          }
          if (op.operator != ",") {
            this.backToken(op);
            break;
            //throw new Error("表示はコンマ区切りのみ対応しています");
          }
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
    } else if (token.type == "var" || token.type == "input") {
      const chk = this.getToken();
      if (chk.type == "(") { // function
        const params = [];
        const chk = this.getToken();
        if (chk.type != ")") {
          this.backToken(chk);
          for (;;) {
            params.push(this.getExpression());
            const cma = this.getToken();
            if (cma.type == ")") break;
            if (cma.type != "operator" && cma.operator != ",") throw new Error("引数の区切り , が必要です");
          }
        }
        body.push({
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: token.name,
            },
            arguments: params,
          },
        });
      } else { // var
        this.backToken(chk);
        let token2 = token;
        const res = [];
        for (;;) {
          const left = this.getVar(token2.name);
          const op = this.getToken();
          if (op.type != "operator" || op.operator != "=") throw new Error("代入は変数の後に = で続ける必要があります");
          const right = this.getExpression();
          res.push({
            type: "AssignmentExpression",
            operator: "=",
            left,
            right,
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
    } else if (token.type == "while") {
      const cond = this.getCondition();
      const tthen = this.getToken();
      //console.log("tthen", tthen);
      if (tthen.type != "{") throw new Error(`while文の条件の後に"{"がありません`);
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (endblacket.type != "}") throw new Error(`while文が"}"で閉じられていません`);
          break;
        }
      }
      body.push({
        type: "WhileStatement",
        test: cond,
        body: {
          type: "BlockStatement",
          body: then,
        }
      });
    } else if (token.type == "do") {
      const tthen = this.getToken();
      if (tthen.type != "{") throw new Error(`do文の条件の後に"{"がありません`);
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (endblacket.type != "}") throw new Error(`do文が"}"で閉じられていません`);
          break;
        }
      }
      const whileoruntil = this.getToken();
      if (whileoruntil.type == "while") {
        const cond = this.getCondition();
        body.push({
          type: "DoWhileStatement",
          body: {
            type: "BlockStatement",
            body: then,
          },
          test: cond,
        });
      } else if (whileoruntil.type == "until") {
        const cond = this.getCondition();
        body.push({
          type: "DoWhileStatement",
          body: {
            type: "BlockStatement",
            body: then,
          },
          test: {
            type: "UnaryExpression",
            operator: "not",
            argument: cond,
          },
        });
      } else {
        throw new Error("do文の後は while または until が必要です");
      }
    } else if (token.type == "for") {
      const varname = this.getToken();
      if (varname.type != "var") throw new Error("for文の後は変数名が必要です");
      const eq = this.getToken();
      if (eq.operator != "=") throw new Error("for文の変数名の後は = が必要です");
      const initval = this.getExpression();
      const to = this.getToken();
      if (to.type != "to") throw new Error("for文の初期変数設定の後は to が必要です");
      const endval = this.getExpression();
      const chkstep = this.getToken();
      let step = {
        type: "Literal",
        value: 1,
      };
      if (chkstep.type != "step") {
        this.backToken(chkstep);
      } else {
        step = this.getExpression();
        if (step.type != "Literal") throw new Error("stepには数値のみ指定可能です");
      }
      const tthen = this.getToken();
      if (tthen.type != "{") throw new Error(`for文の後に"{"がありません`);
      const then = [];
      for (;;) {
        if (!this.parseCommand(then)) {
          const endblacket = this.getToken();
          if (endblacket.type != "}") throw new Error(`for文が"}"で閉じられていません`);
          break;
        }
      }
      const astvar = {
        type: "Identifier",
        name: varname.name,
      };
      body.push({
        type: "ForStatement",
        init: {
          type: "AssignmentExpression",
          operator: "=",
          left: astvar,
          right: initval,
        },
        test: {
          type: "BinaryExpression",
          left: astvar,
          operator: step.value > 0 ? "<=" : ">=",
          right: endval,
        },
        update: {
          type: "AssignmentExpression",
          operator: "=",
          left: astvar,
          right: {
            type: "BinaryExpression",
            left: astvar,
            operator: step.value > 0 ? "+" : "-",
            right: step,
          },
        },
        body: {
          type: "BlockStatement",
          body: then,
        },
      });
    } else if (token.type == "function") {
      const varname = this.getToken();
      if (varname.type != "var") throw new Error("function文の後は関数名が必要です");
      const blacket = this.getToken();
      if (blacket.type != "(") throw new Error("関数名の後は ( が必要です");
      const params = [];
      const chk = this.getToken();
      if (chk.type != ")") {
        this.backToken(chk);
        for (;;) {
          const chk = this.getToken();
          if (chk.type != "var") throw new Error("引数名がありません");
          params.push(chk.name);
          const cma = this.getToken();
          if (cma.type == ")") break;
          if (cma.type != "operator" && cma.operator != ",") throw new Error("引数の区切り , が必要です");
        }
      }
      const b2 = this.getToken();
      if (b2.type != "{") throw new Error("関数の中身記述に { が必要です");
      const body2 = [];
      for (;;) {
        if (!this.parseCommand(body2)) {
          const endblacket = this.getToken();
          if (endblacket.type != "}") throw new Error(`関数が"}"で閉じられていません`);
          break;
        }
      }
      body.push({
        type: "FunctionDeclaration",
        id: {
          type: "Identifier",
          name: varname.name,
        },
        params: params.map(i => ({ type: "Identifier", name: i })),
        body: {
          type: "BlockStatement",
          body: body2,
        }
      });
    } else if (token.type == "return") {
      body.push({
        type: "ReturnStatement",
        argument: this.getExpression(),
      });
    } else if (token.type == "break") {
      body.push({
        type: "BreakStatement",
      });
    } else {
      //throw new Error("対応していない type " + token.type + " です");
    }
    //console.log(token);
    return true;
  }
  parse() {
    this.p = 0;
    const body = [];
    while (this.parseCommand(body));
    const ast = { "type": "Program", body };
    this.ast = ast;
  }
  parseTokens() {
    this.p = 0;
    for (;;) {
      const c = this.getToken(true);
      console.log(c);
      if (c.type == "eof") break;
    }
  }
  getArrayIndex(ast) {
    const prop = this.calcExpression(ast);
    if (prop < 0 || typeof prop == "string" && parseInt(prop).toString() != prop) {
      throw new Error("配列には0または正の整数のみ指定可能です");
    }
    return prop;
  }
  runBlock(ast) {
    const body = ast.type == "BlockStatement" || 
      ast.type == "Program" ? ast.body :
      ast.type == "SequenceExpression" ? ast.expressions : [ast];
    for (const cmd of body) {
      //console.log(cmd)
      if (cmd.type == "ExpressionStatement") {
        this.runBlock(cmd.expression);
      } else if (cmd.type == "AssignmentExpression") {
        const name = this.getVarName(cmd.left);
        if (this.vars[name] !== undefined && isConstantName(name)) {
          throw new Error("定数には再代入できません");
        }
        if (cmd.left.type == "Identifier") {
          this.vars[name] = this.calcExpression(cmd.right);
        } else if (cmd.left.type == "MemberExpression") {
          if (this.vars[name] === undefined) {
            this.vars[name] = [];
          }
          const idx = this.getArrayIndex(cmd.left.property);
          this.vars[name][idx] = this.calcExpression(cmd.right);
        } else {
          throw new Error("非対応の type です " + cmd.left.type);
        }
      } else if (cmd.type == "CallExpression") {
        const name = cmd.callee.name;
        if (name == "print") {
          this.output(cmd.arguments.map(i => this.calcExpression(i)).join(" "));
        } else {
          if (this.vars[name] === undefined) {
            throw new Error("定義されていない関数 " + name + " が使われました");
          }
          const func = this.vars[name];
          if (ast.arguments.length != func.params.length) {
            throw new Error("引数の数が合っていません");
          }
          for (let i = 0; i < ast.arguments.length; i++) {
            const localvarname = func.params[i].name;
            this.vars[localvarname] = this.calcExpression(ast.arguments[i]);
          }
          try {
            this.runBlock(func.body);
            //throw new Error("関数が値を返しませんでした");
          } catch (e) {
            if (e instanceof Return) {
              //return e.getValue();
            }
            throw e;
          }
        }
      } else if (cmd.type == "IfStatement") {
        const cond = this.calcExpression(cmd.test);
        if (cond) {
          this.runBlock(cmd.consequent);
        } else if (cmd.alternate) {
          this.runBlock(cmd.alternate);
        }
      } else if (cmd.type == "WhileStatement") {
        try {
          for (let i = 0;; i++) {
            const cond = this.calcExpression(cmd.test);
            if (!cond) break;
            this.runBlock(cmd.body);
            if (i >= MAX_LOOP) {
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "DoWhileStatement") {
        try {
          for (let i = 0;; i++) {
            this.runBlock(cmd.body);
            const cond = this.calcExpression(cmd.test);
            if (!cond) break;
            if (i >= MAX_LOOP) {
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "ForStatement") {
        this.runBlock(cmd.init);
        try {
          for (let i = 0;; i++) {
            const cond = this.calcExpression(cmd.test);
            if (!cond) break;
            this.runBlock(cmd.body);
            this.runBlock(cmd.update);
            if (i >= MAX_LOOP) {
              throw new Error(MAX_LOOP + "回の繰り返し上限に達しました");
            }
          }
        } catch (e) {
          if (!(e instanceof Break)) {
            throw e;
          }
        }
      } else if (cmd.type == "FunctionDeclaration") {
        const name = cmd.id.name;
        if (this.vars[name] !== undefined) {
          throw new Error("すでに宣言済みに名前では関数を定義できません");
        }
        this.vars[name] = cmd;
      } else if (cmd.type == "ReturnStatement") {
        const val = this.calcExpression(cmd.argument);
        throw new Return(val);
      } else if (cmd.type == "BreakStatement") {
        throw new Break();
      } else {
        throw new Error("対応していない expression type が使われました。 " + cmd.type);
      }
    }
  }
  run() {
    this.runBlock(this.ast);
    //console.log(this.vars);
  }
  getVarName(ast) {
    for (;;) {
      if (ast.type == "Identifier") return ast.name;
      else if (ast.type == "MemberExpression") ast = ast.object;
      else throw new Error("非対応の type です " + ast.type);
    }
  }
  calcExpression(ast) {
    if (ast.type == "Literal") {
      return ast.value;
    } else if (ast.type == "Identifier") {
      if (this.vars[ast.name] === undefined) {
        //console.log("var", this.vars)
        throw new Error("初期化されていない変数 " + ast.name + " が使われました");
      }
      return this.vars[ast.name];
    } else if (ast.type == "MemberExpression") {
      const name = this.getVarName(ast);
      if (this.vars[name] === undefined) {
        throw new Error("初期化されていない配列 " + name + " が使われました");
      }
      const idx = this.getArrayIndex(ast.property);
      const v = this.vars[name];
      if (typeof v == "string") {
        if (idx >= 0 && idx < v.length) return v[idx];
        return "";
      } else {
        return v[idx];
      }
    } else if (ast.type == "UnaryExpression") {
      const n = this.calcExpression(ast.argument);
      if (ast.operator == "not") {
        return !n;
      } else if (ast.operator == "-") {
        return -n;
      } else {
        throw new Error("対応していない演算子 " + ast.operator + " です");
      }
    } else if (ast.type == "ArrayExpression") {
      const ar = ast.elements.map(i => this.calcExpression(i));
      return ar;
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
    } else if (ast.type == "CallExpression") {
      const name = ast.callee.name;
      if (name == "input") {
        if (ast.arguments.length > 1) {
          throw new Error("引数の数が合っていません");
        }
        const q = ast.arguments.length ? this.calcExpression(ast.arguments[0]) : "入力してください";
        const s = prompt(q);
        if (s == null) return "";
        const f = parseFloat(s);
        if (!isNaN(f) && f.toString() == s) return f;
        return s;
      }
      if (this.vars[name] === undefined) {
        throw new Error("定義されていない関数 " + name + " が使われました");
      }
      const func = this.vars[name];
      if (ast.arguments.length != func.params.length) {
        throw new Error("引数の数が合っていません");
      }
      for (let i = 0; i < ast.arguments.length; i++) {
        const localvarname = func.params[i].name;
        this.vars[localvarname] = this.calcExpression(ast.arguments[i]);
      }
      try {
        this.runBlock(func.body);
        throw new Error("関数が値を返しませんでした");
      } catch (e) {
        if (e instanceof Return) {
          return e.getValue();
        }
        throw e;
      }
    } else {
      throw new Error("対応していない expression type が使われました。 " + ast.type);
    }
  }
  getVars() {
    const res = {};
    for (const name in this.vars) {
      const o = this.vars[name];
      if (typeof o == "object" && o.type == "FunctionDeclaration") {
        res[name] = "[function]";
      } else {
        res[name] = o;
      }
    }
    return res;
  }
}
