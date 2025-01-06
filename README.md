# Virth - Sleek Structured Programming Language

![virth logo](virth-logo.webp)

Virth (pronounced 'Virt') is an easy-to-learn, sleek structured programming language. (forked [DNCL3](https://github.com/code4fukui/DNCL3))

Virth is a sleek and modern programming language inspired by the renowned creator of Pascal, Niklaus Wirth. It embodies simplicity and elegance, designed to empower education through structured programming.

The source file extension for Virth is ".virth", and the MIME type will is "text/virth".

- Runtime on web [Virth Playground](https://code4fukui.github.io/Virth/)
- Embedded in HTML [Virth on web](https://code4fukui.github.io/Virth/dnclweb.html)
```html
<script type="module" src="https://code4fukui.github.io/Virth/web.js"></script>
<script type="text/virth">
sum = 0
for i = 1 to 10
  sum = sum + i
next
print i
</script>
```

- CLI(Command Line Interface): calculation BMI [examples/bmi.virth](examples/bmi.virth)
```sh
deno -A https://code4fukui.github.io/Virth/cli.js examples/bmi.virth
```

- app for debugging [virth2js](https://code4fukui.github.io/Virth/virth2js.html)

## 1. Variables and Values

A variable name consists of alphanumeric characters starting with a letter, along with underscores (_) or local characters. However, reserved words (such as print, input, and, or, not, if, else, endif for, to, step, next, do, while, until, end, break, function, return) cannot be used as variable names.

- ex: n, sum, points

Variable names written in all uppercase letters represent values that do not change during execution.

- ex: A, BMI

Array elements are specified by an index, starting from 0.

- ex: array[3]

Numbers are represented in decimal format. Strings are represented as a sequence of characters enclosed in double quotes (").

- ex: 100
- ex: 99.999
- ex: "It was found."

When an index starting from 0 is specified for a string, it returns the character at that position as a string, with the first character indexed as 0. If the index is out of range, an empty string ("") is returned.

```
s = "ABC"
print s[0],s[2] # A C is displayed
```

## 2. Display Statement

The "print" statement is used to display numbers, strings, or variable values. When displaying multiple values, separate them with a comma (,"). If nothing is specified, a blank line is printed.

- ex: print n (When n is 15, it displays "15")
- ex: print "OK" (it displays "OK")
- ex: print n, " found" (When n is 3, it displays "3 found")
- ex: print "(", x, ",", y, ")" (When x is 5 and y is −1, it displays "( 5 , -1 )")
- ex: print (a blank line is printed)

## 3. Assignment Statement

An assignment statement sets a value to a variable. The left side of the "=" should be a variable or an array with an index, and the right side should be the value to assign.

- ex: n = 3
- ex: points[4] = 100

You can use "[" and "]" along with "," to specify multiple element values at once, allowing them to be replaced.

- ex: points = [87, 45, 72, 100]

Multiple assignment statements can be placed side by side, separated by commas ",". In this case, the assignment statements are executed from left to right in order.

- ex: sum = n, point = n * (n + 1)

To assign values entered from external input, you can write the following statement.

- ex: x = input()
- ex: x = input("Please enter any number between 0 and 100.")

## 4. Operations

This section explains arithmetic operations, comparison operations, and logical operations. Comparison operations and their combinations with logical operations can be used as conditions in conditional statements (Section 5.1) and conditional loops (Section 5.2).

### 4.1. Arithmetic Operations

The four basic arithmetic operations — addition, subtraction, multiplication, and division — are specified using +, -, *, and /, respectively.

In integer division, the quotient can be calculated using //, and the remainder can be calculated using %.

- ex: val = 7 / 2 (The value 3.5 is assigned to val.)
- ex: quo = 7 // 2 (The value 3 is assigned to quo.)
- ex: remain = 10 % 3 (The value 1 is assigned to remain.)

In expressions with multiple operators, operations are generally evaluated from left to right. However, *, /, //, and % have higher precedence than + and -. You can also use parentheses ( and ) to explicitly specify the order of operations.

- ex: "x = a - b - c" is equals "x = (a - b) - c"
- ex: "n = 1 + a // 3" is equals "n = 1 + (a // 3)"
- ex: "ave = (a + b) // 2" is not equals "ave = a + b // 2"

For strings, only the + operator can be used in arithmetic operations. If either operand is a string, the values are concatenated as a string.

### 4.2. Comparison Operations

Comparison operations for numbers are specified using ==, !=, >, >=, <=, and <. The result of the operation is either true or false.

- ex: n > 3 (When n is greater than 3, it returns true.)
- ex: n * 2 <= 8 (When twice the value of n is less than or equal to 8, it returns true.)
- ex: n != 0 (When n is not 0, it returns true.)

String comparison operations can use == and !=. The == operator returns true if the left and right sides are the same string; otherwise, it returns false. The != operator returns true if the left and right sides are different strings; otherwise (when they are the same string), it returns false.

- ex: "ABC" == " ABC" (It returns true.)
- ex: "ABC" == "abc" (It returns false.)
- ex: "ABC" != "ABC" (It returns true.)
- ex: "ABC" != "abc" (It returns true.)

### 4.3. Logical Operations

Logical operations are operations on expressions that return either true or false, and are specified using the operators and, or, and not. The evaluation order is not, and, and then or. For the same operator, the left-hand side is evaluated first. You can also use parentheses ( and ) to explicitly specify the order of operations.

<expression1> and <expression2> returns true if both <expression1> and <expression2> are true; otherwise, it returns false.

<expression1> or <expression2> returns true if either <expression1> or <expression2> is true; otherwise, it returns false.

not <expression> returns false if <expression> is true, and true if <expression> is false.

- ex: n >= 12 and n <= 27 (When n is between 12 and 27, inclusive, it returns true.)
- ex: n % 2 == 0 or n < 0 (When n is an even number or a negative value, it returns true.)
- ex: not n > 75 (When n is not greater than 75, it returns true.)
- ex: "n > 12 and not n < 27" is equals "n > 12 and (not n < 27)"
- ex: "not n > 12 and n < 27" is eqauls "(not n > 12) and n < 27"
- ex: "n == 0 or n > 12 and n < 27" is equals "n == 0 or (n > 12 and n < 27)"

## 5. Control Statements

Control statements refer to conditional statements (Section 5.1), sequential loop statements (Section 5.2), conditional loop statements (Section 5.3), and loop interruption (Section 5.4). Comparison operations (Section 4.2) and logical operations (Section 4.3) can be used as conditions within conditional statements and conditional loop statements.

### 5.1. Conditional Statements

Conditional statements switch the execution flow based on whether a condition is true or false.

If the condition is true, a specific process is executed, and if there is no process to execute when the condition is false, it can be specified as follows.

```
if <condition>
  <process>
endif
```

ex:
```
if x < 3
  x = x + 1
  y = y - 1
endif
```

o execute a process when the condition is true and a different process when the condition is false, use "else" as follows.

```
if <condition>
  <process 1>
else
  <process 2>
endif
```

ex:
```
if x < 3
  x = x + 1
else
  x = x - 1
endif
```

条件分岐の中で複数の条件で実行する処理を切り替えたい場合は、次のように「else if」を使って条件を追加します。

```
if <condition 1>
  <process 1>
elseif <condition 2>
  <process 2>
else
  <process 3>
endif
```

ex:
```
if x == 3
  x = x + 1
elseif y > 2
  y = y + 1
else
  y = y - 1
endif
```

### 5.2. Sequential Loop Statements

A sequential loop statement repeatedly executes a process while incrementing the value of a variable.

```
for <variable> = <initial value> to <end value> step <increment>
    <process>
next
```

A sequential loop statement is executed in the following steps:

1. The initial value is assigned to <variable>.
2. If the value of <variable> is greater than the <end value>, the loop ends.
3. The <process> is executed, the <increment> is added to <variable>, and the loop returns to step 2.

ex:
```
for x = 1 to 10 step 1
  sum = sum + x
next
```

If the <increment> is 1, the step part can be omitted.

ex:
```
for x = 1 to 10
  sum = sum + x
next
```

If a negative value is specified for <increment>, the value of <variable> decreases from the <initial value>, and the <process> is repeatedly executed until the value becomes less than the <end value>.

ex:
```
for x = 10 to 1 step -1
  sum = sum + x
next
```

### 5.3. Conditional Loop Statements

There are two types of conditional loop statements: 'pre-check' and 'post-check'.

#### 5.3.1. pre-check

The <process> is repeatedly executed as long as the <condition> is true.

Since the <condition> is evaluated before executing the <process>, it is possible that the <process> will not be executed even once.

```
while <condition>
  <process>
next
```

ex:
```
while x < 10
  sum = sum + x
  x = x + 1
next
```

#### 5.3.2. post-check

The <process> is repeatedly executed until the <condition> becomes true.

Since the <condition> is evaluated after executing the <process>, the <process> is executed at least once.

```
do
  <process>
until <condition>
```

ex:
```
do
  sum = sum + x
  x = x + 1
until x >= 10
```

### 5.4. Loop Interruption

Within a loop statement, using break interrupts the loop.

```
while <condition>
  if <condition>
    break
  endif
  <process>
next
```

## 6. Functions

A function is defined as follows.

```
function <function name> ( <parameter list> )
  <process>
end
```

When a function is called, the values provided as arguments can be accessed using the variable names specified in the argument list. Multiple arguments can be separated by commas ",". A defined function is called by writing the function name followed by arguments enclosed in parentheses "(" and ")". If multiple arguments are passed, they should be separated by commas ",".

Variables in the argument list and variables assigned within a function can only be used inside that function.

In general, variables declared outside a function can also be accessed within the function. However, if a variable in the argument list has the same name as an external variable, the external variable cannot be used inside the function.

ex: "print_sum(n)" that displays the sum from 1 to a positive integer n
```
function print_sum(n)
  sum = 0
  for i = 1 to n
    sum = sum + i
  next
  print sum
end
```

ex: "print_power(m, n)" that displays the value of m raised to the power of n
```
function print_power(m, n)
  p = 1
  for i = 1 to n
    p = p * m
  next
  print p
end
```

Functions can be defined to return a value using "return". If "return" is used without specifying a value, the function will end its execution without returning any value.

ex: "power(m, n)" that returns the value of m raised to the power of n
```
function power(m, n)
  p = 1
  for i = 1 to n
    p = p * m
  next
  return p
end
```

## 8. Comment

- In a single line, any text following "#" is considered a comment and is not executed as part of the code.

```
n = rnd() # assign a random decimal number between 0 (inclusive) and 1 (exclusive) to n
```

- Text between #= and =# is treated as a comment and is not executed. If =# is not present, the comment extends to the end of the file.

```
#=
How to write
multi-line comments
=#
```

## reference

- [DNCL3](https://github.com/code4fukui/DNCL3)
