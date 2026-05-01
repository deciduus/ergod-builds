# Story Chain

> Collaborative storytelling for Discord — one sentence at a time.

## What it does

Start a story, drop sentences, and build something weird and wonderful with your Discord crew. Story Chain manages the turns, threads, and saves the final tale for posterity.

## Setup

### Prerequisites

- Node.js 18+
- A Discord bot token
- A Discord server where you can add the bot

### Install

```bash
cd builds/story-chain
npm install
```

### Configure

Create a `.env` file:

```
DISCORD_TOKEN=your_bot_token_here
```

Or set the env var directly:

```bash
export DISCORD_TOKEN=your_bot_token_here
```

### Run

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `/story new <title> [turns] [genre]` | Start a new story (default: 20 turns) |
| `/story end` | End the active story and post the final tale |
| `/story status` | Check progress on the current story |
| `/story list` | Browse recent stories |
| `/story read <id>` | Read a past story by ID |

## How it works

1. Someone runs `/story new My Epic Tale --turns 25 --genre horror`
2. Bot creates a thread and saves the story to the database
3. Everyone in the thread drops one sentence at a time
4. Bot tracks turns and prevents same user from going twice in a row
5. When turns run out, use `/story end` to wrap it up
6. Final story gets posted in the channel as a nice embed

## Genre tags

Available genres: `horror`, `comedy`, `sci-fi`, `romance`, `mystery`

## Database

Stories are stored in a SQLite database at `data/stories.db`. Schema:

- `stories` — metadata, status, settings
- `story_turns` — each line contributed, with author and timestamp

## Requirements

- Node.js 18+
- Discord.js v14
- better-sqlite3
- A Discord bot with `application.commands` and `guild.messages` permissions