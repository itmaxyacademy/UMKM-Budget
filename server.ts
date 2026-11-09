import fs from "fs";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3040;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get(["/health", "/api/health"], (req, res) => {
  res.json({ status: "ok", app: "UMKM Budget by Maxy Academy", timestamp: new Date().toISOString() });
});

// Serve static files from public directory
const publicPath = path.join(process.cwd(), "public");
if (fs.existsSync(publicPath)) {
  const staticPublicOptions = {
    setHeaders: (res: any, filePath: string) => {
      if (filePath.endsWith("sw.js")) {
        res.setHeader("Service-Worker-Allowed", "/");
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith("manifest.json")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
    }
  };

  app.use(express.static(publicPath, staticPublicOptions));
  app.use("/umkm-budget", express.static(publicPath, staticPublicOptions));
  app.use("/UMKM-Budget", express.static(publicPath, staticPublicOptions));
}

// Serve Frontend using Vite Middleware in Development or Compiled dist in Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static dist bundle on root and common subpaths
    app.use(express.static(distPath));
    app.use("/umkm-budget", express.static(distPath));
    app.use("/UMKM-Budget", express.static(distPath));

    const basePath = process.env.BASE_PATH || process.env.VITE_BASE_PATH;
    if (basePath && basePath !== "/" && basePath !== "/umkm-budget" && basePath !== "/UMKM-Budget") {
      app.use(basePath, express.static(distPath));
    }

    // SPA fallback: return index.html for any GET request that did not match static files
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UMKM Budget server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
