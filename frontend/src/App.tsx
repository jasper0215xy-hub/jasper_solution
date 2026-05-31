import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import WorkspacePage from './pages/WorkspacePage';
import UploadPage from './pages/UploadPage';
import CaseMatchPage from './pages/CaseMatchPage';
import SolutionPage from './pages/SolutionPage';
import FeishuPage from './pages/FeishuPage';
import DemoDashboardPage from './pages/DemoDashboardPage';
import ConfigPage from './pages/ConfigPage';

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Global workspace list */}
        <Route
          path="/"
          element={
            <Layout>
              <WorkspacePage />
            </Layout>
          }
        />

        {/* Workspace-scoped routes */}
        <Route
          path="/workspace/:workspaceId"
          element={
            <WorkspaceLayout>
              <WorkspacePage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/upload"
          element={
            <WorkspaceLayout>
              <UploadPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/dashboard"
          element={
            <WorkspaceLayout>
              <DemoDashboardPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/cases"
          element={
            <WorkspaceLayout>
              <CaseMatchPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/solution"
          element={
            <WorkspaceLayout>
              <SolutionPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/feishu"
          element={
            <WorkspaceLayout>
              <FeishuPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/workspace/:workspaceId/config"
          element={
            <WorkspaceLayout>
              <ConfigPage />
            </WorkspaceLayout>
          }
        />
        <Route
          path="/config"
          element={
            <Layout>
              <ConfigPage />
            </Layout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
