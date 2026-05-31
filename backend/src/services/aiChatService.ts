import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { AIChatMessage, AIChatPatch, AIChatResponseType } from '../types/index';
import { chatCompletion } from '../adapters/llmAdapter';
import { getSolution, updateSolution } from './solutionService';
import { getWorkspace, updateWorkspace } from './workspaceService';
import { buildDashboardPromptSuggestion, saveDashboardPromptDraft } from './dashboardService';
import { listFiles } from './uploadService';

const WS_ROOT = path.resolve(process.cwd(), '../storage/workspaces');

function chatFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'ai-chat-history.json');
}

export function getMessages(workspaceId: string): AIChatMessage[] {
  const f = chatFile(workspaceId);
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as AIChatMessage[];
}

function saveMessages(workspaceId: string, messages: AIChatMessage[]): void {
  fs.mkdirSync(path.dirname(chatFile(workspaceId)), { recursive: true });
  fs.writeFileSync(chatFile(workspaceId), JSON.stringify(messages, null, 2), 'utf-8');
}

function isDashboardIntent(content: string): boolean {
  const normalized = content.toLowerCase();
  return (
    (normalized.includes('驾驶舱') || normalized.includes('demo') || normalized.includes('看板')) &&
    (normalized.includes('生成') || normalized.includes('确认') || normalized.includes('内容') || normalized.includes('提示词') || normalized.includes('调整') || normalized.includes('修改'))
  );
}

export async function sendMessage(
  workspaceId: string,
  userContent: string
): Promise<AIChatMessage> {
  const history = getMessages(workspaceId);

  // Save user message
  const userMsg: AIChatMessage = {
    id: uuid(),
    workspaceId,
    role: 'user',
    content: userContent,
    applied: false,
    createdAt: new Date().toISOString(),
  };
  history.push(userMsg);

  // Build context — 让对话模型“记住”已解析的客户需求文件内容
  const workspace = getWorkspace(workspaceId);
  const solution = getSolution(workspaceId);

  const parsedFiles = listFiles(workspaceId).filter(
    (f) => f.status === 'parsed' && f.parsedSections?.length
  );
  const fileContext = parsedFiles.length
    ? [
        '已解析的客户需求文件内容（可据此调整 Demo驾驶舱提示词、生成方案等）：',
        ...parsedFiles.map(
          (f) =>
            `《${f.originalName}》\n${(f.parsedSections ?? [])
              .map((s) => s.text)
              .join('\n')
              .slice(0, 1500)}`
        ),
      ].join('\n\n')
    : '';

  const context = [
    workspace ? `项目：${workspace.name}，客户：${workspace.customerName}，行业：${workspace.industry}` : '',
    solution ? `当前方案标题：${solution.title}，摘要：${solution.summary.slice(0, 100)}` : '',
    fileContext,
  ]
    .filter(Boolean)
    .join('\n\n');

  const llmMessages = history.slice(-10).map((m) => ({ role: m.role, content: m.content }));
  let llmResult: Awaited<ReturnType<typeof chatCompletion>>;
  if (isDashboardIntent(userContent)) {
    try {
      const suggestion = buildDashboardPromptSuggestion(workspaceId, userContent);
      llmResult = {
        content: JSON.stringify({
          type: 'suggestion',
          explanation: [
            '我已根据已解析的客户需求文件整理出 Demo驾驶舱生成内容。',
            '请确认下方建议；确认后点击“应用修改”，系统会把提示词自动传输到 Demo驾驶舱页面。',
            '',
            suggestion.summary,
          ].join('\n'),
          patch: {
            target: 'dashboard',
            field: 'imagePrompt',
            value: {
              imagePrompt: suggestion.imagePrompt,
              sourceFileIds: suggestion.sourceFileIds,
              title: suggestion.title,
              summary: suggestion.summary,
            },
            description: '确认 Demo驾驶舱生成内容并保存生图提示词',
          },
        }),
      };
    } catch (err) {
      llmResult = {
        content: JSON.stringify({
          type: 'explanation',
          explanation: err instanceof Error ? err.message : String(err),
        }),
      };
    }
  } else {
    llmResult = await chatCompletion(llmMessages, context);
  }

  // Parse AI response
  let responseType: AIChatResponseType = 'explanation';
  let displayContent = llmResult.content;
  let patch: AIChatPatch | undefined;

  try {
    const parsed = JSON.parse(llmResult.content);
    if (parsed.type === 'suggestion' && parsed.patch) {
      responseType = 'suggestion';
      displayContent = parsed.explanation ?? '我有一个修改建议，请查看下方预览后确认是否应用。';
      patch = parsed.patch as AIChatPatch;
    } else if (parsed.type === 'explanation') {
      responseType = 'explanation';
      displayContent = parsed.explanation ?? displayContent;
    }
  } catch {
    // Not JSON — treat as plain explanation
  }

  const assistantMsg: AIChatMessage = {
    id: uuid(),
    workspaceId,
    role: 'assistant',
    content: displayContent,
    responseType,
    patch,
    applied: false,
    createdAt: new Date().toISOString(),
  };
  history.push(assistantMsg);
  saveMessages(workspaceId, history);

  return assistantMsg;
}

export function applyPatch(workspaceId: string, messageId: string): boolean {
  const history = getMessages(workspaceId);
  const idx = history.findIndex((m) => m.id === messageId);
  if (idx < 0) return false;

  const msg = history[idx];
  if (!msg.patch || msg.applied) return false;

  const { target, field, value } = msg.patch;

  if (target === 'solution') {
    const solution = getSolution(workspaceId);
    if (!solution) return false;
    const patch: Record<string, unknown> = { [field]: value };
    updateSolution(workspaceId, patch);
  } else if (target === 'workspace') {
    const workspace = getWorkspace(workspaceId);
    if (!workspace) return false;
    const patch: Record<string, unknown> = { [field]: value };
    updateWorkspace(workspaceId, patch as Parameters<typeof updateWorkspace>[1]);
  } else if (target === 'diagram' && field === 'mermaidCode') {
    const solution = getSolution(workspaceId);
    if (!solution) return false;
    const diagrams = solution.diagrams.map((d, i) =>
      i === 0 ? { ...d, mermaidCode: value as string } : d
    );
    updateSolution(workspaceId, { diagrams });
  } else if (target === 'dashboard' && field === 'imagePrompt') {
    const payload = value as {
      imagePrompt?: string;
      sourceFileIds?: string[];
      title?: string;
      summary?: string;
    };
    if (!payload.imagePrompt) return false;
    saveDashboardPromptDraft(
      workspaceId,
      payload.imagePrompt,
      payload.sourceFileIds ?? [],
      payload.title ?? 'Demo驾驶舱',
      payload.summary ?? ''
    );
  }

  history[idx] = { ...msg, applied: true };
  saveMessages(workspaceId, history);
  return true;
}
