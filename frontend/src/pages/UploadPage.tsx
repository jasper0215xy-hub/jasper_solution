import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UploadedFile, listFiles, uploadFile, parseFile } from '../api/uploadApi';

const STATUS_LABELS: Record<string, string> = {
  uploaded: '待解析',
  parsing: '解析中',
  parsed: '已解析',
  error: '错误',
};
const STATUS_BADGE: Record<string, string> = {
  uploaded: 'badge-gray',
  parsing: 'badge-orange',
  parsed: 'badge-green',
  error: 'badge-red',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(name: string, mime: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx' || ext === 'xls') return '📊';
  if (ext === 'png' || mime === 'image/png') return '🖼';
  if (ext === 'txt' || mime === 'text/plain') return '📄';
  return '📑';
}

export default function UploadPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceId) listFiles(workspaceId).then(setFiles);
  }, [workspaceId]);

  const handleFiles = async (fileList: FileList) => {
    if (!workspaceId) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      try {
        const uploaded = await uploadFile(workspaceId, file);
        setFiles((prev) => [uploaded, ...prev]);
      } catch (err) {
        alert(`上传失败: ${String(err)}`);
      }
    }
    setUploading(false);
  };

  const handleParse = async (fileId: string) => {
    if (!workspaceId) return;
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'parsing' } : f));
    try {
      const updated = await parseFile(workspaceId, fileId);
      setFiles((prev) => prev.map((f) => f.id === fileId ? updated : f));
    } catch (err) {
      alert(`解析失败: ${String(err)}`);
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, status: 'error' } : f));
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>文件上传</div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Demo驾驶舱生成流程</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
          上传并解析客户需求文件后，请在右侧 AI 对话中确认驾驶舱内容。确认后点击 AI 建议里的“应用修改”，提示词会自动传输到 Demo驾驶舱页面，用户再点击生成。
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInput.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--blue)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '36px 20px',
          textAlign: 'center',
          background: dragging ? 'var(--blue-light)' : '#fff',
          cursor: 'pointer',
          transition: 'var(--transition)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {uploading ? '上传中...' : '拖拽文件到此处，或点击选择'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          支持 docx、pptx、ppt、xlsx、xls、png、txt，单文件最大 50MB
        </div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".docx,.pptx,.ppt,.xlsx,.xls,.png,.txt"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
          暂无上传文件
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f) => (
            <div key={f.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{fileIcon(f.originalName, f.mimeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.originalName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {formatBytes(f.size)} · {new Date(f.uploadedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span className={`badge ${STATUS_BADGE[f.status]}`}>{STATUS_LABELS[f.status]}</span>
                {f.status === 'uploaded' && (
                  <button
                    onClick={() => handleParse(f.id)}
                    style={{ padding: '4px 12px', background: 'var(--blue)', color: '#fff', borderRadius: 5, fontSize: 12, fontWeight: 500 }}
                  >
                    解析
                  </button>
                )}
                {f.status === 'parsed' && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Link
                      to={`/workspace/${workspaceId}/dashboard`}
                      style={{ padding: '4px 12px', background: 'var(--blue)', color: '#fff', borderRadius: 5, fontSize: 12, fontWeight: 600 }}
                    >
                      去确认 Demo驾驶舱
                    </Link>
                    <button
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      style={{ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, color: 'var(--text-secondary)' }}
                    >
                      {expandedId === f.id ? '收起' : '查看'}
                    </button>
                  </div>
                )}
              </div>

              {expandedId === f.id && f.parsedSections && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', background: 'var(--bg-base)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    解析结果 ({f.parsedSections.length} 个片段)
                  </div>
                  {f.parsedSections.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 6, padding: '6px 10px', background: '#fff', borderRadius: 5, border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: 8 }}>P{s.pageOrSlide}</span>
                      {s.text.slice(0, 200)}{s.text.length > 200 ? '...' : ''}
                    </div>
                  ))}
                  {f.parsedSections.length > 5 && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>...还有 {f.parsedSections.length - 5} 个片段</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
