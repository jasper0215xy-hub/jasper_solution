import * as fs from 'fs';
import * as path from 'path';
import { FeishuDoc } from '../types/index';
import { getSolution } from './solutionService';
import { getWorkspace } from './workspaceService';
import { createFeishuDoc } from '../adapters/feishuCliAdapter';

const WS_ROOT = path.resolve(process.cwd(), '../storage/workspaces');

function feishuFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'feishu-doc.json');
}

export function getFeishuDoc(workspaceId: string): FeishuDoc | null {
  const f = feishuFile(workspaceId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as FeishuDoc;
}

export async function generateFeishuDoc(workspaceId: string): Promise<FeishuDoc> {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const solution = getSolution(workspaceId);
  if (!solution) throw new Error('Solution not found. Please generate solution first.');

  const result = await createFeishuDoc(workspace, solution);

  const doc: FeishuDoc = {
    workspaceId,
    docUrl: result.docUrl,
    docToken: result.docToken,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(feishuFile(workspaceId), JSON.stringify(doc, null, 2), 'utf-8');
  return doc;
}
