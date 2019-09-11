const canvasSize = 600;
const vecDiameter = 20;

let canvas;
let form;
let xfuncIn;
let yfuncIn;
let x0In;
let x1In;
let y0In;
let y1In;

window.addEventListener('DOMContentLoaded', function(event) {
  canvas = document.querySelector('#canvas');
  form = document.querySelector('#form');
  xfuncIn = document.querySelector('#xfunc');
  yfuncIn = document.querySelector('#yfunc');
  x0In = document.querySelector('#x0');
  x1In = document.querySelector('#x1');
  y0In = document.querySelector('#y0');
  y1In = document.querySelector('#y1');

  canvas.style.width = canvasSize + 'px';
  canvas.style.height = canvasSize + 'px';
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  xfuncIn.value = 'cos(y + (pi / 2))^2';
  yfuncIn.value = 'sin(x)^2';

  x0In.value = -5;
  x1In.value = 5;
  y0In.value = -5;
  y1In.value = 5;

  document.querySelector('#vars').textContent = vars.join(', ');
  document.querySelector('#consts').textContent = constKeys.join(', ');
  document.querySelector('#funcs').textContent = funcKeys.join(', ');

  form.onsubmit = onsubmit;
  renderForm();
});

function onsubmit(event) {
  event.preventDefault();
  event.stopPropagation();
  renderForm();
  return false;
}

function renderForm() {
  render({
    xfunc: showException(function() { return parseFunc(xfuncIn.value); }),
    yfunc: showException(function() { return parseFunc(yfuncIn.value); }),
    x0: +x0In.value,
    x1: +x1In.value,
    y0: +y0In.value,
    y1: +y1In.value,
  });
}

