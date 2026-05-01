import { EmbedBuilder } from 'discord.js';

export function createStoryEmbed({ id, title, author, maxTurns, genre, currentTurn }) {
  const progress = '▓'.repeat(currentTurn) + '░'.repeat(maxTurns - currentTurn);
  const genreText = genre ? ` | 📌 ${genre}` : '';
  
  return new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle(`📖 ${title}`)
    .addFields(
      { name: 'Started by', value: author, inline: true },
      { name: 'Turn', value: `${currentTurn} / ${maxTurns}${genreText}`, inline: true },
      { name: 'Progress', value: progress, inline: false }
    )
    .setFooter({ text: `Story ID: ${id} | Use /story end to wrap up` })
    .setTimestamp();
}

export function createStoryEndedEmbed(story, turns) {
  const storyText = turns.map((t, i) => {
    return `**${i + 1}.** ${t.username}: "${t.sentence}"`;
  }).join('\n\n');
  
  const genreTag = story.genre ? ` [${story.genre}]` : '';
  
  return new EmbedBuilder()
    .setColor(0x10b981)
    .setTitle(`🏁 ${story.title}${genreTag}`)
    .setDescription(`*Finished with ${turns.length} turns*\n\n${storyText}`)
    .setFooter({ text: `Story ID: ${story.id} | Started by ${story.author_id}` })
    .setTimestamp(story.ended_at ? new Date(story.ended_at) : new Date());
}