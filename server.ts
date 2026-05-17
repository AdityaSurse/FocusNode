import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

dotenv.config();

const db = new Database('pomo.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    sync_key TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const JWT_SECRET = process.env.JWT_SECRET || 'pomo-sync-secret-fixed';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req['userId'] = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Sync Logic
  app.post('/api/auth/sync', async (req, res) => {
    const { syncKey, isNew } = req.body;
    
    try {
      let user;
      if (syncKey && !isNew) {
        // Joining existing node
        user = db.prepare('SELECT * FROM users WHERE sync_key = ?').get(syncKey) as any;
        if (!user) return res.status(404).json({ error: 'Sync key not found' });
      } else {
        // Creating new node
        const id = nanoid();
        const newSyncKey = Math.floor(10000000 + Math.random() * 90000000).toString();
        db.prepare('INSERT INTO users (id, sync_key) VALUES (?, ?)').run(id, newSyncKey);
        user = { id, sync_key: newSyncKey };
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ token, user: { id: user.id, syncKey: user.sync_key } });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // Sessions API
  app.post('/api/sessions', authenticate, async (req: any, res) => {
    const { sessionType, durationMinutes } = req.body;
    const id = nanoid();
    
    try {
      db.prepare(`
        INSERT INTO sessions (id, user_id, session_type, duration_minutes)
        VALUES (?, ?, ?, ?)
      `).run(id, req.userId, sessionType, durationMinutes);
      
      res.json({ success: true, id });
    } catch (error) {
      console.error('Save session error:', error);
      res.status(500).json({ error: 'Failed to save session' });
    }
  });

  app.delete('/api/sessions', authenticate, async (req: any, res) => {
    try {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete sessions error:', error);
      res.status(500).json({ error: 'Failed to clear sessions' });
    }
  });

  app.get('/api/sessions', authenticate, async (req: any, res) => {
    try {
      const sessions = db.prepare(`
        SELECT * FROM sessions 
        WHERE user_id = ? 
        ORDER BY completed_at DESC
      `).all(req.userId);
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // AI Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/ai/insights', authenticate, async (req: any, res) => {
    try {
      const sessions = db.prepare('SELECT session_type, duration_minutes, completed_at FROM sessions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50').all(req.userId) as any[];
      
      if (!sessions || sessions.length === 0) {
        return res.json({ tip: "Initialize node connection to begin focus telemetry analysis." });
      }

      const prompt = `
        Analyze these Pomodoro focus sessions for a user: ${JSON.stringify(sessions)}.
        Provide ONE short, punchy productivity pro-tip (max 20 words) based on their trends.
        Style: Matrix/Cyberpunk themed (use terms like 'node', 'uplink', 'telemetry', 'neural').
        Return ONLY the raw tip string, no JSON markers.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ tip: result.text?.trim() || "Neural patterns stabilized. Maintain focus sequence." });
    } catch (error) {
      console.error('Insights error:', error);
      res.json({ tip: "Network interference detected. Focus on maintaining current telemetry." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
