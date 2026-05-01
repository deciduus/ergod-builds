import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/stories.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export async function initializeDatabase() {
  const database = getDb();
  
  database.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      thread_id TEXT,
      author_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      max_turns INTEGER DEFAULT 20,
      current_turn INTEGER DEFAULT 0,
      genre TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS story_turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      sentence TEXT NOT NULL,
      turn_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_turns_story ON story_turns(story_id);
    CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
  `);
  
  console.log('[Story Chain] Database initialized');
}