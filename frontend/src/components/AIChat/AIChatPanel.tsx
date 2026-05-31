import React, { useState, useEffect, useRef } from 'react';
import { AIChatMessage, getMessages, sendMessage, applyPatch } from '../../api/aiChatApi';

interface Props {
  workspaceId: string;
}

export default function AIChatPanel({ workspaceId }: Props) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages(workspaceId).then(setMessages).catch(console.error);
  }, [workspaceId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput('');
    setLoading(true);
    try {
      const reply = await sendMessage(workspaceId, content);
      setMessages((prev) => {
        const withUser: AIChatMessage = {
          id: `tmp-${Date.now()}`,
          workspaceId,
          role: 'user',
          content,
          applied: false,
          createdAt: new Date().toISOString(),
        };
        return [...prev, withUser, reply];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (msg: AIChatMessage) => {
    try {
      await applyPatch(workspaceId, msg.id);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m))
      );
      if (msg.patch?.target === 'dashboard') {
        window.dispatchEvent(new CustomEvent('dashboard-prompt-updated', { detail: { workspaceId } }));
      }
    } catch (err) {
      alert('应用失败: ' + String(err));
    }
  };

  const panelWidth = open ? 300 : 40;

  return (
    <div style={{
      width: panelWidth,
      minWidth: panelWidth,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 200ms ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-hover)',
        minHeight: 44,
      }}>
        {open && <span style={{ fontWeight: 600, fontSize: 13 }}>AI 对话助手</span>}
        <button
          onClick={() => setOpen(!open)}
          title={open ? '收起' : '展开 AI 对话'}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: 'var(--bg-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginLeft: 'auto',
          }}
        >
          {open ? '›' : '‹'}
        </button>
      </div>

      {open && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
                <div>在任意模块输入指令，AI 可帮助您</div>
                <div style={{ marginTop: 4 }}>调整方案、图表、文档内容</div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
              }}>
                <div style={{
                  padding: '8px 10px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? 'var(--blue)' : 'var(--bg-hover)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                {msg.patch && !msg.applied && (
                  <div style={{
                    marginTop: 6,
                    padding: 8,
                    background: 'var(--orange-light)',
                    border: '1px solid var(--orange)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}>
                    <div style={{ color: 'var(--orange)', fontWeight: 600, marginBottom: 4 }}>
                      ✏ 建议修改：{msg.patch.description}
                    </div>
                    {msg.patch.target === 'dashboard' && typeof msg.patch.value === 'object' && msg.patch.value !== null && (
                      <div style={{ margin: '6px 0', padding: 8, borderRadius: 4, background: '#fff', color: 'var(--text-primary)', maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {String((msg.patch.value as { summary?: unknown }).summary ?? '已生成 Demo驾驶舱提示词，应用后将传输到 Demo驾驶舱页面。')}
                      </div>
                    )}
                    <button
                      onClick={() => handleApply(msg)}
                      style={{
                        background: 'var(--orange)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      应用修改
                    </button>
                  </div>
                )}
                {msg.patch && msg.applied && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--green)' }}>✓ 已应用</div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: 12 }}>
                AI 思考中...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入指令... (Enter 发送)"
              rows={2}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 12,
                outline: 'none',
                background: 'var(--bg-base)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'var(--bg-hover)' : 'var(--blue)',
                color: loading || !input.trim() ? 'var(--text-disabled)' : '#fff',
                padding: '0 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                alignSelf: 'stretch',
              }}
            >
              发
            </button>
          </div>
        </>
      )}
    </div>
  );
}
