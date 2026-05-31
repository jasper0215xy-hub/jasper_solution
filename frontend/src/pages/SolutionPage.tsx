import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Solution, SolutionChapter, SolutionDiagram, getSolution, generateSolution, updateSolution } from '../api/solutionApi';
import { generateFeishuDoc, getFeishuDoc, FeishuDoc } from '../api/feishuApi';

declare global {
  interface Window { mermaid: { initialize: (cfg: object) => void; render: (id: string, code: string, el: HTMLElement) => void } }
}

function MermaidView({ code, id }: { code: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    el.innerHTML = '';
    setError('');
    import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, theme: 'default' });
      try {
        m.default.render(`mermaid-${id}`, code, el);
      } catch (e) {
        setError(String(e));
        el.innerHTML = `<pre style="font-size:11px;overflow:auto">${code}</pre>`;
      }
    }).catch(() => {
      el.innerHTML = `<pre style="font-size:11px;overflow:auto">${code}</pre>`;
    });
  }, [code, id]);

  return (
    <div>
      {error && <div style={{ fontSize: 11, color: 'var(--orange)', marginBottom: 4 }}>Mermaid 渲染失败，显示原始代码</div>}
      <div ref={ref} style={{ overflow: 'auto' }} />
    </div>
  );
}

export default function SolutionPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [feishuDoc, setFeishuDoc] = useState<FeishuDoc | null>(null);
  const [genFeishu, setGenFeishu] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'diagrams'>('chapters');

  useEffect(() => {
    if (!workspaceId) return;
    getSolution(workspaceId).then(setSolution);
    getFeishuDoc(workspaceId).then(setFeishuDoc);
  }, [workspaceId]);

  const handleGenerate = async () => {
    if (!workspaceId || generating) return;
    setGenerating(true);
    try {
      const s = await generateSolution(workspaceId);
      setSolution(s);
    } catch (err) {
      alert('生成失败: ' + String(err));
    } finally {
      setGenerating(false);
    }
  };

  const startEditChapter = (chapter: SolutionChapter) => {
    setEditingChapter(chapter.id);
    setEditContent(chapter.content);
  };

  const saveChapter = async (chapterId: string) => {
    if (!solution || !workspaceId) return;
    setSaving(true);
    const updatedChapters = solution.chapters.map((c) =>
      c.id === chapterId ? { ...c, content: editContent } : c
    );
    try {
      const updated = await updateSolution(workspaceId, { chapters: updatedChapters });
      setSolution(updated);
      setEditingChapter(null);
    } catch (err) {
      alert('保存失败: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleGenFeishu = async () => {
    if (!workspaceId || genFeishu) return;
    setGenFeishu(true);
    try {
      const doc = await generateFeishuDoc(workspaceId);
      setFeishuDoc(doc);
    } catch (err) {
      alert('飞书文档生成失败: ' + String(err));
    } finally {
      setGenFeishu(false);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>方案生成</div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ background: generating ? 'var(--bg-hover)' : 'var(--blue)', color: generating ? 'var(--text-disabled)' : '#fff', padding: '9px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}
        >
          {generating ? '生成中...' : solution ? '重新生成' : '生成方案'}
        </button>
      </div>

      {!solution ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>点击"生成方案"，AI 将综合分析项目资料、上传文件和参考案例</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>建议先完成文件上传和案例匹配</div>
        </div>
      ) : (
        <>
          {/* Title & Summary */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{solution.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{solution.summary}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-disabled)' }}>
              生成于 {new Date(solution.createdAt).toLocaleString('zh-CN')} · 更新于 {new Date(solution.updatedAt).toLocaleString('zh-CN')}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
            {(['chapters', 'diagrams'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? 'var(--blue)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--blue)' : '2px solid transparent',
                  marginBottom: -1,
                  background: 'none',
                }}
              >
                {tab === 'chapters' ? `章节内容 (${solution.chapters.length})` : `架构图 (${solution.diagrams.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'chapters' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {solution.chapters.sort((a, b) => a.order - b.order).map((chapter) => (
                <div key={chapter.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', justifyContent: 'space-between', background: 'var(--bg-hover)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: 8 }}>{chapter.order}.</span>
                      {chapter.heading}
                    </div>
                    {editingChapter !== chapter.id ? (
                      <button
                        onClick={() => startEditChapter(chapter)}
                        style={{ fontSize: 12, color: 'var(--blue)', padding: '3px 10px', border: '1px solid var(--blue)', borderRadius: 4 }}
                      >
                        编辑
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditingChapter(null)} style={{ fontSize: 12, padding: '3px 10px', border: '1px solid var(--border)', borderRadius: 4 }}>取消</button>
                        <button onClick={() => saveChapter(chapter.id)} disabled={saving} style={{ fontSize: 12, background: 'var(--blue)', color: '#fff', padding: '3px 10px', borderRadius: 4 }}>
                          {saving ? '...' : '保存'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    {editingChapter === chapter.id ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', fontSize: 13, resize: 'vertical', lineHeight: 1.7 }}
                      />
                    ) : (
                      <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{chapter.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'diagrams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {solution.diagrams.map((diagram) => (
                <div key={diagram.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{diagram.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{diagram.description}</div>
                    </div>
                    <span className="badge badge-blue">{
                      { 'business-flow': '业务流程', 'tech-architecture': '技术架构', 'data-flow': '数据流向', 'system-integration': '系统集成' }[diagram.type]
                    }</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <MermaidView code={diagram.mermaidCode} id={diagram.id} />
                    <details style={{ marginTop: 12 }}>
                      <summary style={{ fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>查看 Mermaid 原始代码</summary>
                      <pre style={{ marginTop: 8, fontSize: 11, background: 'var(--bg-base)', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 300 }}>{diagram.mermaidCode}</pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Feishu Doc */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>飞书文档</div>
            {feishuDoc ? (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  生成于 {new Date(feishuDoc.generatedAt).toLocaleString('zh-CN')}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={feishuDoc.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}
                  >
                    {feishuDoc.docUrl}
                  </a>
                  <button
                    onClick={handleGenFeishu}
                    disabled={genFeishu}
                    style={{ fontSize: 12, padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 5 }}
                  >
                    {genFeishu ? '生成中...' : '重新生成'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>尚未生成飞书文档</span>
                <button
                  onClick={handleGenFeishu}
                  disabled={genFeishu}
                  style={{ background: genFeishu ? 'var(--bg-hover)' : 'var(--blue)', color: genFeishu ? 'var(--text-disabled)' : '#fff', padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  {genFeishu ? '生成中...' : '生成飞书文档'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
