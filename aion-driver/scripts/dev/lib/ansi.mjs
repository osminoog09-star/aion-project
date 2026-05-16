/** Без зависимостей: цвета и рамки для ship-скриптов. */
export const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

export function line(ch = "─", len = 56) {
  return ch.repeat(len);
}

export function banner(title) {
  const L = line("═", 58);
  return `${ansi.cyan}${ansi.bold}${L}\n  ${title}\n${L}${ansi.reset}`;
}

export function ok(msg) {
  return `${ansi.green}✓${ansi.reset} ${msg}`;
}

export function warn(msg) {
  return `${ansi.yellow}⚠${ansi.reset} ${msg}`;
}

export function err(msg) {
  return `${ansi.red}✗${ansi.reset} ${msg}`;
}

export function info(msg) {
  return `${ansi.cyan}›${ansi.reset} ${msg}`;
}
