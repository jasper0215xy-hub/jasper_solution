// 文件类别：决定上传是否放行，以及走哪条解析分支
export type FileCategory = 'docx' | 'pptx' | 'ppt' | 'xlsx' | 'xls' | 'png' | 'txt' | 'unknown';

// 标准 MIME → 扩展名/类别
export const ALLOWED_MIME_TYPES: Record<string, FileCategory> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'image/png': 'png',
  'text/plain': 'txt',
};

// 允许的扩展名（兜底）：Excel/Office 文件经浏览器上传时 mimetype 经常是
// application/octet-stream 或为空，必须用扩展名兜底，否则会被误拦或解析失败。
const ALLOWED_EXTENSIONS = new Set<FileCategory>(['docx', 'pptx', 'ppt', 'xlsx', 'xls', 'png', 'txt']);

export function extensionOf(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ext;
}

// 综合判断文件类别：优先扩展名，回退到 MIME
export function categoryOf(mimeType: string, filename: string): FileCategory {
  const ext = extensionOf(filename) as FileCategory;
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  if (mimeType in ALLOWED_MIME_TYPES) return ALLOWED_MIME_TYPES[mimeType];
  return 'unknown';
}

// 上传放行：MIME 命中或扩展名命中即可
export function isAllowedUpload(mimeType: string, filename: string): boolean {
  return categoryOf(mimeType, filename) !== 'unknown';
}
