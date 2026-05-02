#!/usr/bin/env node

/**
 * code-health-checker — Analyze any codebase for health metrics
 * Usage: node src/index.js <path> [--json] [--test-coverage]
 * 
 * Examples:
 *   node src/index.js .                    analyze current dir
 *   node src/index.js /workspace --json    JSON output
 *   node src/index.js . --test-coverage    include coverage data
 */

import { analyze } from './analyzer.js';
import { parseArgs } from './args.js';

const args = parseArgs(process.argv.slice(2));

if (!args.path) {
  console.error('Usage: health <path> [--json] [--test-coverage]');
  console.error('Example: health ./src --json');
  process.exit(1);
}

const result = analyze(args.path, {
  includeCoverage: args.flags.testCoverage,
  includeGit: true,
  includeDeps: true,
});

if (args.flags.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printReport(result);
}

process.exit(result.issues.critical > 0 ? 1 : 0);

// ─── Formatters ───────────────────────────────────────────────────────────────

function printReport(r) {
  const pass = (text) => `  \x1b[32m✓\x1b[0m ${text}`;
  const warn = (text) => `  \x1b[33m⚠\x1b[0m ${text}`;
  const fail = (text) => `  \x1b[31m✗\x1b[0m ${text}`;
  const info = (text) => `    ${text}`;

  console.log(`\n  \x1b[1m\x1b[36m${r.path}\x1b[0m\n`);
  console.log(`  Summary`);
  console.log(info(`${r.stats.files} files · ${r.stats.loc} lines of code · ${r.stats.languages.length} language(s)`));
  const langStr = r.languages.map(l => `${l.name} (${l.pct}%)`).join(', ');
  console.log(info(`Languages: ${langStr}`));
  console.log(info(`Last commit: ${r.git?.lastCommit ?? 'unknown'} — "${r.git?.lastMessage ?? ''}"`));

  console.log(`\n  Files & Structure`);
  for (const [ext, count] of Object.entries(r.stats.byExtension).slice(0, 6)) {
    const label = ext || '(no ext)';
    const bar = '█'.repeat(Math.min(count, 30));
    console.log(info(`${label.padEnd(8)} ${bar} ${count}`));
  }

  console.log(`\n  Git Activity`);
  console.log(r.git.commits30d > 0 ? pass(`${r.git.commits30d} commits in last 30 days`) : warn(`No commits in last 30 days`));
  console.log(r.git.contributors > 1 ? pass(`${r.git.contributors} contributors`) : warn(`Single contributor — low bus factor`));
  console.log(r.git.branches > 0 ? pass(`${r.git.branches} active branch(es)`) : info(`No branches`));

  console.log(`\n  Dependencies`);
  if (r.deps.outdated.length === 0) {
    console.log(pass('All dependencies up to date'));
  } else {
    for (const d of r.deps.outdated.slice(0, 5)) {
      console.log(warn(`${d.name} @${d.current} → ${d.latest}`));
    }
    if (r.deps.outdated.length > 5) console.log(info(`...and ${r.deps.outdated.length - 5} more`));
  }
  if (r.deps.vulnerable.length === 0) {
    console.log(pass('No known vulnerabilities'));
  } else {
    for (const v of r.deps.vulnerable.slice(0, 5)) {
      console.log(fail(`${v.name}: ${v.severity} severity (${v.advisory})`));
    }
    if (r.deps.vulnerable.length > 5) console.log(info(`...and ${r.deps.vulnerable.length - 5} more`));
  }

  console.log(`\n  Tests`);
  if (r.tests.found) {
    const rate = `${r.tests.pct}%`;
    const line = '█'.repeat(Math.round(r.tests.pct / 5));
    console.log(r.tests.pct >= 70 ? pass(`Coverage: ${rate} ${line}`) : warn(`Coverage: ${rate} — below 70%`));
    console.log(info(`${r.tests.lines} / ${r.stats.loc} lines covered`));
    console.log(info(`${r.tests.files} test file(s) found`));
  } else {
    console.log(warn('No test files found'));
  }

  console.log(`\n  Issues`);
  if (r.issues.critical === 0 && r.issues.warnings === 0) {
    console.log(pass('No issues found — codebase looks healthy'));
  } else {
    if (r.issues.critical > 0) console.log(fail(`${r.issues.critical} critical issue(s)`));
    if (r.issues.warnings > 0) console.log(warn(`${r.issues.warnings} warning(s)`));
  }

  console.log(`\n  Score: \x1b[1m\x1b[${r.score >= 70 ? 32 : r.score >= 40 ? 33 : 31}m${r.score}/100\x1b[0m\n`);
}
