import * as fs from 'fs';
import * as path from 'path';
import { CaseMatch } from '../types/index';
import { matchCases } from '../adapters/knowhowAdapter';
import { listFiles } from './uploadService';

const WS_ROOT = path.resolve(process.cwd(), '../storage/workspaces');

function matchFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'case-matches.json');
}

export function getMatches(workspaceId: string): CaseMatch[] {
  const f = matchFile(workspaceId);
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as CaseMatch[];
}

export async function runMatch(
  workspaceId: string,
  industry: string,
  requirementSummary: string
): Promise<CaseMatch[]> {
  // 把已解析的客户需求文件内容纳入检索，让案例匹配更贴合客户实际需求
  const parsedText = listFiles(workspaceId)
    .filter((f) => f.status === 'parsed' && f.parsedSections?.length)
    .flatMap((f) => f.parsedSections ?? [])
    .map((s) => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
  const enrichedQuery = [requirementSummary, parsedText].filter(Boolean).join(' ').trim();
  const matches = await matchCases(industry, enrichedQuery);
  fs.mkdirSync(path.dirname(matchFile(workspaceId)), { recursive: true });
  fs.writeFileSync(matchFile(workspaceId), JSON.stringify(matches, null, 2), 'utf-8');
  return matches;
}

export function selectCases(workspaceId: string, caseIds: string[]): CaseMatch[] {
  const matches = getMatches(workspaceId);
  const updated = matches.map((m) => ({ ...m, selected: caseIds.includes(m.caseId) }));
  fs.writeFileSync(matchFile(workspaceId), JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
