# 帆软售前工作台 MVP

基于 React + TypeScript + Vite（前端）和 Node.js + Express（后端）构建的售前工作台，帮助帆软售前团队快速完成客户方案制作。

## 快速启动

### 1. 安装依赖

```bash
# 在项目根目录
npm run install:all
# 等价于：
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. 配置 AI 参数（可选）

```bash
cp .env.ai.example .env.ai
# 编辑 .env.ai，填写真实 AI 模型参数（不填则使用 Mock 模式）
```

### 3. 启动

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:backend   # 后端 http://localhost:3002
npm run dev:frontend  # 前端 http://localhost:5173
```

浏览器打开 **http://localhost:5173** 即可使用。

---

## 核心功能

| 模块 | 路径 | 说明 |
|------|------|------|
| 项目空间 | `/` | 新建/管理项目，每个项目独立存储 |
| 文件上传 | `/workspace/:id/upload` | 拖拽上传 docx/pptx/ppt/png/txt，一键解析 |
| Demo驾驶舱 | `/workspace/:id/dashboard` | AI 确认内容后，根据提示词生成 16:9 4K PNG 驾驶舱图 |
| 案例匹配 | `/workspace/:id/cases` | 根据行业和需求匹配帆软 KnowHow 案例 |
| 方案生成 | `/workspace/:id/solution` | AI 综合生成结构化方案 + 架构图 |
| 飞书文档 | `/workspace/:id/feishu` | 一键生成飞书文档 |
| 模型配置 | `/config` | 引导配置对话模型、生图模型、KnowHow API |
| AI 对话 | 右侧面板（全局常驻） | 任意模块调整内容，建议修改需用户确认才写入 |

---

## 目录结构

```
jasper_solution/
├── frontend/src/
│   ├── pages/           # WorkspacePage, UploadPage, DemoDashboardPage, CaseMatchPage, SolutionPage, FeishuPage
│   ├── components/
│   │   ├── Layout/      # 左侧导航 + 主区域布局
│   │   └── AIChat/      # 全局 AI 对话面板（右侧）
│   └── api/             # 前端 API 调用层
│
├── backend/src/
│   ├── routes/          # Express 路由
│   ├── services/        # 业务逻辑
│   ├── adapters/        # 第三方能力接入点（含 Mock）
│   └── utils/           # promptBuilder, diagramBuilder, logger
│
└── storage/             # 本地 JSON 文件存储（不提交到 git）
    ├── workspaces/      # 每个项目独立目录
    ├── uploads/
    ├── generated-images/
    ├── generated-docs/
    └── cases-cache/     # mock-cases.json（内置 8 个行业案例）
```

---

## 当前 Mock 状态

| 能力 | 当前状态 | 真实接入位置 |
|------|----------|-------------|
| 文本生成（方案/对话） | ✅ Mock（结构化输出） | `backend/src/adapters/llmAdapter.ts` → `realTextCompletion` |
| Demo驾驶舱生图 | ✅ Mock/真实模型可切换（3840x2160 PNG） | `backend/src/adapters/imageModelAdapter.ts` → `realImageGeneration` |
| KnowHow 案例匹配 | ✅ Mock（8 个内置案例） | `backend/src/adapters/knowhowAdapter.ts` → 替换 `matchCases` |
| 飞书文档生成 | ✅ Mock（模拟链接） | `backend/src/adapters/feishuCliAdapter.ts` → `realCreateDoc` |
| docx/pptx 解析 | ✅ Mock（占位文本） | `backend/src/services/uploadService.ts` → 集成 mammoth/python-pptx |

当前阶段先搭项目框架和配置入口。未填写 `.env.ai` 前，系统不会调用真实对话模型、生图模型或 KnowHow API。

### 开启真实 AI 模型

编辑 `.env.ai`（**不要提交到 git**）：

