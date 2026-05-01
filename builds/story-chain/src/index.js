/**
 * Story Chain — Collaborative storytelling bot for Discord
 * 
 * Run: npm install && npm start
 * Requires DISCORD_TOKEN env var
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { initializeDatabase } from './services/database.js';
import { registerCommands } from './services/commandLoader.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.on('ready', async () => {
  console.log(`[Story Chain] Logged in as ${client.user.tag}`);
  
  await initializeDatabase();
  await registerCommands(client);
  
  console.log('[Story Chain] Commands registered and ready');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName } = interaction;
  
  if (commandName === 'story') {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'new') {
      const { handleNewStory } = await import('./commands/story.js');
      await handleNewStory(interaction);
    } else if (subcommand === 'end') {
      const { handleEndStory } = await import('./commands/story.js');
      await handleEndStory(interaction);
    } else if (subcommand === 'status') {
      const { handleStoryStatus } = await import('./commands/story.js');
      await handleStoryStatus(interaction);
    } else if (subcommand === 'list') {
      const { handleListStories } = await import('./commands/story.js');
      await handleListStories(interaction);
    } else if (subcommand === 'read') {
      const { handleReadStory } = await import('./commands/story.js');
      await handleReadStory(interaction);
    }
  }
});

client.on('messageCreate', async (message) => {
  // Ignore bots and non-guild messages
  if (message.author.bot || !message.guild) return;
  
  // Check if this is a story thread
  const { checkStoryContribution } = await import('./commands/story.js');
  await checkStoryContribution(message);
});

client.login(process.env.DISCORD_TOKEN);