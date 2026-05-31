import { execFile } from 'child_process';
import { promisify } from 'util';
import { Solution, Workspace } from '../types/index';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

export interface FeishuDocResult {
  docUrl: string;
  docToken: string;
}

// ─── Mock Feishu CLI Adapter ──────────────────────────────────────────────────

async function mockCreateDoc(
  _workspace: Workspace,
  _solution: Solution
): Promise<FeishuDocResult> {
  logger.info('[feishuCliAdapter] creating doc (mock)');
  await new Promise((r) => setTimeout(r, 600));

  const mockToken = `mock_${Date.now().toString(36)}`;
  return {
    docToken: mockToken,
    docUrl: `https://feishu.example.com/docx/${mockToken}`,
  };
}

// ─── 方案 → 飞书文档 XML ───────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraphs(text: string): string {
  return (text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeXml(line)}</p>`)
    .join('');
}

function solutionToXml(workspace: Workspace, solution: Solution): string {
  const parts: string[] = [];
  parts.push(`<title>${escapeXml(solution.title || `${workspace.customerName} 帆软数字化解决方案`)}</title>`);
  if (solution.summary) {
    parts.push('<h2>方案摘要</h2>');
    parts.push(paragraphs(solution.summary));
  }
  for (const chapter of [...solution.chapters].sort((a, b) => a.order - b.order)) {
    parts.push(`<h2>${escapeXml(chapter.heading)}</h2>`);
    parts.push(paragraphs(chapter.content));
  }
  return parts.join('');
}

// ─── Real Feishu CLI Adapter（通过 lark-cli 创建飞书文档）─────────────────────

async function realCreateDoc(
  workspace: Workspace,
  solution: Solution
): Promise<FeishuDocResult> {
  const content = solutionToXml(workspace, solution);
  logger.info('[feishuCliAdapter] creating doc via lark-cli', { title: solution.title });

  const { stdout } = await execFileAsync(
    'lark-cli',
    ['docs', '+create', '--api-version', 'v2', '--content', content],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  let parsed: { ok?: boolean; data?: { document?: { url?: string; document_id?: string } }; error?: unknown };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`lark-cli 输出无法解析: ${stdout.slice(0, 200)}`);
  }

  const url = parsed.data?.document?.url;
  const token = parsed.data?.document?.document_id;
  if (!url || !token) {
    throw new Error(`lark-cli 创建文档失败: ${JSON.stringify(parsed).slice(0, 300)}`);
  }

  logger.info('[feishuCliAdapter] feishu doc created', { token });
  return { docUrl: url, docToken: token };
}

// ─── Public API ───────────────────────────────────────────────────────────────
// 默认走真实 lark-cli；设置 FEISHU_USE_REAL=false 可强制使用 mock。
// 真实调用失败（未安装 lark-cli / 未登录等）时自动回退 mock，保证流程不中断。

export async function createFeishuDoc(
  workspace: Workspace,
  solution: Solution
): Promise<FeishuDocResult> {
  if (process.env.FEISHU_USE_REAL === 'false') {
    return mockCreateDoc(workspace, solution);
  }
  try {
    return await realCreateDoc(workspace, solution);
  } catch (err) {
    logger.info('[feishuCliAdapter] real create failed, fallback to mock', {
      error: err instanceof Error ? err.message : String(err),
    });
    return mockCreateDoc(workspace, solution);
  }
}
