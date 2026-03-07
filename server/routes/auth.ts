import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

router.post("/register", async (req, res) => {
  let { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  email = email.toLowerCase();

  try {
    const existingUser = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, email, hashedPassword);
    
    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
    
    res.json({ token, user: { id, email, credits: 3 } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  email = email.toLowerCase();

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email) as any;
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    
    res.json({ token, user: { id: user.id, email: user.email, credits: user.credits } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare("SELECT id, email, credits FROM users WHERE id = ?").get(decoded.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const freeGenerationsCount = db.prepare(`
      SELECT COUNT(*) as count FROM cards 
      WHERE user_id = ? AND date(created_at) = date('now') AND is_premium = 0
    `).get(decoded.id) as any;

    const freeGenerationsLeft = Math.max(0, 2 - (freeGenerationsCount?.count || 0));

    res.json({ user: { ...user, freeGenerationsLeft } });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/add-credits", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add 5 credits
    db.prepare("UPDATE users SET credits = credits + 5 WHERE id = ?").run(decoded.id);
    
    const user = db.prepare("SELECT id, email, credits FROM users WHERE id = ?").get(decoded.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
