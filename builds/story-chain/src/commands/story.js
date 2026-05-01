import { getDb } from '../services/database.js';
import { createStoryEmbed, createStoryEndedEmbed } from '../utils/embedBuilder.js';

export async function handleNewStory(interaction) {
  const title = interaction.options.getString('title');
  const maxTurns = interaction.options.getInteger('turns') || 20;
  const genre = interaction.options.getString('genre') || null;
  const userId = interaction.user.id;
  
  // Check if there's already an active story in this channel
  const db = getDb();
  const existing = db.prepare(
    'SELECT id FROM stories WHERE channel_id = ? AND status = ?'
  ).get(interaction.channelId, 'active');
  
  if (existing) {
    return interaction.reply({
      content: '⚠️ There\'s already an active story in this channel. End it first with `/story end`.',
      ephemeral: true,
    });
  }
  
  // Create a thread for the story
  const threadName = `📖 ${title}`;
  const thread = await interaction.channel.threads.create({
    name: threadName,
    reason: `Story: ${title}`,
  });
  
  // Save story to database
  const stmt = db.prepare(`
    INSERT INTO stories (title, channel_id, thread_id, author_id, max_turns, genre, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);
  const result = stmt.run(title, interaction.channelId, thread.id, userId, maxTurns, genre);
  const storyId = result.lastInsertRowid;
  
  // Post opening message in the thread
  const embed = createStoryEmbed({
    id: storyId,
    title,
    author: interaction.user.username,
    maxTurns,
    genre,
    currentTurn: 0,
  });
  
  await thread.send({
    content: `🎬 **Story started by ${interaction.user}!**\n\nDrop your sentence to continue the story. One sentence per turn, everyone plays!`,
    embeds: [embed],
  });
  
  await interaction.reply({
    content: `✅ Story created! Join the thread to contribute: ${thread.url}`,
    ephemeral: true,
  });
}

export async function handleEndStory(interaction) {
  const db = getDb();
  const story = db.prepare(
    'SELECT * FROM stories WHERE channel_id = ? AND status = ?'
  ).get(interaction.channelId, 'active');
  
  if (!story) {
    return interaction.reply({
      content: '❌ No active story in this channel.',
      ephemeral: true,
    });
  }
  
  // Get all turns
  const turns = db.prepare(
    'SELECT * FROM story_turns WHERE story_id = ? ORDER BY turn_number'
  ).all(story.id);
  
  // Update story status
  db.prepare(
    'UPDATE stories SET status = ?, ended_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('ended', story.id);
  
  // Post the final story in the channel
  const embed = createStoryEndedEmbed(story, turns);
  await interaction.channel.send({
    content: `🏁 **The story has ended!**\n\nSee the full tale below 👇`,
    embeds: [embed],
  });
  
  await interaction.reply({
    content: `✅ Story "${story.title}" has been wrapped up!`,
    ephemeral: true,
  });
}

export async function handleStoryStatus(interaction) {
  const db = getDb();
  const story = db.prepare(
    'SELECT * FROM stories WHERE channel_id = ? AND status = ?'
  ).get(interaction.channelId, 'active');
  
  if (!story) {
    return interaction.reply({
      content: '📭 No active story in this channel. Start one with `/story new`.',
      ephemeral: true,
    });
  }
  
  const turns = db.prepare(
    'SELECT * FROM story_turns WHERE story_id = ?'
  ).all(story.id);
  
  const embed = createStoryEmbed({
    ...story,
    currentTurn: turns.length,
  });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleListStories(interaction) {
  const limit = interaction.options.getInteger('limit') || 10;
  const db = getDb();
  
  const stories = db.prepare(
    'SELECT * FROM stories ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
  
  if (stories.length === 0) {
    return interaction.reply({
      content: '📭 No stories yet. Be the first to start one!',
      ephemeral: true,
    });
  }
  
  const listText = stories.map((s, i) => {
    const status = s.status === 'active' ? '🟢' : '🏁';
    const genre = s.genre ? `[${s.genre}] ` : '';
    return `${status} **#${s.id}** ${genre}*${s.title}* — by ${s.author_id}`;
  }).join('\n');
  
  await interaction.reply({
    content: `📚 **Recent Stories:**\n\n${listText}`,
    ephemeral: true,
  });
}

export async function handleReadStory(interaction) {
  const storyId = interaction.options.getInteger('id');
  const db = getDb();
  
  const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId);
  if (!story) {
    return interaction.reply({
      content: '❌ Story not found.',
      ephemeral: true,
    });
  }
  
  const turns = db.prepare(
    'SELECT * FROM story_turns WHERE story_id = ? ORDER BY turn_number'
  ).all(storyId);
  
  const embed = createStoryEndedEmbed(story, turns);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function checkStoryContribution(message) {
  const db = getDb();
  
  // Find active story for this channel
  const story = db.prepare(
    'SELECT * FROM stories WHERE channel_id = ? AND status = ?'
  ).get(message.channelId, 'active');
  
  if (!story) return;
  
  // Get last turn to check who went last
  const lastTurn = db.prepare(
    'SELECT user_id FROM story_turns WHERE story_id = ? ORDER BY turn_number DESC LIMIT 1'
  ).get(story.id);
  
  // If same user went last, skip
  if (lastTurn && lastTurn.user_id === message.author.id) {
    return; // User will be handled by command
  }
  
  // Validate sentence (not empty, reasonable length)
  const sentence = message.content.trim();
  if (sentence.length < 10 || sentence.length > 500) {
    return; // Let them figure it out
  }
  
  // Check turn limit
  const currentTurn = db.prepare(
    'SELECT COUNT(*) as count FROM story_turns WHERE story_id = ?'
  ).get(story.id).count;
  
  if (currentTurn >= story.max_turns) {
    return message.reply('🏁 Max turns reached! Someone should end the story with `/story end`.');
  }
  
  // Save the turn
  db.prepare(`
    INSERT INTO story_turns (story_id, user_id, username, sentence, turn_number)
    VALUES (?, ?, ?, ?, ?)
  `).run(story.id, message.author.id, message.author.username, sentence, currentTurn + 1);
  
  // React to show it was counted
  await message.react('✍️');
}