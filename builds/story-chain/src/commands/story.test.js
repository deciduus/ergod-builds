import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Story Command Logic', () => {
  it('should validate sentence length', () => {
    const validateSentence = (s) => s.trim().length >= 10 && s.trim().length <= 500;
    
    assert.ok(validateSentence('This is a valid sentence that is long enough.'));
    assert.ok(!validateSentence('Short'));
    assert.ok(!validateSentence(''));
  });

  it('should calculate turn progress correctly', () => {
    const calculateProgress = (current, max) => {
      const filled = '▓'.repeat(current);
      const empty = '░'.repeat(max - current);
      return filled + empty;
    };

    const result = calculateProgress(5, 20);
    assert.strictEqual(result.length, 20);
    assert.ok(result.startsWith('▓▓▓▓▓'));
  });
});