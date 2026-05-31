import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DashboardAlert,
  DashboardChart,
  DashboardKpi,
  DashboardPromptDraft,
  DemoDashboard,
  generateDashboard,
  getDashboard,
  getDashboardPromptDraft,
} from '../api/dashboardApi';

const KPI_STATUS: Record<DashboardKpi['status'], { color: string; bg: string; label: string }> = {
  good: { color: 'var(--green)', bg: 'var(--green-light)', label: '正常' },
  warning: { color: 'var(--orange)', bg: 'var(--orange-light)', label: '关注' },
  danger: { color: 'var(--red)', bg: 'var(--red-light)', label: '风险' },
};

const ALERT_STYLE: Record<DashboardAlert['level'], { color: string; bg: string; label: string }> = {
  high: { color: 'var(--red)', bg: 'var(--red-light)', label: '高' },
  medium: { color: 'var(--orange)', bg: 'var(--orange-light)', label: '中' },
  low: { color: 'var(--blue)', bg: 'var(--blue-light)', label: '低' },
};

function ChartFrame({ chart, children }: { chart: DashboardChart; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, minHeight: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{chart.title}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 3 }}>{chart.description}</div>
        </div>
        <span className="badge badge-blue">{chart.type}</span>
      </div>
      {children}
    </section>
  );
}

