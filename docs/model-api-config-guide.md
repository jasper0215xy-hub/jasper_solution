# 模型与 KnowHow API 配置指南

本项目默认使用 mock adapter。你还没配置 API 时，功能可以先跑通工程框架；配置完成后再把 adapter 切换到真实调用。

## 1. 创建本地配置文件

在项目根目录执行：

```bash
cp .env.ai.example .env.ai
```

`.env.ai` 已写入 `.gitignore`，不要提交到 GitHub。

## 2. 对话模型配置

用于右侧 AI 对话助手，以及后续辅助改方案、改驾驶舱 prompt。

需要你提供：

- API Key
- Base URL
- 模型名称
- 服务商名称可选；不填时默认按 OpenAI-compatible 接口适配

填写：

```env
AI_CHAT_MODEL_PROVIDER=
AI_CHAT_MODEL_API_KEY=
AI_CHAT_MODEL_BASE_URL=
AI_CHAT_MODEL_NAME=
```

## 3. 生图模型配置

用于根据客户需求文件生成 Demo 驾驶舱图。固定规格：

- 16:9
- 3840x2160
- PNG

需要你提供：

- API Key
- Base URL
- 生图模型名称
- 生图服务商名称可选；不填时默认按 OpenAI-compatible 接口适配
- 如果服务商有特殊入参，例如 size、response_format、任务轮询接口，也需要补充给开发者

填写：

```env
IMAGE_MODEL_PROVIDER=
IMAGE_MODEL_API_KEY=
IMAGE_MODEL_BASE_URL=
IMAGE_MODEL_NAME=
```

## 4. KnowHow API 配置

用于从帆软 KnowHow 案例库检索匹配案例。

需要你提供：

- API Key 或访问 Token
- Base URL
- 搜索接口路径
- 请求方法和参数结构
- 返回字段结构
- API 服务商名称可选，只在需要区分多套 KnowHow 协议时使用

填写：

```env
KNOWHOW_API_PROVIDER=
KNOWHOW_API_KEY=
KNOWHOW_API_BASE_URL=
KNOWHOW_API_SEARCH_PATH=
KNOWHOW_API_TOP_N=5
```

## 5. 配置后重启

保存 `.env.ai` 后重启后端：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:5173/config
```

确认“AI 对话模型 / AI 生图模型 / 帆软 KnowHow API”状态。

## 6. 当前 adapter 位置

- 对话模型：`backend/src/adapters/llmAdapter.ts`
- 生图模型：`backend/src/adapters/imageModelAdapter.ts`
- KnowHow API：`backend/src/adapters/knowhowAdapter.ts`

当前真实调用函数仍是框架入口，等 API 信息确认后补具体协议适配。
