import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { setupDb } from "./server/db.js";
import authRoutes from "./server/routes/auth.js";
import cardRoutes from "./server/routes/cards.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3002", 10);

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve uploads
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // Setup Database
  setupDb();

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/cards", cardRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Global API error handler
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`API Error on ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
