import React, { useEffect, useState } from 'react';
import { ConfigStatus, getConfigStatus } from '../api/configApi';

const SAMPLE_ENV = `# 复制 .env.ai.example 为 .env.ai 后填写
# *_PROVIDER 可选，不填时默认按 openai-compatible 适配

AI_CHAT_MODEL_PROVIDER=
AI_CHAT_MODEL_API_KEY=你的对话模型Key
AI_CHAT_MODEL_BASE_URL=https://your-chat-endpoint/v1
AI_CHAT_MODEL_NAME=你的对话模型名称

IMAGE_MODEL_PROVIDER=
IMAGE_MODEL_API_KEY=你的生图模型Key
IMAGE_MODEL_BASE_URL=https://your-image-endpoint/v1
IMAGE_MODEL_NAME=你的生图模型名称

KNOWHOW_API_PROVIDER=
KNOWHOW_API_KEY=你的KnowHow API Key
KNOWHOW_API_BASE_URL=https://your-knowhow-host
KNOWHOW_API_SEARCH_PATH=/api/search
KNOWHOW_API_TOP_N=5`;

export default function ConfigPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfigStatus()
      .then(setStatus)
      .catch((err) => alert(`配置状态读取失败: ${String(err)}`))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 28, color: 'var(--text-secondary)' }}>正在读取配置状态...</div>;
  }

  return (
    <div style={{ padding: 28, maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>模型与接口配置</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
          当前先使用 mock adapter。你填好 <code>.env.ai</code> 并重启后端后，对话模型、生图模型、KnowHow API 会进入可接入状态。
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 18 }}>
        {status?.groups.map((group) => (
          <div key={group.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{group.title}</div>
              <span className={`badge ${group.mode === 'ready' ? 'badge-green' : 'badge-gray'}`}>
                {group.mode === 'ready' ? '已配置' : 'Mock中'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map((item) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{item.key}</div>
                  </div>
                  <span className={`badge ${item.configured ? 'badge-green' : item.required ? 'badge-orange' : 'badge-gray'}`}>
                    {item.configured ? '已填' : item.required ? '必填' : '可选'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>配置步骤</div>
        <ol style={{ paddingLeft: 20, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.9 }}>
          <li>在项目根目录复制 <code>.env.ai.example</code> 为 <code>.env.ai</code>。</li>
          <li>填写对话模型、AI 生图模型、KnowHow API 的变量。</li>
          <li>保存后重启后端服务：<code>npm run dev</code>。</li>
          <li>回到本页面确认状态从“Mock中”变为“已配置”。</li>
        </ol>
      </section>

      <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>`.env.ai` 示例</div>
        <pre style={{ background: 'var(--bg-base)', padding: 14, borderRadius: 6, overflow: 'auto', fontSize: 12, lineHeight: 1.6 }}>
          {SAMPLE_ENV}
        </pre>
      </section>

      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 14 }}>
        {status?.note}
      </div>
    </div>
  );
}
