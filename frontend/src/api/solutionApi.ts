const BASE = '/api';

export interface SolutionChapter {
  id: string;
  order: number;
  heading: string;
  content: string;
  sourceReferences: string[];
}

export interface SolutionDiagram {
  id: string;
  type: 'business-flow' | 'tech-architecture' | 'data-flow' | 'system-integration';
  title: string;
  mermaidCode: string;
  description: string;
}

export interface Solution {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  chapters: SolutionChapter[];
  images: string[];
  diagrams: SolutionDiagram[];
  caseReferences: string[];
  feishuDocUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getSolution(workspaceId: string): Promise<Solution | null> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/solution`);
  const data = await res.json();
  return data.data ?? null;
}

export async function generateSolution(workspaceId: string): Promise<Solution> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/solution/generate`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Generation failed');
  return data.data;
}

export async function updateSolution(workspaceId: string, payload: Partial<Solution>): Promise<Solution> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/solution`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Update failed');
  return data.data;
}
