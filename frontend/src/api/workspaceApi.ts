const BASE = '/api';

export interface Workspace {
  id: string;
  name: string;
  customerName: string;
  industry: string;
  background: string;
  requirementSummary: string;
  createdAt: string;
  updatedAt: string;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const res = await fetch(`${BASE}/workspaces`);
  const data = await res.json();
  return data.data ?? [];
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const res = await fetch(`${BASE}/workspaces/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data ?? null;
}

export async function createWorkspace(payload: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
  const res = await fetch(`${BASE}/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Failed to create workspace');
  return data.data;
}
