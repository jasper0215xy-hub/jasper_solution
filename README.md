# 帆软售前工作台

一个面向帆软售前场景的本地 Web 工作台，用于把客户需求文件转化为可讨论、可确认、可生成的售前素材。当前重点能力是：上传客户需求文件后，通过右侧 AI 对话确认 Demo 驾驶舱内容，再调用生图模型生成 16:9、4K PNG 驾驶舱图。

项目采用 React + TypeScript + Vite 前端、Node.js + Express 后端。所有第三方能力都通过 adapter 封装，未配置真实 API 时自动使用 mock。

## 能力定位

本项目不是通用 BI 产品，也不是完整低代码平台，而是一个售前工作流编排工具：

1. 统一管理客户项目空间。
2. 上传并解析客户需求材料。
3. 通过 AI 对话和用户确认，沉淀 Demo 驾驶舱生成内容。
4. 将确认后的提示词传入 Demo 驾驶舱模块。
5. 用户点击生成后，调用生图模型输出驾驶舱图。
6. 后续扩展 KnowHow 案例匹配、方案生成、飞书文档输出。

核心原则：AI 只提出建议，关键修改必须由用户确认后才写入项目数据。

## 当前模块

| 模块 | 路径 | 状态 | 说明 |
| --- | --- | --- | --- |
| 项目空间 | `/` | 可用 | 新建和管理客户项目 |
| 文件上传 | `/workspace/:id/upload` | 可用 | 支持 `txt/docx/ppt/pptx/png` 上传，`txt` 可真实读取，其他格式暂为解析占位 |
| AI 对话助手 | 右侧面板 | 可用 | 支持围绕当前项目进行对话，并返回可确认的修改建议 |
| Demo 驾驶舱 | `/workspace/:id/dashboard` | 重点能力 | 读取 AI 确认后的 Prompt，点击后调用生图模型 |
| 模型配置 | `/config` | 可用 | 查看对话模型、生图模型、KnowHow API 配置状态 |
| 案例匹配 | `/workspace/:id/cases` | Mock | 当前使用本地 mock 案例库 |
| 方案生成 | `/workspace/:id/solution` | Mock | 生成结构化方案和客户解决方案架构图 |
| 飞书文档 | `/workspace/:id/feishu` | Mock | 预留飞书 CLI 文档生成入口 |

## Demo 驾驶舱流程

推荐使用路径：

```text
新建项目空间
  -> 上传客户需求文件
  -> 点击解析
  -> 在右侧 AI 对话中确认驾驶舱内容
  -> 点击 AI 建议里的“应用修改”
  -> 进入 Demo驾驶舱页面
  -> 检查自动传入的 Prompt
  -> 点击“生成 Demo驾驶舱”
  -> 查看 16:9、3840x2160、PNG 驾驶舱图
```

这个流程里，用户点击“应用修改”只会保存提示词草稿，不会直接调用生图模型。真正调用生图模型发生在 Demo 驾驶舱页面点击生成时。

