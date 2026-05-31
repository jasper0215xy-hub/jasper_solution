// ─── Workspace ───────────────────────────────────────────────────────────────

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

// ─── Upload / File ────────────────────────────────────────────────────────────

export type FileStatus = 'uploaded' | 'parsing' | 'parsed' | 'error';

export interface UploadedFile {
  id: string;
  workspaceId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: FileStatus;
  parsedSections?: ParsedSection[];
  errorMsg?: string;
}

export interface ParsedSection {
  sourceFileId: string;
  pageOrSlide: number;
  text: string;
  metadata: Record<string, unknown>;
}

// ─── Image ────────────────────────────────────────────────────────────────────

export type ImagePurpose =
  | 'solution-cover'
  | 'business-flow-bg'
  | 'product-scene'
  | 'customer-report';

export interface GeneratedImage {
  id: string;
  workspaceId: string;
  prompt: string;
  purpose: ImagePurpose;
  width: 3840;
  height: 2160;
  format: 'png';
  aspectRatio: '16:9';
  status: 'generating' | 'done' | 'error';
  localPath?: string;
  url?: string;
  createdAt: string;
}

// ─── Cases ────────────────────────────────────────────────────────────────────

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

// ─── Solution ─────────────────────────────────────────────────────────────────

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

// ─── Demo Dashboard ──────────────────────────────────────────────────────────

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

export interface DashboardLayoutItem {
  id: string;
  area: 'kpi' | 'main' | 'side';
  order: number;
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
  layout: DashboardLayoutItem[];
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

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export type AIChatMessageRole = 'user' | 'assistant';
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
  role: AIChatMessageRole;
  content: string;
  responseType?: AIChatResponseType;
  patch?: AIChatPatch;
  applied: boolean;
  createdAt: string;
}

// ─── Feishu Doc ───────────────────────────────────────────────────────────────

export interface FeishuDoc {
  workspaceId: string;
  docUrl: string;
  docToken: string;
  generatedAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
