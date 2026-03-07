import db from "./server/db.js";

const cards = db.prepare("SELECT id, video_url FROM cards WHERE video_url LIKE '/api/uploads/%'").all();
for (const card of cards) {
  const newUrl = card.video_url.replace('/api/uploads/', '/uploads/');
  db.prepare("UPDATE cards SET video_url = ? WHERE id = ?").run(newUrl, card.id);
  console.log(`Updated card ${card.id} video_url to ${newUrl}`);
}
