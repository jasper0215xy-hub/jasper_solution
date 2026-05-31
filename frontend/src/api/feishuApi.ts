const BASE = '/api';

export interface FeishuDoc {
  workspaceId: string;
  docUrl: string;
  docToken: string;
  generatedAt: string;
}

export async function getFeishuDoc(workspaceId: string): Promise<FeishuDoc | null> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/feishu/doc`);
  const data = await res.json();
  return data.data ?? null;
}

export async function generateFeishuDoc(workspaceId: string): Promise<FeishuDoc> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/feishu/doc`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Feishu doc generation failed');
  return data.data;
}
