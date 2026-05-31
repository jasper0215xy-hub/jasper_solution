import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { Workspace } from '../types/index';

const STORAGE_ROOT = path.resolve(process.cwd(), '../storage/workspaces');

function wsDir(id: string): string {
  return path.join(STORAGE_ROOT, id);
}

function wsFile(id: string): string {
  return path.join(wsDir(id), 'workspace.json');
}

function ensureDir(id: string): void {
  fs.mkdirSync(wsDir(id), { recursive: true });
}

export function listWorkspaces(): Workspace[] {
  if (!fs.existsSync(STORAGE_ROOT)) return [];
  return fs
    .readdirSync(STORAGE_ROOT)
    .map((id) => {
      const file = wsFile(id);
      if (!fs.existsSync(file)) return null;
      return JSON.parse(fs.readFileSync(file, 'utf-8')) as Workspace;
    })
    .filter(Boolean) as Workspace[];
}

export function getWorkspace(id: string): Workspace | null {
  const file = wsFile(id);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Workspace;
}

export function createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Workspace {
  const id = uuid();
  const now = new Date().toISOString();
  const ws: Workspace = { ...data, id, createdAt: now, updatedAt: now };
  ensureDir(id);
  fs.writeFileSync(wsFile(id), JSON.stringify(ws, null, 2), 'utf-8');
  return ws;
}

export function updateWorkspace(id: string, data: Partial<Workspace>): Workspace | null {
  const existing = getWorkspace(id);
  if (!existing) return null;
  const updated: Workspace = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  fs.writeFileSync(wsFile(id), JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
