import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

async function startServer() {
  // Ensure data directory exists
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Could not create data directory", err);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await fs.readFile(DB_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      // If file doesn't exist, return empty data
      res.json({ 
        staffList: [], 
        schoolData: null, 
        correspondenceList: [], 
        timetableActivities: [],
        attendanceList: [],
        administrativeInquiries: [],
        educationalSupportList: [],
        schoolStructures: [],
        students: []
      });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const data = req.body;
      await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
      res.json({ status: "success" });
    } catch (error) {
      console.error("Error saving data:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
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
