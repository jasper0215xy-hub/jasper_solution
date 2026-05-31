import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import AIChatPanel from '../AIChat/AIChatPanel';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS_GLOBAL: NavItem[] = [
  { to: '/', icon: '⊞', label: '项目空间' },
  { to: '/config', icon: '⚙', label: '模型配置' },
];

const NAV_ITEMS_WS = (id: string): NavItem[] => [
  { to: `/workspace/${id}`, icon: '⊞', label: '项目空间' },
  { to: `/workspace/${id}/upload`, icon: '↑', label: '文件上传' },
  { to: `/workspace/${id}/dashboard`, icon: '▦', label: 'Demo驾驶舱' },
  { to: `/workspace/${id}/cases`, icon: '⊙', label: '案例匹配' },
  { to: `/workspace/${id}/solution`, icon: '≡', label: '方案生成' },
  { to: `/workspace/${id}/feishu`, icon: '✦', label: '飞书文档' },
  { to: `/workspace/${id}/config`, icon: '⚙', label: '模型配置' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const navItems = workspaceId ? NAV_ITEMS_WS(workspaceId) : NAV_ITEMS_GLOBAL;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav style={{
        width: 200,
        minWidth: 200,
        background: 'var(--nav-bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 8,
        }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>帆软售前工作台</div>
          <div style={{ color: 'var(--nav-text)', fontSize: 11, marginTop: 2 }}>Pre-sales Workbench</div>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/' || item.to === `/workspace/${workspaceId}`}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              color: isActive ? 'var(--nav-text-active)' : 'var(--nav-text)',
              background: isActive ? 'var(--nav-item-active)' : 'transparent',
              borderRadius: 'var(--radius-sm)',
              margin: '1px 8px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              transition: 'var(--transition)',
            })}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />
        {workspaceId && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11,
            color: 'var(--nav-text)',
          }}>
            <div>当前项目</div>
            <div style={{ color: '#fff', fontWeight: 500, marginTop: 2, wordBreak: 'break-all' }}>
              {workspaceId.slice(0, 8)}...
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)', minWidth: 0 }}>
        {children}
      </main>

      {/* AI Chat Panel */}
      {workspaceId && <AIChatPanel workspaceId={workspaceId} />}
    </div>
  );
}
