import express from "express";
import jwt from "jsonwebtoken";
import db from "./server/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

const user = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get("rowstar23@gmail.com");
const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

console.log("Token:", token);

const cards = db.prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
const parsedCards = cards.map((card: any) => {
  card.stats = JSON.parse(card.stats);
  if (card.legendary_data) {
    try {
      card.legendary_data = JSON.parse(card.legendary_data);
    } catch (e) {}
  }
  if (card.custom_text_overrides) {
    try {
      card.custom_text_overrides = JSON.parse(card.custom_text_overrides);
    } catch (e) {}
  }
  return card;
});

console.log("Parsed cards:", parsedCards.length);
