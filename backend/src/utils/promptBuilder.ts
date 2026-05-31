import { Workspace, KnowHowCase, ParsedSection } from '../types/index';

export function buildSolutionPrompt(
  workspace: Workspace,
  sections: ParsedSection[],
  cases: KnowHowCase[]
): string {
  const sectionText = sections
    .slice(0, 10)
    .map((s) => `[文件P${s.pageOrSlide}] ${s.text.slice(0, 200)}`)
    .join('\n');
  const caseText = cases
    .map((c) => `案例:${c.title} 行业:${c.industry} 场景:${c.scenario}`)
    .join('\n');

  return `
你是帆软软件的售前方案专家。根据以下信息生成一份结构化的售前方案（JSON格式）。

【客户信息】
项目名称: ${workspace.name}
客户名称: ${workspace.customerName}
行业: ${workspace.industry}
项目背景: ${workspace.background}
需求摘要: ${workspace.requirementSummary}

【上传文件摘要】
${sectionText || '(暂无上传文件)'}

【参考案例】
${caseText || '(暂无参考案例)'}

请生成包含以下字段的JSON：
{
  "title": "方案标题",
  "summary": "方案总览（200字以内）",
  "chapters": [
    { "id": "c1", "order": 1, "heading": "章节标题", "content": "正文内容", "sourceReferences": [] }
  ]
}
章节建议：客户背景与需求、帆软解决方案架构、核心功能与价值、成功案例参考、实施规划与保障。
  `.trim();
}

export function buildDiagramPrompt(
  workspace: Workspace,
  solutionSummary: string
): string {
  return `
你是帆软售前架构师。根据以下客户方案信息，生成Mermaid格式的业务架构图。

客户: ${workspace.customerName}
行业: ${workspace.industry}
需求: ${workspace.requirementSummary}
方案概述: ${solutionSummary}

图中必须体现：
1. 客户现有业务系统（ERP/MES/CRM等）
2. 帆软产品层（FineReport/FineBI/FineDataLink）
3. 数据源层（数据库/API/文件）
4. 业务用户访问路径
5. 数据处理链路
6. 权限与组织体系
7. 部署环境（私有部署/云）

请只输出Mermaid代码，不要包含其他说明。
  `.trim();
}
