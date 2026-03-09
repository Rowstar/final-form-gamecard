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

  // V2 Architecture: Lineage, Evolution, and Spec metadata
  try { db.exec(`ALTER TABLE cards ADD COLUMN card_spec_json TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN root_card_id TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN version_number INTEGER DEFAULT 1`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN generation_type TEXT DEFAULT 'forge'`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN prompt_base TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN prompt_modifiers TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN generation_settings TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN source_image_url TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN preserved_traits_json TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN changed_traits_json TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN variation_strength TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN consistency_mode TEXT`); } catch (e) { }

  // Phase 2: Controlled Evolution & Trust
  try { db.exec(`ALTER TABLE cards ADD COLUMN is_featured_version BOOLEAN DEFAULT 0`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN generation_delta TEXT`); } catch (e) { }

  // Phase 3: Social Mythology & Shareable Identity
  try { db.exec(`ALTER TABLE cards ADD COLUMN is_public BOOLEAN DEFAULT 0`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN rival_id TEXT`); } catch (e) { }
  try { db.exec(`ALTER TABLE cards ADD COLUMN duo_id TEXT`); } catch (e) { }
}

export default db;
