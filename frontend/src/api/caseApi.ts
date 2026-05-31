const BASE = '/api';

export interface KnowHowCase {
  id: string;
  title: string;
  industry: string;
  scenario: string;
  summary: string;
  reusableContent: string[];
  tags: string[];
  sourceUrl?: string;
}

export interface CaseMatch {
  caseId: string;
  case: KnowHowCase;
  score: number;
  reason: string;
  selected: boolean;
}

export async function getMatches(workspaceId: string): Promise<CaseMatch[]> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/cases/matches`);
  const data = await res.json();
  return data.data ?? [];
}

export async function runMatch(workspaceId: string): Promise<CaseMatch[]> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/cases/match`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Match failed');
  return data.data;
}

export async function selectCases(workspaceId: string, caseIds: string[]): Promise<CaseMatch[]> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/cases/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseIds }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Select failed');
  return data.data;
}
