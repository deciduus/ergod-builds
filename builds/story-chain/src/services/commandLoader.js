import { SlashCommandBuilder } from 'discord.js';
import { REST } from 'discord.js';
import { Routes } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('story')
    .setDescription('Manage collaborative stories')
    .addSubcommand((sub) =>
      sub.setName('new')
        .setDescription('Start a new story')
        .addStringOption((opt) =>
          opt.setName('title')
            .setDescription('Title of your story')
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName('turns')
            .setDescription('Max number of turns (default: 20)')
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName('genre')
            .setDescription('Genre tag (horror, comedy, sci-fi, romance, mystery)')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('end')
        .setDescription('End the active story in this channel')
    )
    .addSubcommand((sub) =>
      sub.setName('status')
        .setDescription('Check the current story status')
    )
    .addSubcommand((sub) =>
      sub.setName('list')
        .setDescription('List recent stories')
        .addIntegerOption((opt) =>
          opt.setName('limit')
            .setDescription('Number of stories to show (default: 10)')
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('read')
        .setDescription('Read a past story by ID')
        .addIntegerOption((opt) =>
          opt.setName('id')
            .setDescription('Story ID')
            .setRequired(true)
        )
    ),
].map((cmd) => cmd.toJSON());

export async function registerCommands(client) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('[Story Chain] Slash commands registered globally');
  } catch (err) {
    console.error('[Story Chain] Failed to register commands:', err.message);
  }
}