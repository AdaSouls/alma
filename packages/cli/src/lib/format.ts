/**
 * Minimal, dependency-free ANSI formatting. This CLI's whole point is to
 * be honest about what's real vs. what's roadmap — `ok` and `pending` are
 * visually distinct on purpose, not just decorative.
 */
const ESC = String.fromCharCode(27);
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function wrap(code: string, text: string): string {
  return useColor ? `${ESC}[${code}m${text}${ESC}[0m` : text;
}

export const green = (s: string) => wrap("32", s);
export const dim = (s: string) => wrap("2", s);
export const bold = (s: string) => wrap("1", s);
export const cyan = (s: string) => wrap("36", s);
export const red = (s: string) => wrap("31", s);

export const ok = (label: string) => console.log(`${green("✓")} ${label}`);
export const pending = (label: string) => console.log(`${dim("○")} ${dim(label)}`);
export const fail = (label: string) => console.log(`${red("✗")} ${label}`);
