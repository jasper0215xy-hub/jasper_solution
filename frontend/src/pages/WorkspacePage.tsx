import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Workspace, listWorkspaces, createWorkspace, getWorkspace } from '../api/workspaceApi';

const INDUSTRIES = ['制造业', '零售业', '金融业', '医疗健康', '政府/公共事业', '教育', '物流/供应链', '互联网', '能源/化工', '其他'];

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (ws: Workspace) => void }) {
  const [form, setForm] = useState({ name: '', customerName: '', industry: '制造业', background: '', requirementSummary: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.customerName) { setError('项目名称和客户名称必填'); return; }
    setLoading(true);
    try {
      const ws = await createWorkspace(form);
      onCreate(ws);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>新建项目空间</div>
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: '项目名称', placeholder: '例：XX集团数字化报表项目', required: true },
            { key: 'customerName', label: '客户名称', placeholder: '例：XX集团', required: true },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: 13 }}>
                {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
              </label>
              <input
                value={(form as Record<string,string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
              />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: 13 }}>行业</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
            >
              {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: 13 }}>项目背景</label>
            <textarea
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              placeholder="简要描述客户现状和项目背景..."
              rows={2}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: 13 }}>需求摘要</label>
            <textarea
              value={form.requirementSummary}
              onChange={(e) => setForm({ ...form, requirementSummary: e.target.value })}
              placeholder="客户核心需求、痛点、期望目标..."
              rows={3}
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}>取消</button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 18px', background: 'var(--blue)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '创建中...' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWs, setCurrentWs] = useState<Workspace | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWorkspaces().then((ws) => {
      setWorkspaces(ws);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (workspaceId) {
      getWorkspace(workspaceId).then(setCurrentWs);
    }
  }, [workspaceId]);

  const handleCreate = (ws: Workspace) => {
    setWorkspaces((prev) => [ws, ...prev]);
    setShowCreate(false);
    navigate(`/workspace/${ws.id}`);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>加载中...</div>;

  return (
    <div style={{ padding: 28 }}>
      {currentWs && (
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{currentWs.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
            {currentWs.customerName} · {currentWs.industry}
          </div>
          {currentWs.requirementSummary && (
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, background: 'var(--bg-base)', borderRadius: 6, padding: '10px 14px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>需求摘要：</span>{currentWs.requirementSummary}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {workspaceId ? '所有项目' : '项目空间'}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: 'var(--blue)', color: '#fff', padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
        >
          + 新建项目
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>还没有项目空间</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>点击"新建项目"开始</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              style={{
                background: '#fff',
                border: `2px solid ${ws.id === workspaceId ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: 18,
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                {ws.customerName} · {ws.industry}
              </div>
              {ws.requirementSummary && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {ws.requirementSummary}
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-disabled)' }}>
                {new Date(ws.createdAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
