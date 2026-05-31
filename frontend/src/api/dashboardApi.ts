const BASE = '/api';

export type DashboardChartType = 'bar' | 'line' | 'donut' | 'table';
export type DashboardStatus = 'good' | 'warning' | 'danger';

export interface DashboardFilter {
  id: string;
  label: string;
  value: string;
  options: string[];
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: string;
  status: DashboardStatus;
  rationale: string;
}

export interface DashboardChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface DashboardChart {
  id: string;
  type: DashboardChartType;
  title: string;
  description: string;
  unit: string;
  data: DashboardChartPoint[];
  columns?: string[];
  rows?: string[][];
}

export interface DashboardAlert {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  owner: string;
}

export interface DashboardInsight {
  id: string;
  title: string;
  content: string;
}

export interface DemoDashboard {
  id: string;
  workspaceId: string;
  title: string;
  subtitle: string;
  sourceFileIds: string[];
  industry: string;
  audience: string;
  imagePrompt: string;
  generatedImage?: {
    localPath: string;
    url: string;
    width: 3840;
    height: 2160;
    format: 'png';
    aspectRatio: '16:9';
  };
  imageHistory?: Array<{ url: string; createdAt: string }>;
  filters: DashboardFilter[];
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  alerts: DashboardAlert[];
  insights: DashboardInsight[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPromptDraft {
  workspaceId: string;
  imagePrompt: string;
  sourceFileIds: string[];
  title: string;
  summary: string;
  confirmedAt: string;
  updatedAt: string;
}

export async function getDashboard(workspaceId: string): Promise<DemoDashboard | null> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/dashboard`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Load dashboard failed');
  return data.data ?? null;
}

export async function getDashboardPromptDraft(workspaceId: string): Promise<DashboardPromptDraft | null> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/dashboard/prompt`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Load dashboard prompt failed');
  return data.data ?? null;
}

export async function generateDashboard(workspaceId: string): Promise<DemoDashboard> {
  const res = await fetch(`${BASE}/workspaces/${workspaceId}/dashboard/generate`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Generate dashboard failed');
  return data.data;
}
