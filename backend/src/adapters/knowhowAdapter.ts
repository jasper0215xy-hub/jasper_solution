import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { KnowHowCase, CaseMatch } from '../types/index';
import { logger } from '../utils/logger';

const CASES_CACHE_DIR = path.resolve(process.cwd(), '../storage/cases-cache');
const MOCK_CASES_FILE = path.join(CASES_CACHE_DIR, 'mock-cases.json');

// ─── API Key 解析（三级回退）──────────────────────────────────────────────────
// 1) .env.ai 的 KNOWHOW_API_KEY  2) 环境变量 FANRUAN_KNOWHOW_API_KEY
// 3) 直接读取 codex skill 的密钥文件 ~/.codex/secrets/fanruan_knowhow.env
function resolveKnowhowKey(): string {
  const fromEnv = (process.env.KNOWHOW_API_KEY || process.env.FANRUAN_KNOWHOW_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const secretFile = path.join(os.homedir(), '.codex', 'secrets', 'fanruan_knowhow.env');
    if (fs.existsSync(secretFile)) {
      for (const line of fs.readFileSync(secretFile, 'utf-8').split(/\r?\n/)) {
        const m = line.match(/^\s*FANRUAN_KNOWHOW_API_KEY\s*=\s*(.+?)\s*$/);
        if (m) return m[1].trim();
      }
    }
  } catch {
    // ignore secret file read errors
  }
  return '';
}

function knowhowBaseUrl(): string {
  return (process.env.KNOWHOW_API_BASE_URL || 'https://digitchat.fanruan.com/dataset').replace(/\/+$/, '');
}

// ─── Mock case library（无 key 或调用失败时回退）──────────────────────────────

function loadCases(): KnowHowCase[] {
  if (fs.existsSync(MOCK_CASES_FILE)) {
    const raw = fs.readFileSync(MOCK_CASES_FILE, 'utf-8');
    return JSON.parse(raw) as KnowHowCase[];
  }
  return [];
}

function scoreCaseAgainstQuery(
  kcase: KnowHowCase,
  industry: string,
  keywords: string[]
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (kcase.industry === industry) {
    score += 40;
    reasons.push(`行业完全匹配（${industry}）`);
  } else if (kcase.industry === '通用' || industry === '通用') {
    score += 15;
    reasons.push('通用行业适配');
  }

  let kwMatches = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const target = `${kcase.title} ${kcase.scenario} ${kcase.summary} ${kcase.tags.join(' ')}`.toLowerCase();
    if (target.includes(kw.toLowerCase())) {
      kwMatches++;
    }
  }
  score += Math.min(kwMatches * 10, 50);
  if (kwMatches > 0) reasons.push(`关键词命中 ${kwMatches} 个`);

  return { score: Math.min(score, 95), reason: reasons.join('；') || '基础行业参考' };
}

