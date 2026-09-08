import { createInterface } from "node:readline/promises";

/** Only used as a fallback when a required value wasn't passed as a flag and stdin is a TTY. */
export async function promptText(question: string, defaultValue?: string): Promise<string> {
  if (!process.stdin.isTTY) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`${question} — no value provided and stdin is not interactive; pass it as a flag.`);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  try {
    const answer = await rl.question(`${question}${suffix}: `);
    return answer.trim() || defaultValue || "";
  } finally {
    rl.close();
  }
}
