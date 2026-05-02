/**
 * Core analyzer — walks a directory and collects metrics
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { execSync } from 'child_process';

const EXT_MAP = {
  '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.jsx': 'TypeScript',
  '.py': 'Python', '.rb': 'Ruby', '.go': 'Go',
  '.rs': 'Rust', '.java': 'Java', '.kt': 'Kotlin',
  '.cs': 'C#', '.cpp': 'C++', '.c': 'C',
  '.html': 'HTML', '.css': 'CSS', '.scss': 'Sass',
  '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
  '.md': 'Markdown', '.txt': 'Text', '.sh': 'Shell',
  '.sql': 'SQL', '.env': 'Env', '.dockerfile': 'Dockerfile',
};

const TEST_PATTERNS = [
  /\.test\.js$/, /\.test\.ts$/, /_test\.py$/,
  /\.spec\.js$/, /\.spec\.ts$/, /_spec\.rb$/,
  /\.test\.js$/, /test_.*\.js$/,
  'package.json', 'pytest.ini', 'jest.config',
  'vitest.config', 'mocha.opts', 'karma.conf',
];

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '__pycache__',
  'dist', 'build', 'coverage', '.venv', 'venv',
  'vendor', 'vendor/bundle', 'target', 'bin',
]);

/**
 * @param {string} rootPath
 * @param {object} opts
 */
export function analyze(rootPath, opts = {}) {
  const files = walkDir(rootPath);

  const stats = computeStats(files, rootPath);
  const git = opts.includeGit !== false ? getGitStats(rootPath) : null;
  const deps = opts.includeDeps ? getDepsStats(rootPath) : null;
  const tests = detectTests(files, rootPath);
  const coverage = opts.includeCoverage ? findCoverage(rootPath) : null;

  const issues = collectIssues(stats, git, deps, tests);
  const score = computeScore(stats, git, deps, tests);

  const result = { path: rootPath, stats, tests, issues, score, languages: stats.languages };
  if (git) result.git = git;
  if (deps) result.deps = deps;
  if (coverage) result.coverage = coverage;

  return result;
}

// ─── Core functions ────────────────────────────────────────────────────────────

function walkDir(dir, files = [], depth = 0) {
  if (depth > 4) return files; // avoid infinite recursion
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walkDir(full, files, depth + 1);
      } else {
        files.push({ path: full, size: stat.size, mtime: stat.mtime });
      }
    } catch {
      // skip inaccessible files
    }
  }
  return files;
}

