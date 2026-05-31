const BASE = '/api';

export interface ConfigItem {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
}

export interface ConfigGroup {
  id: 'chat' | 'image' | 'knowhow';
  title: string;
  mode: 'mock' | 'ready';
  items: ConfigItem[];
}

export interface ConfigStatus {
  groups: ConfigGroup[];
  envFile: string;
  note: string;
}

export async function getConfigStatus(): Promise<ConfigStatus> {
  const res = await fetch(`${BASE}/config/status`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Load config status failed');
  return data.data;
}