function BarChart({ chart }: { chart: DashboardChart }) {
  const max = Math.max(...chart.data.map((item) => item.value), 1);
  return (
    <ChartFrame chart={chart}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chart.data.map((item) => (
          <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 52px', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</div>
            <div style={{ height: 16, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(item.value / max) * 100}%`, height: '100%', background: 'var(--blue)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{item.value}{chart.unit}</div>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}

function LineChart({ chart }: { chart: DashboardChart }) {
  const width = 420;
  const height = 150;
  const values = chart.data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = chart.data.map((item, index) => {
    const x = 18 + (index * (width - 36)) / Math.max(chart.data.length - 1, 1);
    const y = height - 18 - ((item.value - min) / range) * (height - 40);
    return { x, y, item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <ChartFrame chart={chart}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 170, display: 'block' }}>
        <line x1="18" y1={height - 18} x2={width - 18} y2={height - 18} stroke="var(--border)" />
        <polyline points={polyline} fill="none" stroke="var(--blue)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.item.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke="var(--blue)" strokeWidth="2" />
            <text x={point.x} y={height - 3} textAnchor="middle" fontSize="10" fill="#6b7280">{point.item.label}</text>
            <text x={point.x} y={point.y - 8} textAnchor="middle" fontSize="10" fill="#1a1d23">{point.item.value}</text>
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}

function DonutChart({ chart }: { chart: DashboardChart }) {
  const total = chart.data.reduce((sum, item) => sum + item.value, 0) || 1;
  const dominant = chart.data[0];
  return (
    <ChartFrame chart={chart}>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 18, alignItems: 'center' }}>
        <div style={{
          width: 138,
          height: 138,
          borderRadius: '50%',
          background: `conic-gradient(var(--blue) 0 ${dominant.value / total * 100}%, var(--green) ${dominant.value / total * 100}% 78%, var(--orange) 78% 100%)`,
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto',
        }}>
          <div style={{ width: 82, height: 82, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{Math.round((dominant.value / total) * 100)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dominant.label}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chart.data.map((item, index) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{['■', '■', '■'][index]} {item.label}</span>
              <strong>{item.value}{chart.unit}</strong>
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}

function TableChart({ chart }: { chart: DashboardChart }) {
  return (
    <ChartFrame chart={chart}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {(chart.columns ?? []).map((column) => (
              <th key={column} style={{ textAlign: 'left', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', padding: '8px 6px' }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(chart.rows ?? []).map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} style={{ borderBottom: '1px solid var(--border)', padding: '10px 6px' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}

function ChartRenderer({ chart }: { chart: DashboardChart }) {
  if (chart.type === 'bar') return <BarChart chart={chart} />;
  if (chart.type === 'line') return <LineChart chart={chart} />;
  if (chart.type === 'donut') return <DonutChart chart={chart} />;
  return <TableChart chart={chart} />;
}

export default function DemoDashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [dashboard, setDashboard] = useState<DemoDashboard | null>(null);
  const [promptDraft, setPromptDraft] = useState<DashboardPromptDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([getDashboard(workspaceId), getDashboardPromptDraft(workspaceId)])
      .then(([dashboardResult, draftResult]) => {
        setDashboard(dashboardResult);
        setPromptDraft(draftResult);
      })
      .catch((err) => alert(`加载驾驶舱失败: ${String(err)}`))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const handlePromptUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
      if (detail?.workspaceId !== workspaceId) return;
      getDashboardPromptDraft(workspaceId).then(setPromptDraft).catch(console.error);
    };
    window.addEventListener('dashboard-prompt-updated', handlePromptUpdate);
    return () => window.removeEventListener('dashboard-prompt-updated', handlePromptUpdate);
  }, [workspaceId]);

  const handleGenerate = async () => {
    if (!workspaceId || generating) return;
    if (!promptDraft) {
      alert('请先在右侧 AI 对话中确认 Demo驾驶舱内容，并点击“应用修改”。');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateDashboard(workspaceId);
      setDashboard(result);
    } catch (err) {
      alert(`生成失败: ${String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const imageList = useMemo<Array<{ url: string; createdAt?: string }>>(() => {
    if (!dashboard) return [];
    if (dashboard.imageHistory?.length) return dashboard.imageHistory;
    if (dashboard.generatedImage) return [{ url: dashboard.generatedImage.url, createdAt: dashboard.updatedAt }];
    return [];
  }, [dashboard]);
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    // 加载或新生成后默认定位到最新一张
    setImgIdx(Math.max(0, imageList.length - 1));
  }, [imageList.length]);

  const handleDownload = () => {
    const url = imageList[imgIdx]?.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboard?.title || 'demo-dashboard'}-${imgIdx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const chartStats = useMemo(() => {
    if (!dashboard) return '';
    return `${dashboard.kpis.length} 个指标 · ${dashboard.charts.length} 张图表 · ${dashboard.alerts.length} 条预警`;
  }, [dashboard]);

  if (loading) {
    return <div style={{ padding: 28, color: 'var(--text-secondary)' }}>正在加载 Demo驾驶舱...</div>;
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Demo驾驶舱</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>数据来源：客户需求文件解析内容 + 右侧 AI 已确认提示词</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {dashboard?.generatedImage && (
            <button
              onClick={handleDownload}
              style={{ background: '#fff', color: 'var(--blue)', border: '1px solid var(--blue)', padding: '9px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}
            >
              ⬇ 下载图片
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || !promptDraft}
            style={{ background: generating || !promptDraft ? 'var(--bg-hover)' : 'var(--blue)', color: generating || !promptDraft ? 'var(--text-disabled)' : '#fff', padding: '9px 18px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}
          >
            {generating ? '生成中...' : dashboard ? '重新生成 Demo驾驶舱' : '生成 Demo驾驶舱'}
          </button>
        </div>
      </div>

      {promptDraft && (
        <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>已确认的 Demo驾驶舱内容</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{promptDraft.summary}</div>
            </div>
            <span className="badge badge-green">已传入提示词</span>
          </div>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>查看将用于生图的 Prompt</summary>
            <pre style={{ marginTop: 10, padding: 12, borderRadius: 6, background: 'var(--bg-base)', whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, maxHeight: 260, overflow: 'auto' }}>
              {promptDraft.imagePrompt}
            </pre>
          </details>
        </section>
      )}

      {!dashboard ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '56px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>▦</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>尚未生成 Demo驾驶舱</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
            请先上传并解析客户需求文件，然后在右侧 AI 对话中确认要生成的驾驶舱内容。
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <Link to={`/workspace/${workspaceId}/upload`} style={{ border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 6, fontSize: 13 }}>去上传文件</Link>
            <button onClick={handleGenerate} disabled={generating || !promptDraft} style={{ background: promptDraft ? 'var(--blue)' : 'var(--bg-hover)', color: promptDraft ? '#fff' : 'var(--text-disabled)', padding: '8px 14px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
              生成 Demo驾驶舱
            </button>
          </div>
        </div>
      ) : (
        <>
          <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{dashboard.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>{dashboard.subtitle}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
                  生成方式：生图大模型 · 16:9 · 3840x2160 · PNG
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 150 }}>
                <span className="badge badge-blue">{dashboard.industry}</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8 }}>{chartStats}</div>
              </div>
            </div>
            {imageList.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: '#0f172a' }}>
                  <img
                    src={imageList[imgIdx]?.url}
                    alt={dashboard.title}
                    style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', background: '#0f172a' }}
                  />
                </div>
                {imageList.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                    <button
                      onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                      disabled={imgIdx === 0}
                      style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: imgIdx === 0 ? 'var(--text-disabled)' : 'var(--text-primary)', background: '#fff' }}
                    >
                      ‹ 上一张
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      第 {imgIdx + 1} / {imageList.length} 张
                      {imageList[imgIdx]?.createdAt ? ` · ${new Date(imageList[imgIdx].createdAt as string).toLocaleString('zh-CN')}` : ''}
                    </span>
                    <button
                      onClick={() => setImgIdx((i) => Math.min(imageList.length - 1, i + 1))}
                      disabled={imgIdx === imageList.length - 1}
                      style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: imgIdx === imageList.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)', background: '#fff' }}
                    >
                      下一张 ›
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: 'var(--orange-light)', color: 'var(--orange)', fontSize: 13 }}>
                尚未拿到生图结果，请重新生成 Demo驾驶舱。
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {dashboard.filters.map((filter) => (
                <label key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', background: 'var(--bg-base)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{filter.label}</span>
                  <select defaultValue={filter.value} style={{ border: 'none', background: 'transparent', fontWeight: 700, outline: 'none', fontSize: 12 }}>
                    {filter.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <details style={{ marginBottom: 14, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>查看生图 Prompt 和结构化生成依据</summary>
            <pre style={{ marginTop: 12, padding: 12, borderRadius: 6, background: 'var(--bg-base)', whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, maxHeight: 280, overflow: 'auto' }}>
              {dashboard.imagePrompt}
            </pre>
          </details>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 14 }}>
            {dashboard.kpis.map((kpi) => {
              const status = KPI_STATUS[kpi.status];
              return (
                <div key={kpi.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 14, minHeight: 124 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{kpi.label}</div>
                    <span style={{ background: status.bg, color: status.color, borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{status.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{kpi.value}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{kpi.unit}</span>
                  </div>
                  <div style={{ color: kpi.trend.startsWith('-') ? 'var(--orange)' : 'var(--green)', fontSize: 12, fontWeight: 700, marginTop: 4 }}>{kpi.trend}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>{kpi.rationale}</div>
                </div>
              );
            })}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 14 }}>
            {dashboard.charts.map((chart) => <ChartRenderer key={chart.id} chart={chart} />)}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 14 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>预警事项</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dashboard.alerts.map((alert) => {
                  const style = ALERT_STYLE[alert.level];
                  return (
                    <div key={alert.id} style={{ display: 'grid', gridTemplateColumns: '42px 1fr 90px', gap: 10, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, padding: 10 }}>
                      <span style={{ background: style.bg, color: style.color, borderRadius: 4, padding: '3px 8px', fontSize: 12, fontWeight: 800, textAlign: 'center' }}>{style.label}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{alert.title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{alert.description}</div>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'right' }}>{alert.owner}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>洞察摘要</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dashboard.insights.map((insight, index) => (
                  <div key={insight.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--blue-light)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{insight.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, marginTop: 3 }}>{insight.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