## 快速启动

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm run install:all
```

等价于：

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 启动开发服务

```bash
npm run dev
```

默认地址：

- 前端：http://localhost:5173
- 后端：http://localhost:3002

健康检查：

```bash
curl http://localhost:3002/api/health
```

### 类型检查

```bash
npm run typecheck
```

## API 配置

本项目不会提交真实密钥。真实配置放在本地 `.env.ai`，该文件已被 `.gitignore` 忽略。

复制模板：

```bash
cp .env.ai.example .env.ai
```

### 对话模型

用于右侧 AI 对话助手。

```env
AI_CHAT_MODEL_API_KEY=your-chat-model-key
AI_CHAT_MODEL_BASE_URL=https://your-chat-endpoint/v1
AI_CHAT_MODEL_NAME=your-chat-model
AI_CHAT_MODEL_PROVIDER=
```

`AI_CHAT_MODEL_PROVIDER` 可选。不填时默认按 OpenAI-compatible 接口适配。

### 生图模型

用于 Demo 驾驶舱图生成。固定规格：

- 比例：16:9
- 分辨率：3840x2160
- 格式：PNG

```env
IMAGE_MODEL_API_KEY=your-image-model-key
IMAGE_MODEL_BASE_URL=https://your-image-endpoint/v1
IMAGE_MODEL_NAME=your-image-model
IMAGE_MODEL_PROVIDER=
```

`IMAGE_MODEL_PROVIDER` 可选。不填时默认按 OpenAI-compatible `/images/generations` 接口适配。

### KnowHow API

用于后续接入帆软 KnowHow 案例库。

```env
KNOWHOW_API_KEY=your-knowhow-token
KNOWHOW_API_BASE_URL=https://your-knowhow-host
KNOWHOW_API_SEARCH_PATH=/api/search
KNOWHOW_API_TOP_N=5
KNOWHOW_API_PROVIDER=
```

配置完成后重启后端，并打开：

```text
http://localhost:5173/config
```

配置说明详见 [docs/model-api-config-guide.md](docs/model-api-config-guide.md)。

## 项目结构

```text
jasper_solution/
├── frontend/
│   └── src/
│       ├── pages/              # 页面：项目、上传、Demo驾驶舱、案例、方案、飞书、配置
│       ├── components/         # 布局与 AI 对话面板
│       ├── api/                # 前端 API 客户端
│       └── styles/             # 全局样式
├── backend/
│   └── src/
│       ├── routes/             # Express 路由
│       ├── services/           # 业务服务
│       ├── adapters/           # 模型、KnowHow、飞书等第三方适配器
│       ├── types/              # 共享类型定义
│       └── utils/              # 工具函数
├── storage/
│   └── cases-cache/            # mock KnowHow 案例库，可提交
├── docs/                       # API、飞书、模型配置文档
├── .env.example
├── .env.ai.example
└── README.md
```

本地运行数据不会提交：

- `.env.ai`
- `storage/workspaces/`
- `storage/uploads/`
- `storage/generated-images/`
- `storage/generated-docs/`
- `node_modules/`

## 关键后端接口

### 项目空间

```http
GET  /api/workspaces
POST /api/workspaces
GET  /api/workspaces/:id
```

### 文件上传

```http
GET  /api/workspaces/:workspaceId/uploads
POST /api/workspaces/:workspaceId/uploads
POST /api/workspaces/:workspaceId/uploads/:fileId/parse
```

### AI 对话

```http
GET  /api/workspaces/:workspaceId/ai-chat/messages
POST /api/workspaces/:workspaceId/ai-chat/messages
POST /api/workspaces/:workspaceId/ai-chat/apply
```

### Demo 驾驶舱

```http
GET  /api/workspaces/:workspaceId/dashboard
GET  /api/workspaces/:workspaceId/dashboard/prompt
PUT  /api/workspaces/:workspaceId/dashboard/prompt
POST /api/workspaces/:workspaceId/dashboard/generate
```

完整接口说明见 [docs/api-contract.md](docs/api-contract.md)。

## Adapter 说明

所有外部能力都集中在 `backend/src/adapters/`：

| Adapter | 文件 | 说明 |
| --- | --- | --- |
| 对话/文本模型 | `llmAdapter.ts` | OpenAI-compatible chat completions，未配置时 mock |
| 生图模型 | `imageModelAdapter.ts` | OpenAI-compatible image generations，未配置时生成本地 4K PNG mock 图 |
| KnowHow 案例库 | `knowhowAdapter.ts` | 当前本地 mock，后续替换为真实 API |
| 飞书文档 | `feishuCliAdapter.ts` | 当前 mock，后续接飞书 CLI |

## 开发脚本

```bash
npm run dev                # 同时启动前后端
npm run dev:frontend       # 仅启动前端
npm run dev:backend        # 仅启动后端
npm run typecheck          # 前后端 TypeScript 检查
npm run build              # 前后端构建
```

## 当前限制

- `docx/ppt/pptx/png` 解析仍是占位逻辑，`txt` 解析可用。
- KnowHow API、飞书文档当前为 mock。
- Demo 驾驶舱真实生图依赖你本地 `.env.ai` 配置。
- 生图模型的 3840x2160 支持取决于实际模型服务商；adapter 已按固定规格发起请求。

## 安全说明

不要提交真实 API Key。仓库只提交 `.env.ai.example`，本地 `.env.ai` 已忽略。
