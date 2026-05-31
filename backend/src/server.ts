import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env files from project root (backend runs from backend/ dir)
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.ai') });

import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import { logger } from './utils/logger';
import workspaceRouter from './routes/workspace';
import uploadRouter from './routes/upload';
import casesRouter from './routes/cases';
import solutionRouter from './routes/solution';
import feishuRouter from './routes/feishu';
import aiChatRouter from './routes/aiChat';
import dashboardRouter from './routes/dashboard';
import configRouter from './routes/config';

const app = express();
const PORT = Number(process.env.PORT ?? 3002);
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve generated images as static files
const GENERATED_IMAGES = path.resolve(process.cwd(), '../storage/generated-images');
fs.mkdirSync(GENERATED_IMAGES, { recursive: true });
app.use('/api/static/generated-images', express.static(GENERATED_IMAGES));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/workspaces', workspaceRouter);
app.use('/api/workspaces/:workspaceId/uploads', uploadRouter);
app.use('/api/workspaces/:workspaceId/cases', casesRouter);
app.use('/api/workspaces/:workspaceId/dashboard', dashboardRouter);
app.use('/api/workspaces/:workspaceId/solution', solutionRouter);
app.use('/api/workspaces/:workspaceId/feishu', feishuRouter);
app.use('/api/workspaces/:workspaceId/ai-chat', aiChatRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`);
  logger.info(`CORS allowed origin: ${FRONTEND_URL}`);
});

export default app;
