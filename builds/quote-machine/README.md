# Quote Machine

> A Discord slash command that drops random quotes on demand.

## Commands

| Command | Description |
|---------|-------------|
| `/quote` | Get a random quote |
| `/quote category dev\|life\|funny` | Filter by category |
| `/quote-list` | See all available quotes |

## Setup

```bash
cd builds/quote-machine
npm install
export DISCORD_TOKEN=your_token
npm start
```

## Adding quotes

Edit `src/index.js` and add objects to the `QUOTES` array:

```js
{ text: "Your quote here", author: "Author Name", category: "dev" }
```

Categories: `dev`, `life`, `funny`