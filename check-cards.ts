import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "data", "app.db");

const db = new Database(dbPath);
const user = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get("rowstar23@gmail.com");
console.log("User:", user);

if (user) {
  const cards = db.prepare("SELECT * FROM cards WHERE user_id = ?").all(user.id);
  console.log("Cards count:", cards.length);
  for (const card of cards) {
    try {
      JSON.parse(card.stats);
    } catch (e) {
      console.error("Failed to parse stats for card", card.id, card.stats);
    }
  }
}
