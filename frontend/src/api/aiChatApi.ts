const BASE = '/api';

export type AIChatResponseType = 'explanation' | 'suggestion' | 'patch';

export interface AIChatPatch {
  target: string;
  field: string;
  value: unknown;
  description: string;
}

export interface AIChatMessage {
  id: string;
  workspaceId: string;
  role: 'user' | 'assistant';
  content: string;
  responseType?: AIChatResponseType;
  patch?: AIChatPatch;
  applied: boolean;
  createdAt: string;
}

export async function getMessages(workspaceId: string): Promise<AIChatMessage[]> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/ai-chat/messages`);
  const data = await res.json();
  return data.data ?? [];
}

export async function sendMessage(workspaceId: string, content: string): Promise<AIChatMessage> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/ai-chat/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Send failed');
  return data.data;
}

export async function applyPatch(workspaceId: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/ai-chat/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Apply failed');
}