function computeStats(files, rootPath) {
  const byExt = {};
  const codeFiles = [];
  let totalLoc = 0;

  for (const file of files) {
    const ext = extname(file.path).toLowerCase() || '';
    byExt[ext] = (byExt[ext] || 0) + 1;

    if (isCodeFile(ext)) {
      codeFiles.push(file);
      const loc = countLoc(file.path);
      totalLoc += loc;
    }
  }

  const langMap = {};
  for (const [ext, lang] of Object.entries(EXT_MAP)) {
    if (byExt[ext]) {
      langMap[lang] = (langMap[lang] || 0) + byExt[ext];
    }
  }

  const languages = Object.entries(langMap)
    .map(([name, count]) => ({
      name,
      count,
      pct: codeFiles.length > 0 ? Math.round((count / codeFiles.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    files: files.length,
    codeFiles: codeFiles.length,
    loc: totalLoc,
    languages,
    byExtension: Object.fromEntries(
      Object.entries(byExt).sort(([, a], [, b]) => b - a)
    ),
  };
}

function countLoc(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return content.split('\n').filter(line => {
      const t = line.trim();
      return t.length > 0 && !t.startsWith('//') && !t.startsWith('#') && !t.startsWith('*');
    }).length;
  } catch {
    return 0;
  }
}

function isCodeFile(ext) {
  return ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.kt', '.cs', '.cpp', '.c', '.sh'].includes(ext);
}

// ─── Git stats ────────────────────────────────────────────────────────────────

function getGitStats(rootPath) {
  const gitDir = findGitDir(rootPath);
  if (!gitDir) return { error: 'Not a git repository' };

  const exec = (cmd) => {
    try {
      return execSync(cmd, { cwd: gitDir, timeout: 3000 }).toString().trim();
    } catch {
      return null;
    }
  };

  const lastCommit = exec(`git log -1 --format="%ai"`) || 'unknown';
  const lastMessage = exec(`git log -1 --format="%s"`) || '';
  const commits30d = parseInt(exec(`git log --since="30 days ago" --oneline | wc -l`) || '0');
  const contributors = parseInt(exec(`git shortlog -sn --all | wc -l`) || '1');
  const branches = parseInt(exec(`git branch -a | wc -l`) || '0');
  const hasRemote = exec(`git remote -v`) !== null;

  return {
    lastCommit: lastCommit.slice(0, 10),
    lastMessage,
    commits30d,
    contributors,
    branches,
    hasRemote,
  };
}

function findGitDir(start) {
  let dir = start;
  for (let i = 0; i < 5; i++) {
    try {
      statSync(join(dir, '.git'));
      return dir;
    } catch {
      dir = join(dir, '..');
    }
  }
  return null;
}

// ─── Dependencies ─────────────────────────────────────────────────────────────

function getDepsStats(rootPath) {
  const pkgPath = join(rootPath, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    return { error: 'No package.json found' };
  }

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const depsList = Object.entries(allDeps).map(([name, version]) => ({
    name,
    version,
    current: version.replace(/[\^~>=<]/g, ''),
    latest: null,
  }));

  return {
    total: depsList.length,
    deps: depsList,
    outdated: [],  // requires npm check — lightweight for now
    vulnerable: [],
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

function detectTests(files, rootPath) {
  const pkgPath = join(rootPath, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    return { found: false };
  }

  const testPatterns = pkg.directories?.test
    ? [pkg.directories.test]
    : ['test', 'tests', '__tests__', 'spec'];

  const testFiles = files.filter(f => {
    const name = basename(f.path);
    return /\.test\.(js|ts)$/.test(name) ||
           /\.spec\.(js|ts)$/.test(name) ||
           name.includes('.test.') ||
           testPatterns.some(p => f.path.includes(`/${p}/`));
  });

  const scripts = { ...pkg.scripts };
  const testScript = scripts.test || scripts['test:watch'] || '';

  return {
    found: testFiles.length > 0 || !!testScript,
    files: testFiles.length,
    filesList: testFiles.slice(0, 10).map(f => f.path),
    testCommand: testScript,
  };
}

function findCoverage(rootPath) {
  const candidates = [
    'coverage/coverage-summary.json',
    'coverage/coverage-final.json',
    '.nyc_output/out.json',
    'lcov.info',
  ];

  for (const cand of candidates) {
    try {
      const path = join(rootPath, cand);
      const content = JSON.parse(readFileSync(path, 'utf8'));
      if (content.total) {
        return {
          pct: Math.round(content.total.lines.pct || 0),
          lines: Math.round(content.total.lines.covered || 0),
        };
      }
    } catch {
      // not found, continue
    }
  }
  return null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScore(stats, git, deps, tests) {
  let score = 80;

  // No tests
  if (!tests.found) score -= 15;
  else if (tests.coverage?.pct < 70) score -= 10;

  // Low commit activity
  if (git && git.commits30d === 0) score -= 10;
  else if (git && git.commits30d < 3) score -= 5;

  // Single contributor
  if (git && git.contributors === 1) score -= 5;

  // No remote
  if (git && !git.hasRemote) score -= 5;

  // Large test file ratio is good
  if (tests.files > 0) score += 5;

  return Math.max(0, Math.min(100, score));
}

function collectIssues(stats, git, deps, tests) {
  const issues = { critical: 0, warnings: 0 };

  if (!tests.found) issues.warnings++;
  if (git && git.commits30d === 0) issues.warnings++;
  if (git && git.contributors === 1) issues.warnings++;
  if (git && !git.hasRemote) issues.warnings++;
  if (deps?.vulnerable?.length > 0) issues.critical += deps.vulnerable.length;
  if (stats.loc < 50) issues.warnings++;
  if (Object.keys(stats.byExtension).length > 12) issues.warnings++;

  return issues;
}
