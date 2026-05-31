import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { Solution, SolutionChapter, SolutionDiagram } from '../types/index';
import { getWorkspace } from './workspaceService';
import { listFiles } from './uploadService';
import { getMatches } from './caseService';
import { textCompletion } from '../adapters/llmAdapter';
import { buildSolutionPrompt } from '../utils/promptBuilder';
import { buildMockDiagrams } from '../utils/diagramBuilder';

const WS_ROOT = path.resolve(process.cwd(), '../storage/workspaces');
const DOCS_ROOT = path.resolve(process.cwd(), '../storage/generated-docs');

function solutionFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'solution.json');
}

export function getSolution(workspaceId: string): Solution | null {
  const f = solutionFile(workspaceId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as Solution;
}

export function saveSolution(solution: Solution): void {
  fs.mkdirSync(path.dirname(solutionFile(solution.workspaceId)), { recursive: true });
  fs.writeFileSync(solutionFile(solution.workspaceId), JSON.stringify(solution, null, 2), 'utf-8');
}

export async function generateSolution(workspaceId: string): Promise<Solution> {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const files = listFiles(workspaceId);
  const sections = files.flatMap((f) => f.parsedSections ?? []);
  const caseMatches = getMatches(workspaceId);
  const selectedCases = caseMatches.filter((m) => m.selected).map((m) => m.case);

  const prompt = buildSolutionPrompt(workspace, sections, selectedCases);
  const llmResult = await textCompletion(prompt);

  let chapters: SolutionChapter[] = [];
  let title = `${workspace.customerName} 帆软数字化解决方案`;
  let summary = workspace.requirementSummary;

  try {
    const parsed = JSON.parse(llmResult.content);
    title = parsed.title ?? title;
    summary = parsed.summary ?? summary;
    chapters = (parsed.chapters ?? []).map((c: SolutionChapter) => ({ ...c, id: c.id ?? uuid() }));
  } catch {
    chapters = [
      {
        id: uuid(),
        order: 1,
        heading: '方案概述',
        content: llmResult.content,
        sourceReferences: [],
      },
    ];
  }

  const diagrams: SolutionDiagram[] = buildMockDiagrams(workspace);

  const now = new Date().toISOString();
  const solution: Solution = {
    id: uuid(),
    workspaceId,
    title,
    summary,
    chapters,
    images: [],
    diagrams,
    caseReferences: selectedCases.map((c) => c.id),
    createdAt: now,
    updatedAt: now,
  };

  saveSolution(solution);

  // Save a plain text snapshot for feishu
  fs.mkdirSync(path.join(DOCS_ROOT, workspaceId), { recursive: true });
  const docSnapshot = [
    `# ${solution.title}`,
    `\n## 方案摘要\n${solution.summary}`,
    ...solution.chapters.map((c) => `\n## ${c.heading}\n${c.content}`),
  ].join('\n');
  fs.writeFileSync(
    path.join(DOCS_ROOT, workspaceId, 'solution-snapshot.md'),
    docSnapshot,
    'utf-8'
  );

  return solution;
}

export function updateSolution(workspaceId: string, data: Partial<Solution>): Solution | null {
  const existing = getSolution(workspaceId);
  if (!existing) return null;
  const updated: Solution = { ...existing, ...data, workspaceId, updatedAt: new Date().toISOString() };
  saveSolution(updated);
  return updated;
}
