import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { UploadedFile, ParsedSection } from '../types/index';
import { categoryOf, FileCategory } from '../utils/fileType';
import { parseDocumentWithLLM } from '../adapters/llmAdapter';
import { logger } from '../utils/logger';

const STORAGE_ROOT = path.resolve(process.cwd(), '../storage/uploads');

function uploadDir(workspaceId: string): string {
  return path.join(STORAGE_ROOT, workspaceId);
}

function metaFile(workspaceId: string): string {
  return path.join(uploadDir(workspaceId), 'files.json');
}

function loadMeta(workspaceId: string): UploadedFile[] {
  const file = metaFile(workspaceId);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as UploadedFile[];
}

function saveMeta(workspaceId: string, files: UploadedFile[]): void {
  fs.mkdirSync(uploadDir(workspaceId), { recursive: true });
  fs.writeFileSync(metaFile(workspaceId), JSON.stringify(files, null, 2), 'utf-8');
}

export function listFiles(workspaceId: string): UploadedFile[] {
  return loadMeta(workspaceId);
}

export function addFile(
  workspaceId: string,
  originalName: string,
  mimeType: string,
  size: number,
  diskPath: string
): UploadedFile {
  const files = loadMeta(workspaceId);
  const fileRecord: UploadedFile = {
    id: uuid(),
    workspaceId,
    originalName,
    mimeType,
    size,
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
  };
  files.push(fileRecord);
  saveMeta(workspaceId, files);
  logger.info('File recorded', { id: fileRecord.id, originalName, diskPath });
  return fileRecord;
}

// ─── 原始内容抽取（喂给对话模型的“原料”）────────────────────────────────────

// Excel：每个工作表转 CSV 文本
function extractExcelText(filePath: string): string {
  const wb = XLSX.readFile(filePath);
  return wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false }).trim();
    return csv ? `# 工作表：${name}\n${csv}` : '';
  })
    .filter(Boolean)
    .join('\n\n');
}

// docx/pptx（OOXML zip）：抽取正文 XML 中的纯文本
async function extractOoxmlText(filePath: string): Promise<string> {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const targets = Object.keys(zip.files)
    .filter(
      (n) =>
        n === 'word/document.xml' ||
        /^word\/(header|footer)\d*\.xml$/.test(n) ||
        /^ppt\/slides\/slide\d+\.xml$/.test(n) ||
        /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n)
    )
    .sort();

  const parts: string[] = [];
  for (const name of targets) {
    const xml = await zip.files[name].async('string');
    const text = xml
      .replace(/<\/w:p>|<\/a:p>/g, '\n') // 段落结束 → 换行
      .replace(/<[^>]+>/g, ' ') // 去标签
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
    if (text) parts.push(text);
  }
  return parts.join('\n');
}

// 抽取文件原始内容；图片返回 base64
async function extractRawContent(
  category: FileCategory,
  filePath: string,
  originalName: string
): Promise<{ text?: string; imageBase64?: string }> {
  switch (category) {
    case 'txt':
      return { text: fs.readFileSync(filePath, 'utf-8') };
    case 'xlsx':
    case 'xls':
      return { text: extractExcelText(filePath) };
    case 'docx':
    case 'pptx':
      return { text: await extractOoxmlText(filePath) };
    case 'ppt':
      return {
        text: `（老版 .ppt 二进制格式，建议另存为 .pptx 后重新上传以获得更好解析）文件名：${originalName}`,
      };
    case 'png':
      return { imageBase64: fs.readFileSync(filePath).toString('base64') };
    default:
      return { text: fs.readFileSync(filePath, 'utf-8') };
  }
}

export async function parseFile(workspaceId: string, fileId: string): Promise<UploadedFile | null> {
  const files = loadMeta(workspaceId);
  const idx = files.findIndex((f) => f.id === fileId);
  if (idx < 0) return null;

  const file = files[idx];
  files[idx] = { ...file, status: 'parsing' };
  saveMeta(workspaceId, files);

  try {
    const dir = uploadDir(workspaceId);
    const diskName = fs.readdirSync(dir).find((f) => f.startsWith(fileId));
    if (!diskName) throw new Error('磁盘文件未找到');
    const diskPath = path.join(dir, diskName);

    const category = categoryOf(file.mimeType, file.originalName);
    const raw = await extractRawContent(category, diskPath, file.originalName);

    // 所有类型统一交给对话模型解析（图片走视觉，文本走对话）
    const parsedText = await parseDocumentWithLLM({
      filename: file.originalName,
      text: raw.text,
      imageBase64: raw.imageBase64,
      imageMime: file.mimeType || 'image/png',
    });

    const sections: ParsedSection[] = [
      {
        sourceFileId: fileId,
        pageOrSlide: 1,
        text: parsedText.trim(),
        metadata: { category, parser: 'llm' },
      },
    ];
    files[idx] = { ...file, status: 'parsed', parsedSections: sections };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.info('[uploadService] parse failed', { fileId, error: msg });
    files[idx] = { ...file, status: 'error', errorMsg: msg };
  }

  saveMeta(workspaceId, files);
  return files[idx];
}
