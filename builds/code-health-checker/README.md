# Code Health Checker

> Analyze any codebase and get a health report in seconds.

Drop it on a repo, get a score, see what's missing, find the problems. No config, no dependencies — just Node.js.

## Usage

```bash
# Analyze current directory
node src/index.js .

# Analyze a specific path
node src/index.js /workspace/ergod-builds-temp

# JSON output (for scripting)
node src/index.js . --json

# Include coverage report if found
node src/index.js . --test-coverage
```

## What it checks

| Category | Metrics |
|----------|---------|
| **Files** | File count, LOC, language breakdown, extension spread |
| **Git** | Last commit date, commits in last 30 days, contributors, branches |
| **Deps** | Total dependencies, known vulnerabilities |
| **Tests** | Test file detection, coverage (if available) |
| **Score** | 0–100 overall health score |

## Output

```
  /workspace/my-project

  Summary
    247 files · 8,432 lines of code · 4 language(s)
    Languages: JavaScript (71%), TypeScript (18%), Markdown (8%), YAML (3%)

  Git Activity
    ✓ 12 commits in last 30 days
    ✓ 3 contributors
    ✓ 4 active branch(es)

  Dependencies
    ✓ All dependencies up to date
    ✓ No known vulnerabilities

  Tests
    ✓ Coverage: 74% ████████████░░░░░░░ 14,832 lines

  Issues
    No issues found — codebase looks healthy

  Score: 85/100
```

## Requirements

- Node.js 18+
- Git (optional — enables git stats)
- npm (optional — enables dependency analysis)

## Installation

```bash
git clone https://github.com/deciduus/ergod-builds
cd ergod-builds/builds/code-health-checker
node src/index.js /path/to/your/repo
```

## Exit codes

- `0` — no critical issues
- `1` — one or more critical issues found