```env
TEXT_MODEL_PROVIDER=                 # 可选；不填默认 openai-compatible
TEXT_MODEL_API_KEY=your-text-model-key
TEXT_MODEL_BASE_URL=https://api.openai.com/v1
TEXT_MODEL_NAME=gpt-4o

IMAGE_MODEL_PROVIDER=                # 可选；不填默认 openai-compatible
IMAGE_MODEL_API_KEY=your-image-model-key
IMAGE_MODEL_BASE_URL=https://api.openai.com/v1
IMAGE_MODEL_NAME=dall-e-3

AI_CHAT_MODEL_PROVIDER=              # 可选；不填默认 openai-compatible
AI_CHAT_MODEL_API_KEY=your-chat-model-key
AI_CHAT_MODEL_BASE_URL=https://api.openai.com/v1
AI_CHAT_MODEL_NAME=gpt-4o

KNOWHOW_API_PROVIDER=                # 可选
KNOWHOW_API_KEY=your-knowhow-token
KNOWHOW_API_BASE_URL=https://your-knowhow-host
KNOWHOW_API_SEARCH_PATH=/api/search
KNOWHOW_API_TOP_N=5
```

然后在对应 adapter 中实现 `real*` 函数。

配置引导见：`docs/model-api-config-guide.md`，或打开 `http://localhost:5173/config` 查看配置状态。

---

## Demo驾驶舱图生成

当前优先完成的闭环：

```
新建项目空间 → 上传客户需求文件 → 解析文件 → 右侧 AI 对话确认驾驶舱内容 → 提示词自动传入 Demo驾驶舱 → 用户点击生成 → 展示生图模型输出的驾驶舱图
```

使用方式：

1. 进入项目空间。
2. 打开“文件上传”，上传客户需求 `txt` 文件并点击“解析”。
3. 在右侧 AI 对话中说明并确认要生成的 Demo驾驶舱内容。
4. 点击 AI 建议中的“应用修改”，系统会保存确认后的生图 Prompt。
5. 进入左侧导航“Demo驾驶舱”，点击“生成 Demo驾驶舱”后，后端调用 `imageModelAdapter` 输出 16:9、3840x2160、PNG 图片。

接口：

```http
GET  /api/workspaces/:workspaceId/dashboard
GET  /api/workspaces/:workspaceId/dashboard/prompt
PUT  /api/workspaces/:workspaceId/dashboard/prompt
POST /api/workspaces/:workspaceId/dashboard/generate
```

实现位置：

- `backend/src/services/dashboardService.ts`：从客户需求文件提取行业、受众、指标、图表、预警和洞察，并组装生图 Prompt。
- `backend/src/adapters/imageModelAdapter.ts`：统一生图模型入口。当前 mock 会生成本地 4K PNG；配置真实 `IMAGE_MODEL_*` 后可替换为真实生图模型。
- `frontend/src/pages/DemoDashboardPage.tsx`：展示生图结果、Prompt 和结构化生成依据。

注意：驾驶舱最终产物以生图模型输出图片为准，页面中的 KPI/图表结构只是生图 Prompt 的生成依据和调试信息。

---

## AI 对话闭环机制

所有 AI 修改建议遵循以下流程：

```
用户输入 → AI 分析 → 返回建议 + patch 对象
                              ↓
                    用户点击"应用修改"
                              ↓
              POST /ai-chat/apply → 写入项目数据
```

AI 回复分三种类型：
- `explanation`：普通解释，不涉及修改
- `suggestion`：包含 patch 的修改建议，需用户确认
- `patch`：直接可应用的补丁（预留）

---

## 架构图说明

方案生成的架构图来自 `diagramBuilder.ts`，图中内容反映**客户的业务/技术架构**，包含：
- 客户现有业务系统（ERP/MES/CRM 等）
- 帆软产品层（FineReport/FineBI/FineDataLink）
- 数据源层、数据处理链路
- 业务用户访问路径
- 权限与组织体系

**不是本项目自身的工程架构图。**

---

## 飞书 CLI 接入

见 `docs/feishu-cli-guide.md`
