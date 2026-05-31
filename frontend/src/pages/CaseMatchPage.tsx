import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CaseMatch, getMatches, runMatch, selectCases } from '../api/caseApi';
import { getWorkspace, Workspace } from '../api/workspaceApi';

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-base)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--orange)' : 'var(--text-disabled)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: score >= 70 ? 'var(--green)' : 'var(--text-secondary)', minWidth: 32 }}>{score}</span>
    </div>
  );
}

export default function CaseMatchPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [matches, setMatches] = useState<CaseMatch[]>([]);
  const [matching, setMatching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then(setWorkspace);
    getMatches(workspaceId).then((ms) => {
      setMatches(ms);
      setSelected(new Set(ms.filter((m) => m.selected).map((m) => m.caseId)));
    });
  }, [workspaceId]);

  const handleMatch = async () => {
    if (!workspaceId || matching) return;
    setMatching(true);
    try {
      const ms = await runMatch(workspaceId);
      setMatches(ms);
      setSelected(new Set(ms.filter((m) => m.selected).map((m) => m.caseId)));
    } catch (err) {
      alert('匹配失败: ' + String(err));
    } finally {
      setMatching(false);
    }
  };

  const toggleSelect = (caseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const handleSaveSelection = async () => {
    if (!workspaceId || saving) return;
    setSaving(true);
    try {
      const updated = await selectCases(workspaceId, Array.from(selected));
      setMatches(updated);
    } catch (err) {
      alert('保存失败: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>帆软 KnowHow 案例匹配</div>

      {/* Context summary */}
      {workspace && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>当前项目信息</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>客户：</span><span style={{ fontSize: 13, fontWeight: 500 }}>{workspace.customerName}</span></div>
            <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>行业：</span><span style={{ fontSize: 13, fontWeight: 500 }}>{workspace.industry}</span></div>
          </div>
          {workspace.requirementSummary && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, background: 'var(--bg-base)', borderRadius: 5, padding: '8px 12px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>需求：</span>{workspace.requirementSummary}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={handleMatch}
          disabled={matching}
          style={{ background: matching ? 'var(--bg-hover)' : 'var(--blue)', color: matching ? 'var(--text-disabled)' : '#fff', padding: '9px 20px', borderRadius: 6, fontWeight: 600, fontSize: 13 }}
        >
          {matching ? '匹配中...' : '开始匹配案例'}
        </button>
        {matches.length > 0 && (
          <>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已选 {selected.size} 个案例</span>
            <button
              onClick={handleSaveSelection}
              disabled={saving}
              style={{ padding: '7px 16px', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
            >
              {saving ? '保存中...' : '保存选择'}
            </button>
          </>
        )}
      </div>

      {matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div>点击"开始匹配案例"，系统将根据项目需求推荐相关帆软案例</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {matches.map((m) => (
            <div
              key={m.caseId}
              style={{
                background: '#fff',
                border: `2px solid ${selected.has(m.caseId) ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: 18,
                cursor: 'pointer',
              }}
              onClick={() => toggleSelect(m.caseId)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: `2px solid ${selected.has(m.caseId) ? 'var(--blue)' : 'var(--border)'}`,
                  background: selected.has(m.caseId) ? 'var(--blue)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                }}>
                  {selected.has(m.caseId) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{m.case.title}</span>
                    {m.case.sourceUrl && (
                      <a
                        href={m.case.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 12, color: 'var(--blue)', flexShrink: 0, whiteSpace: 'nowrap' }}
                      >
                        查看原文 ↗
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">{m.case.industry}</span>
                    <span className="badge badge-gray">{m.case.scenario}</span>
                    {m.case.tags.map((t) => <span key={t} className="badge badge-gray">{t}</span>)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{m.case.summary}</div>
                  <div style={{ marginBottom: 8 }}>
                    <ScoreBar score={m.score} />
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>匹配原因：{m.reason}</div>
                  </div>
                  {m.case.reusableContent.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>可复用内容：</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.case.reusableContent.map((c, i) => (
                          <span key={i} style={{ fontSize: 11, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
