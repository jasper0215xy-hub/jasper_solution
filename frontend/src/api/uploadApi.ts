const BASE = '/api';

export interface ParsedSection {
  sourceFileId: string;
  pageOrSlide: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface UploadedFile {
  id: string;
  workspaceId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: 'uploaded' | 'parsing' | 'parsed' | 'error';
  parsedSections?: ParsedSection[];
  errorMsg?: string;
}

export async function listFiles(workspaceId: string): Promise<UploadedFile[]> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/uploads`);
  const data = await res.json();
  return data.data ?? [];
}

export async function uploadFile(workspaceId: string, file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/uploads`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Upload failed');
  return data.data;
}

export async function parseFile(workspaceId: string, fileId: string): Promise<UploadedFile> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/uploads/${fileId}/parse`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Parse failed');
  return data.data;
}
