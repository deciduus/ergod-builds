import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseArgs } from './args.js';
import { analyze } from './analyzer.js';

describe('Args', () => {
  it('parses path and flags', () => {
    const result = parseArgs(['/workspace', '--json', '--test-coverage']);
    assert.strictEqual(result.path, '/workspace');
    assert.strictEqual(result.flags.json, true);
    assert.strictEqual(result.flags.testCoverage, true);
  });

  it('handles empty args', () => {
    const result = parseArgs([]);
    assert.strictEqual(result.path, null);
    assert.deepStrictEqual(result.flags, {});
  });
});

describe('Analyzer', () => {
  it('analyzes the current workspace', () => {
    const result = analyze('.', { includeDeps: false, includeGit: false });
    assert.ok(result.stats.files >= 0);
    assert.ok(result.stats.loc >= 0);
    assert.ok(result.languages.length >= 0);
    assert.ok(typeof result.score === 'number');
    assert.ok(result.score >= 0 && result.score <= 100);
  });

  it('includes issue counts', () => {
    const result = analyze('.', { includeDeps: false, includeGit: false });
    assert.ok('issues' in result);
    assert.ok('critical' in result.issues);
    assert.ok('warnings' in result.issues);
  });

  it('flags.kebab-case becomes camelCase', () => {
    const result = parseArgs(['.', '--test-coverage']);
    assert.strictEqual(result.flags.testCoverage, true);
  });
});