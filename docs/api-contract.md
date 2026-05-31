# API Contract

## Base URL: `http://localhost:3002/api`

---

## Workspaces

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces` | List all workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:id` | Get workspace |

## Uploads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/uploads` | List files |
| POST | `/workspaces/:wid/uploads` | Upload file (multipart) |
| POST | `/workspaces/:wid/uploads/:fid/parse` | Parse file |

## Demo Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/dashboard` | Get generated dashboard |
| GET | `/workspaces/:wid/dashboard/prompt` | Get confirmed dashboard prompt |
| PUT | `/workspaces/:wid/dashboard/prompt` | Save confirmed dashboard prompt |
| POST | `/workspaces/:wid/dashboard/generate` | Generate dashboard image from confirmed prompt |

## Cases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/cases/matches` | Get current matches |
| POST | `/workspaces/:wid/cases/match` | Run case matching |
| POST | `/workspaces/:wid/cases/select` | Save case selection |

## Solution

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/solution` | Get solution |
| POST | `/workspaces/:wid/solution/generate` | Generate solution |
| PUT | `/workspaces/:wid/solution` | Update solution |

## Feishu

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/feishu/doc` | Get Feishu doc |
| POST | `/workspaces/:wid/feishu/doc` | Generate Feishu doc |

## AI Chat

| Method | Path | Description |
|--------|------|-------------|
| GET | `/workspaces/:wid/ai-chat/messages` | Get chat history |
| POST | `/workspaces/:wid/ai-chat/messages` | Send message |
| POST | `/workspaces/:wid/ai-chat/apply` | Apply AI patch |