function render(config) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.strokeStyle = '#cccccc';

  ctx.beginPath();
  ctx.moveTo(canvasSize / 2, 0);
  ctx.lineTo(canvasSize / 2, canvasSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, canvasSize / 2);
  ctx.lineTo(canvasSize, canvasSize / 2);
  ctx.stroke();

  ctx.strokeStyle = '#999999';
  ctx.fillStyle = '#000000';

  const w = config.x1 - config.x0;
  const h = config.y1 - config.y0;
  const rad = vecDiameter / 2 + 2;
  const steps = Math.floor(canvasSize / vecDiameter);
  const canvasStep = canvasSize / steps;
  for (let row = 0; row < steps + 1; row++) {
    for (let col = 0; col < steps + 1; col++) {
      const x = (w / steps) * col + config.x0;
      const y = (h / steps) * row + config.y0;
      const env = { vars: { x: x, y: y } };
      const vec = [
        showException(function() { return evalExpr(config.xfunc, env); }),
        showException(function() { return evalExpr(config.yfunc, env); })
      ];
      const mag = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
      const norm = mag == 0 ? [0, 0] : vec.map(function(a) { return a / mag; });
      const px = col * canvasStep;
      const py = canvasSize - (row * canvasStep);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (norm[0] * rad), py - (norm[1] * rad));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px + (norm[0] * rad), py - (norm[1] * rad), 1.25, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function evalExpr(ast, env) {
  switch (ast[0]) {
    case 'neg': return -evalExpr(ast[1], env);
    case 'pos': return evalExpr(ast[1], env);
    case 'div': return evalExpr(ast[1], env) / evalExpr(ast[2], env);
    case 'mul': return evalExpr(ast[1], env) * evalExpr(ast[2], env);
    case 'sub': return evalExpr(ast[1], env) - evalExpr(ast[2], env);
    case 'add': return evalExpr(ast[1], env) + evalExpr(ast[2], env);
    case 'exp': return Math.pow(evalExpr(ast[1], env), evalExpr(ast[2], env));
    case 'num': return ast[1];
    case 'var': return env.vars[ast[1]];
    case 'const': return consts[ast[1]];
    case 'func':
      return funcs[ast[1]][0].apply(
        null,
        ast[2].map(function(subast) { return evalExpr(subast, env); })
      );
    default: throw 'unrecognized expression "' + ast[0] + '"';
  }
}

function showException(func) {
  try {
    return func();
  } catch (e) {
    window.alert(e);
    throw e;
  }
}

function parseFunc(str) {
  const tokens = peekable(lexExpr(str));
  const ast = parseExpr(tokens);
  if (tokens.peek() != null) {
    throw 'expected end of expression, got "'+ tokens.peek() + '"';
  }
  return ast;
}

function peekable(list) {
  let i = 0;

  return {
    next: function() {
      if (i >= list.length) {
        return null;
      }

      const result = list[i];
      i++;
      return result;
    },

    peek: function() {
      if (i >= list.length) {
        return null;
      }

      return list[i];
    }
  };
}

const vars = ['x', 'y'];

const consts = {
  pi: Math.PI,
  e: Math.E
};

const constKeys = Object.keys(consts);

const funcs = {
  abs: [Math.abs, 1],
  acos: [Math.acos, 1],
  acosh: [Math.acosh, 1],
  asin: [Math.asin, 1],
  asinh: [Math.asinh, 1],
  atan2: [Math.atan2, 2],
  atan: [Math.atan, 1],
  atanh: [Math.atanh, 1],
  ceil: [Math.ceil, 1],
  cos: [Math.cos, 1],
  floor: [Math.floor, 1],
  ln: [Math.log, 1],
  log2: [Math.log2, 1],
  log: [Math.log10, 1],
  max: [Math.max, 2],
  min: [Math.min, 2],
  random: [Math.random, 0],
  round: [Math.round, 1],
  sin: [Math.sin, 1],
  sqrt: [Math.sqrt, 1],
  tan: [Math.tan, 1]
};

const funcKeys = Object.keys(funcs);

function parseExpr(tokens) {
  const lhs = parseUnary(tokens);
  return parseBinary(tokens, 0, lhs);
}

function parseUnary(tokens) {
  const t = tokens.peek();
  if (['-', '+'].indexOf(t) !== -1) {
    tokens.next();
    return [t == '-' ? 'neg' : 'pos', parseUnary(tokens)];
  } else {
    return parsePrimary(tokens);
  }
}

function getPrec(token) {
  switch (token) {
    case '^':
      return 3;

    case '/':
    case '*':
      return 2;

    case '+':
    case '-':
      return 1;

    default:
      return -1;
  }
}

function parseBinary(tokens, prevPrec, lhs) {
  for (;;) {
    const t = tokens.peek();
    if (t == null) {
      break;
    }

    const prec = getPrec(t);
    if (prec < prevPrec) {
      break;
    }

    tokens.next();
    let rhs = parseUnary(tokens);

    for (;;) {
      const t2 = tokens.peek();
      if (t2 == null) {
        break;
      }

      const nextPrec = getPrec(t2);
      if (prec < nextPrec) {
        rhs = parseBinary(tokens, nextPrec, rhs);
      } else {
        break;
      }
    }

    switch (t) {
      case '/':
        lhs = ['div', lhs, rhs];
        break;
      case '*':
        lhs = ['mul', lhs, rhs];
        break;
      case '-':
        lhs = ['sub', lhs, rhs];
        break;
      case '+':
        lhs = ['add', lhs, rhs];
        break;
      case '^':
        lhs = ['exp', lhs, rhs];
        break;
      default:
        throw 'unexpected token "' + t + '"';
    }
  }

  return lhs;
}

function parsePrimary(tokens) {
  const t = tokens.next();
  if (t == null) {
    throw 'unexpected end of expression';
  }

  if (typeof t === 'number') {
    return ['num', t];
  }

  if (t === '(') {
    const expr = parseExpr(tokens);
    if (tokens.next() !== ')') {
      throw 'expected closing parenthesis';
    }
    return expr;
  }

  if (!t.match(/^[a-z]/)) {
    throw 'unexpected token "' + t + '"';
  }

  if (vars.indexOf(t) !== -1) {
    return ['var', t];
  } else if (constKeys.indexOf(t) !== -1) {
    return ['const', t];
  } else if (funcKeys.indexOf(t) !== -1) {
    if (tokens.next() !== '(') {
      throw 'expected opening parenthesis';
    }
    const params = parseParams(tokens, funcs[t][1]);
    if (tokens.next() !== ')') {
      throw 'expected closing parenthesis';
    }
    return ['func', t, params];
  } else {
    throw 'unrecognized identifier "' + t + '"';
  }
}

function parseParams(tokens, count) {
  const params = [];

  for (let i = 0; i < count; i++) {
    params.push(parseExpr(tokens));

    if (i + 1 >= count) {
      break;
    }

    if (tokens.next() !== ',') {
      throw 'expected comma';
    }
  }

  return params;
}

function lexExpr(str) {
  const tokens = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);

    if (c == ' ') {
      continue;
    } else if (['-', '+', '*', '/', '^', '(', ')', ','].indexOf(c) !== -1) {
      tokens.push(c);
      continue;
    } else if (c.match(/[a-z]/)) {
      let ident = c;
      i++;
      for (i; i < str.length; i++) {
        if (str[i].match(/[a-z0-9]/)) {
          ident += str[i];
        } else {
          i--;
          break;
        }
      }
      tokens.push(ident);
    } else if (c.match(/[0-9]/)) {
      let seenPeriod = false;
      let number = c;
      i++;
      for (i; i < str.length; i++) {
        if (!seenPeriod && str[i] == '.') {
          seenPeriod = true;
          number += '.';
        } else if (str[i].match(/[0-9]/)) {
          number += str[i];
        } else {
          i--;
          break;
        }
      }
      tokens.push(+number);
    } else {
      throw 'unrecognized character \'' + c + '\'';
    }
  }
  return tokens;
}
