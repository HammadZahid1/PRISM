/**
 * A deliberately small, side-effect free expression language for calculated columns.
 * It supports arithmetic, comparisons, boolean operators and a handful of pure functions.
 * No JavaScript evaluation is performed on imported data.
 */

export type ExpressionValue = number | string | boolean | null;

type Token = { kind: 'number' | 'string' | 'identifier' | 'operator' | 'paren' | 'comma'; text: string };

const OPERATORS = ['==', '!=', '>=', '<=', '&&', '||', '+', '-', '*', '/', '%', '>', '<', '='];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '(' || char === ')') {
      tokens.push({ kind: 'paren', text: char });
      index += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({ kind: 'comma', text: char });
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      let end = index + 1;
      let value = '';
      while (end < input.length && input[end] !== char) {
        value += input[end];
        end += 1;
      }
      if (end >= input.length) throw new Error('Unterminated string literal.');
      tokens.push({ kind: 'string', text: value });
      index = end + 1;
      continue;
    }
    if (char === '[') {
      const end = input.indexOf(']', index + 1);
      if (end < 0) throw new Error('Unterminated column reference.');
      tokens.push({ kind: 'identifier', text: input.slice(index + 1, end) });
      index = end + 1;
      continue;
    }
    const numberMatch = /^\d+(\.\d+)?/.exec(input.slice(index));
    if (numberMatch) {
      tokens.push({ kind: 'number', text: numberMatch[0] });
      index += numberMatch[0].length;
      continue;
    }
    const operator = OPERATORS.find((op) => input.startsWith(op, index));
    if (operator) {
      tokens.push({ kind: 'operator', text: operator });
      index += operator.length;
      continue;
    }
    const identifierMatch = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(input.slice(index));
    if (identifierMatch) {
      tokens.push({ kind: 'identifier', text: identifierMatch[0] });
      index += identifierMatch[0].length;
      continue;
    }
    throw new Error(`Unexpected character "${char}".`);
  }
  return tokens;
}

export interface ExpressionContext {
  [column: string]: ExpressionValue;
}

const FUNCTIONS: Record<string, (args: ExpressionValue[]) => ExpressionValue> = {
  abs: (args) => Math.abs(Number(args[0] ?? 0)),
  round: (args) => Math.round(Number(args[0] ?? 0) * 10 ** Number(args[1] ?? 0)) / 10 ** Number(args[1] ?? 0),
  sqrt: (args) => Math.sqrt(Math.max(0, Number(args[0] ?? 0))),
  min: (args) => Math.min(...args.map(Number)),
  max: (args) => Math.max(...args.map(Number)),
  pow: (args) => Number(args[0] ?? 0) ** Number(args[1] ?? 1),
  if: (args) => (args[0] ? args[1] : args[2]),
  upper: (args) => String(args[0] ?? '').toUpperCase(),
  lower: (args) => String(args[0] ?? '').toLowerCase(),
  len: (args) => String(args[0] ?? '').length,
};

function toNumber(value: ExpressionValue): number {
  if (value === null || value === '') return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function truthy(value: ExpressionValue): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

export function compileExpression(
  source: string,
  columns: string[],
): (context: ExpressionContext) => ExpressionValue {
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  // Identifiers resolve at evaluation time, so wrap static parsing in a resolver lambda.
  type Node = (context: ExpressionContext) => ExpressionValue;
  const literal = (value: ExpressionValue): Node => () => value;

  const parsePrimaryNode = (): Node => {
    const token = peek();
    if (!token) throw new Error('Incomplete expression.');
    if (token.kind === 'identifier' && tokens[position + 1]?.text === '(') {
      const fnName = take().text.toLowerCase();
      const fn = FUNCTIONS[fnName];
      if (!fn) throw new Error(`Unknown function "${fnName}".`);
      take();
      const args: Node[] = [];
      if (peek()?.text !== ')') {
        do {
          args.push(parseOrNode());
        } while (peek()?.text === ',' && take());
      }
      if (take()?.text !== ')') throw new Error(`Missing closing parenthesis for ${fnName}.`);
      return (context) => fn(args.map((arg) => arg(context)));
    }
    if (token.kind === 'identifier') {
      const name = take().text;
      if (!columns.includes(name)) throw new Error(`Unknown column "${name}".`);
      return (context) => context[name] ?? null;
    }
    if (token.kind === 'number') {
      take();
      return literal(Number(token.text));
    }
    if (token.kind === 'string') {
      take();
      return literal(token.text);
    }
    if (token.kind === 'paren' && token.text === '(') {
      take();
      const node = parseOrNode();
      if (take()?.text !== ')') throw new Error('Missing closing parenthesis.');
      return node;
    }
    throw new Error(`Unexpected token "${token.text}".`);
  };

  const parseUnary = (): Node => {
    if (peek()?.text === '-') {
      take();
      const node = parseUnary();
      return (context) => -toNumber(node(context));
    }
    if (peek()?.text === '+') {
      take();
      return parseUnary();
    }
    return parsePrimaryNode();
  };

  const parseMultiply = (): Node => {
    let left = parseUnary();
    while (['*', '/', '%'].includes(peek()?.text ?? '')) {
      const op = take().text;
      const right = parseUnary();
      const previous = left;
      left = (context) => {
        const a = toNumber(previous(context));
        const b = toNumber(right(context));
        if (op === '*') return a * b;
        if (op === '/') return b === 0 ? 0 : a / b;
        return b === 0 ? 0 : a % b;
      };
    }
    return left;
  };

  const parseAdd = (): Node => {
    let left = parseMultiply();
    while (['+', '-'].includes(peek()?.text ?? '')) {
      const op = take().text;
      const right = parseMultiply();
      const previous = left;
      left = (context) => {
        const a = previous(context);
        const b = right(context);
        if (op === '+' && (typeof a === 'string' || typeof b === 'string')) {
          return String(a ?? '') + String(b ?? '');
        }
        return op === '+' ? toNumber(a) + toNumber(b) : toNumber(a) - toNumber(b);
      };
    }
    return left;
  };

  const parseCompare = (): Node => {
    let left = parseAdd();
    while (['==', '=', '!=', '>', '<', '>=', '<='].includes(peek()?.text ?? '')) {
      const op = take().text;
      const right = parseAdd();
      const previous = left;
      left = (context) => {
        const a = previous(context);
        const b = right(context);
        const bothNumeric = typeof a === 'number' && typeof b === 'number';
        const result = bothNumeric ? a - (b as number) : String(a ?? '').localeCompare(String(b ?? ''));
        if (op === '==' || op === '=') return result === 0;
        if (op === '!=') return result !== 0;
        if (op === '>') return result > 0;
        if (op === '<') return result < 0;
        if (op === '>=') return result >= 0;
        return result <= 0;
      };
    }
    return left;
  };

  const parseAnd = (): Node => {
    let left = parseCompare();
    while (['and', '&&'].includes(peek()?.text?.toLowerCase() ?? '')) {
      take();
      const right = parseCompare();
      const previous = left;
      left = (context) => truthy(previous(context)) && truthy(right(context));
    }
    return left;
  };

  const parseOrNode = (): Node => {
    let left = parseAnd();
    while (['or', '||'].includes(peek()?.text?.toLowerCase() ?? '')) {
      take();
      const right = parseAnd();
      const previous = left;
      left = (context) => truthy(previous(context)) || truthy(right(context));
    }
    return left;
  };

  const root = parseOrNode();
  if (position !== tokens.length) throw new Error(`Unexpected token "${tokens[position].text}".`);
  return (context) => {
    const value = root(context);
    return typeof value === 'boolean' ? value : toNumber(value);
  };
}
