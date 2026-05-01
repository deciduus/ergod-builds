import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createStoryEmbed, createStoryEndedEmbed } from './embedBuilder.js';

describe('Embed Builder', () => {
  it('should create a story embed with correct structure', () => {
    const embed = createStoryEmbed({
      id: 1,
      title: 'Test Story',
      author: 'TestUser',
      maxTurns: 10,
      genre: 'horror',
      currentTurn: 5,
    });

    assert.ok(embed.data.title.includes('Test Story'));
    assert.ok(embed.data.fields.length >= 2);
  });

  it('should handle story without genre', () => {
    const embed = createStoryEmbed({
      id: 2,
      title: 'No Genre Story',
      author: 'Someone',
      maxTurns: 20,
      currentTurn: 0,
    });

    assert.ok(embed.data.title.includes('No Genre Story'));
  });

  it('should create ended story embed with turns', () => {
    const story = { id: 1, title: 'Done', author_id: 'user1', genre: null, ended_at: null };
    const turns = [
      { username: 'Alice', sentence: 'Once upon a time there was a ghost.', turn_number: 1 },
      { username: 'Bob', sentence: 'The ghost haunting was real.', turn_number: 2 },
    ];

    const embed = createStoryEndedEmbed(story, turns);
    assert.ok(embed.data.title.includes('Done'));
    assert.ok(embed.data.description.includes('Alice'));
    assert.ok(embed.data.description.includes('Bob'));
  });
});