function mockMatchCases(industry: string, requirementSummary: string, topN: number): CaseMatch[] {
  logger.info('[knowhowAdapter] matching cases (mock)', { industry });
  const cases = loadCases();
  const keywords = requirementSummary
    .split(/[，。、\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  return cases
    .map((c) => {
      const { score, reason } = scoreCaseAgainstQuery(c, industry, keywords);
      return { caseId: c.id, case: c, score, reason, selected: false } as CaseMatch;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// ─── 真实接入：帆软 KnowHow 平台 /api/v1/retrieve ─────────────────────────────

interface KnowhowChunk {
  doc_id: string;
  chunk_id?: string;
  title?: string;
  content?: string;
  summary?: string;
  score?: number;
  metadata?: {
    author?: string;
    customer?: string;
    quality?: string;
    tags?: string[];
    industry?: string[];
    products?: string[];
    link?: string;
    node_path?: string[];
  };
}

function cleanText(s: string): string {
  return (s || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // markdown 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, '') // markdown 链接
    .replace(/[#*`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(t: string): string {
  return (t || '案例').replace(/\.(pptx?|docx?|xlsx?|pdf)$/i, '').trim();
}

function toCaseMatch(c: KnowhowChunk, industryArg: string): CaseMatch {
  const md = c.metadata ?? {};
  const industries = (md.industry ?? []).filter(Boolean);
  const products = (md.products ?? []).filter(Boolean);
  const tags = (md.tags ?? []).filter(Boolean);
  const score = Math.round((c.score ?? 0) * 100);
  const reusable = Array.from(new Set([...products, ...tags])).slice(0, 6);

  const reasons: string[] = [];
  if (industries.length) reasons.push(`行业：${industries.join('/')}`);
  if (md.customer) reasons.push(`客户：${md.customer}`);
  if (md.quality) reasons.push(`质量：${md.quality}`);
  reasons.push(`语义相关度 ${score}`);

  const kcase: KnowHowCase = {
    id: c.doc_id,
    title: cleanTitle(c.title ?? ''),
    industry: industries.join('/') || industryArg || '通用',
    scenario: tags[0] || (md.node_path ?? []).slice(-1)[0] || '行业方案',
    summary: cleanText(c.summary || c.content || '').slice(0, 220),
    reusableContent: reusable,
    tags: tags.slice(0, 8),
    sourceUrl: md.link,
  };
  return { caseId: c.doc_id, case: kcase, score, reason: reasons.join('；'), selected: false };
}

async function realMatchCases(
  industry: string,
  requirementSummary: string,
  topN: number,
  apiKey: string
): Promise<CaseMatch[]> {
  const baseUrl = knowhowBaseUrl();
  // 行业用语义而非元数据过滤（知识库 industry 取值是“大制造/大金融”这类标准词，直接过滤易 0 结果）
  const query =
    [industry, requirementSummary]
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .join(' ')
      .slice(0, 500) || '帆软数字化经营分析 BI 驾驶舱 成功案例';

  const body = {
    query,
    retrieval_model: {
      business_domain: 'project',
      datasets: 'both',
      rerank_enable: true,
      top_k: Math.min(Math.max(topN * 4, 20), 100),
    },
  };

  logger.info('[knowhowAdapter] retrieve from KnowHow platform', { query: query.slice(0, 60) });
  const resp = await fetch(`${baseUrl}/api/v1/retrieve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`KnowHow retrieve failed: ${resp.status} ${text.slice(0, 200)}`);
  }

  const data = (await resp.json()) as { chunks?: KnowhowChunk[] };
  const chunks = data.chunks ?? [];

  // 同一文档有多个 chunk，按 doc_id 聚合，保留最高分 chunk
  const byDoc = new Map<string, KnowhowChunk>();
  for (const c of chunks) {
    if (!c.doc_id) continue;
    const prev = byDoc.get(c.doc_id);
    if (!prev || (c.score ?? 0) > (prev.score ?? 0)) byDoc.set(c.doc_id, c);
  }

  return [...byDoc.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topN)
    .map((c) => toCaseMatch(c, industry));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function matchCases(
  industry: string,
  requirementSummary: string,
  topN = 5
): Promise<CaseMatch[]> {
  const apiKey = resolveKnowhowKey();
  if (!apiKey) {
    logger.info('[knowhowAdapter] no KnowHow API key, using mock cases');
    return mockMatchCases(industry, requirementSummary, topN);
  }
  try {
    const real = await realMatchCases(industry, requirementSummary, topN, apiKey);
    if (real.length) return real;
    logger.info('[knowhowAdapter] real match returned empty, fallback to mock');
    return mockMatchCases(industry, requirementSummary, topN);
  } catch (err) {
    logger.info('[knowhowAdapter] real match failed, fallback to mock', {
      error: err instanceof Error ? err.message : String(err),
    });
    return mockMatchCases(industry, requirementSummary, topN);
  }
}
