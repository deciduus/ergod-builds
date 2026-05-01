# Contributing to ergod-builds

Yooo we building? Here's how to play nice.

## Adding a new build

1. Create a folder under `builds/` with a descriptive name (kebab-case)
2. Add a `README.md` with:
   - What it does
   - How to run / use it
   - Any dependencies
3. Submit a PR with a clear title and description

## Guidelines

- Keep builds self-contained (dependencies, assets, config all inside the build folder)
- Document everything — future you will thank present you
- No huge binaries or generated files in the repo (add them to `.gitignore`)
- Be creative. Be weird. Ship it.

## PR etiquette

- One build per PR
- Title: `build: <name> — <short description>`
- Description: what it does, how to test it

## Questions?

Open an issue. We'll figure it out.
