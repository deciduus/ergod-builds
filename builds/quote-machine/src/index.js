/**
 * Quote Machine — Random quote generator for Discord
 * Run: npm install && DISCORD_TOKEN=xxx npm start
 */

import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const QUOTES = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "The most disastrous thing you can learn is your first programming language.", author: "Alan Perlis" },
  { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
  { text: "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", author: "Bill Gates" },
  { text: "It's hard to find errors if you spend your time optimizing working code.", author: "Keith B. Jarrett" },
  { text: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { text: "A language that doesn't affect the way you think about programming is not worth knowing.", author: "Alan Perlis" },
  { text: "Walking on water and developing software from a specification are easy if both are frozen.", author: "Edward V. Berard" },
  { text: "It works on my machine.", author: "Every Developer Ever" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
  { text: "The best code is no code at all.", author: "Jeff Atwood" },
  { text: "Weeks of coding can save you hours of planning.", author: "Anonymous" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on('ready', async () => {
  console.log(`[Quote Machine] Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('quote')
      .setDescription('Get a random quote')
      .addStringOption((opt) =>
        opt.setName('category')
          .setDescription('Quote category (dev, life, funny)')
          .setRequired(false)
          .addChoices(
            { name: 'Developer Wisdom', value: 'dev' },
            { name: 'Life & Philosophy', value: 'life' },
            { name: 'Funny', value: 'funny' }
          )
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName('quote-list')
      .setDescription('List all available quotes')
      .toJSON(),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('[Quote Machine] Commands registered');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'quote') {
    const category = interaction.options.getString('category');
    const filtered = category ? QUOTES.filter(q => q.category === category) : QUOTES;
    const quote = filtered[Math.floor(Math.random() * filtered.length)];

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setDescription(`*"${quote.text}"*`)
      .setFooter({ text: `— ${quote.author}` });

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'quote-list') {
    const list = QUOTES.map((q, i) => `**${i + 1}.** ${q.text.slice(0, 60)}...`).join('\n');
    await interaction.reply({
      content: `📚 **${QUOTES.length} quotes available:**\n\n${list}`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);