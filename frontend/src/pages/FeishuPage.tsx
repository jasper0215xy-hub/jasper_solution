import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FeishuDoc, getFeishuDoc, generateFeishuDoc } from '../api/feishuApi';

export default function FeishuPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [doc, setDoc] = useState<FeishuDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      getFeishuDoc(workspaceId).then(setDoc).finally(() => setLoading(false));
    }
  }, [workspaceId]);

  const handleGenerate = async () => {
    if (!workspaceId || generating) return;
    setGenerating(true);
    try {
      const d = await generateFeishuDoc(workspaceId);
      setDoc(d);
    } catch (err) {
      alert('生成失败: ' + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const DOC_SECTIONS = [
    '标题', '项目背景', '客户需求', '推荐方案总览', 'KnowHow 案例参考',
    'Demo驾驶舱图', '流程图', '解决方案架构图', '实施建议',
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>飞书文档</div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>文档内容结构</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DOC_SECTIONS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{ width: 22, height: 22, background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>文档状态</div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>加载中...</div>
        ) : doc ? (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span className="badge badge-green">已生成</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {new Date(doc.generatedAt).toLocaleString('zh-CN')}
              </span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              <span style={{ color: 'var(--text-secondary)' }}>文档链接：</span>
              <a href={doc.docUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 500 }}>
                {doc.docUrl}
              </a>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ fontSize: 12, padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-secondary)' }}
            >
              {generating ? '生成中...' : '重新生成'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              尚未生成飞书文档。请先在"方案生成"页面完成方案，再生成飞书文档。
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ background: generating ? 'var(--bg-hover)' : 'var(--blue)', color: generating ? 'var(--text-disabled)' : '#fff', padding: '9px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}
            >
              {generating ? '生成中...' : '生成飞书文档'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
