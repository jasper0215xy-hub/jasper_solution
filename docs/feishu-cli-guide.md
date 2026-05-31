# 飞书 CLI 真实接入指南

## 当前状态

`feishuCliAdapter.ts` 目前使用 **Mock 模式**，返回模拟的文档链接。

## 真实接入步骤

### 1. 安装 lark-cli

```bash
npm install -g lark-cli
# 或使用 npx
npx lark-cli --version
```

### 2. 认证登录

```bash
lark-cli auth login
```

### 3. 在 feishuCliAdapter.ts 中实现 realCreateDoc

```typescript
import { execSync } from 'child_process';

async function realCreateDoc(workspace: Workspace, solution: Solution): Promise<FeishuDocResult> {
  // 构建文档内容
  const content = buildDocContent(workspace, solution);

  // 写临时文件
  const tmpFile = `/tmp/solution-${workspace.id}.md`;
  fs.writeFileSync(tmpFile, content, 'utf-8');

  // 调用 lark-cli 创建文档
  const result = execSync(
    `lark-cli docs +create --title "${solution.title}" --file "${tmpFile}"`,
    { encoding: 'utf-8' }
  );

  const parsed = JSON.parse(result);
  return { docUrl: parsed.url, docToken: parsed.token };
}
```

### 4. 设置环境变量

```bash
export FEISHU_USE_REAL=true
```

### 文档内容结构顺序

1. 标题
2. 项目背景
3. 客户需求
4. 推荐方案总览
5. KnowHow 案例参考
6. Demo驾驶舱图
7. 流程图（Mermaid）
8. 解决方案架构图（Mermaid）
9. 实施建议
