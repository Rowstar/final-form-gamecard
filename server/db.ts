import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "app.db");
const db = new Database(dbPath);

export function setupDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      credits INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      image_url TEXT,
      identity TEXT,
      strengths TEXT,
      signature_move TEXT,
      weakness TEXT,
      stats TEXT,
      is_premium BOOLEAN DEFAULT 0,
      tier TEXT DEFAULT 'epic',
      legendary_upgraded_at DATETIME,
      legendary_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT,
      delta_credits INTEGER,
      card_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (card_id) REFERENCES cards (id)
    );
  `);

  try {
    db.prepare("UPDATE users SET credits = 100").run();
    console.log("Updated all users to 100 credits for testing.");
  } catch (e) {
    console.error("Failed to update credits on startup", e);
  }

  // Add columns to existing cards table if they don't exist
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN tier TEXT DEFAULT 'epic'`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN legendary_upgraded_at DATETIME`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN legendary_data TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN editable_unlocked BOOLEAN DEFAULT 0`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN custom_text_overrides TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN video_url TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN mythic_status TEXT DEFAULT 'none'`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN border_id TEXT DEFAULT 'gilded_relic'`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN border_lock_mode TEXT DEFAULT 'ai'`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN short_id TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN verification_hash TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN animal_base TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN theme TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN energy_core TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN archetype TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN palette TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN pose_variant TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN composition TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN ultimate_title TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN dna_hash TEXT`);
  } catch (e) { }

  // Remix system columns
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN parent_id TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN is_remix BOOLEAN DEFAULT 0`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN remix_mode TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN remix_instructions TEXT`);
  } catch (e) { }
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN remix_chip_selections TEXT`);
  } catch (e) { }
}

export default db;
