/**
 * Lightweight arg parser — no dependencies needed
 */

export function parseArgs(argv) {
  const flags = {};
  let path = null;

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/, (_, l) => l.toUpperCase());
      flags[key] = true;
    } else if (!arg.startsWith('-') && !path) {
      path = arg;
    }
  }

  return { path, flags };
}
