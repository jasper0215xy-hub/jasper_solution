import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  DashboardAlert,
  DashboardChart,
  DashboardFilter,
  DashboardInsight,
  DashboardKpi,
  DashboardPromptDraft,
  DemoDashboard,
  ParsedSection,
  UploadedFile,
} from '../types/index';
import { generateImage } from '../adapters/imageModelAdapter';
import { listFiles } from './uploadService';
import { getWorkspace } from './workspaceService';

const WS_ROOT = path.resolve(process.cwd(), '../storage/workspaces');
const IMAGE_ROOT = path.resolve(process.cwd(), '../storage/generated-images');

function dashboardFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'dashboard.json');
}

function promptDraftFile(workspaceId: string): string {
  return path.join(WS_ROOT, workspaceId, 'dashboard-prompt.json');
}

export function getDashboard(workspaceId: string): DemoDashboard | null {
  const f = dashboardFile(workspaceId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as DemoDashboard;
}

export function getDashboardPromptDraft(workspaceId: string): DashboardPromptDraft | null {
  const f = promptDraftFile(workspaceId);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf-8')) as DashboardPromptDraft;
}

function saveDashboard(dashboard: DemoDashboard): void {
  fs.mkdirSync(path.dirname(dashboardFile(dashboard.workspaceId)), { recursive: true });
  fs.writeFileSync(dashboardFile(dashboard.workspaceId), JSON.stringify(dashboard, null, 2), 'utf-8');
}

export function saveDashboardPromptDraft(
  workspaceId: string,
  imagePrompt: string,
  sourceFileIds: string[],
  title: string,
  summary: string
): DashboardPromptDraft {
  const now = new Date().toISOString();
  const draft: DashboardPromptDraft = {
    workspaceId,
    imagePrompt,
    sourceFileIds,
    title,
    summary,
    confirmedAt: now,
    updatedAt: now,
  };
  fs.mkdirSync(path.dirname(promptDraftFile(workspaceId)), { recursive: true });
  fs.writeFileSync(promptDraftFile(workspaceId), JSON.stringify(draft, null, 2), 'utf-8');
  return draft;
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function pickRequirementSource(files: UploadedFile[]): { files: UploadedFile[]; sections: ParsedSection[] } {
  const parsed = files.filter((file) => file.status === 'parsed' && file.parsedSections?.length);
  const sorted = parsed.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const selected = sorted.slice(0, 3);
  return {
    files: selected,
    sections: selected.flatMap((file) => file.parsedSections ?? []),
  };
}

function inferProfile(text: string, workspaceIndustry?: string): {
  industry: string;
  theme: string;
  audience: string;
  metrics: string[];
} {
  const lower = text.toLowerCase();
  if (includesAny(lower, ['制造', '生产', 'mes', '良率', '设备', '工单', '产线', 'oee'])) {
    return {
      industry: workspaceIndustry || '制造业',
      theme: '制造经营驾驶舱',
      audience: '工厂总经理 / 生产运营负责人',
      metrics: ['生产达成率', '设备 OEE', '一次良率', '在制品周转', '交付准时率', '异常工单数'],
    };
  }
  if (includesAny(lower, ['零售', '门店', '会员', '客单价', '库存周转', '坪效'])) {
    return {
      industry: workspaceIndustry || '零售行业',
      theme: '零售经营驾驶舱',
      audience: '零售运营负责人 / 区域经理',
      metrics: ['销售额', '毛利率', '客单价', '会员复购率', '库存周转天数', '门店达成率'],
    };
  }
  if (includesAny(lower, ['财务', '预算', '费用', '利润', '现金流', '应收'])) {
    return {
      industry: workspaceIndustry || '企业财务',
      theme: '财务经营驾驶舱',
      audience: 'CFO / 财务共享负责人',
      metrics: ['营业收入', '净利率', '费用率', '现金流余额', '应收账款周转', '预算执行率'],
    };
  }
  if (includesAny(lower, ['销售', '商机', '线索', '回款', '客户', '合同'])) {
    return {
      industry: workspaceIndustry || '销售管理',
      theme: '销售经营驾驶舱',
      audience: '销售总监 / 大区负责人',
      metrics: ['签约金额', '商机转化率', '回款达成率', '重点客户覆盖', '销售预测准确率', '合同风险数'],
    };
  }
  if (includesAny(lower, ['供应链', '采购', '仓储', '物流', '库存', '供应商'])) {
    return {
      industry: workspaceIndustry || '供应链',
      theme: '供应链运营驾驶舱',
      audience: '供应链负责人 / 计划经理',
      metrics: ['库存周转', '采购准时率', '缺料风险', '物流准时率', '供应商履约率', '安全库存覆盖'],
    };
  }
  return {
    industry: workspaceIndustry || '综合经营',
    theme: '经营分析驾驶舱',
    audience: '经营管理层 / 业务负责人',
    metrics: ['收入达成率', '利润率', '客户满意度', '任务完成率', '风险事项', '运营效率'],
  };
}

function buildKpis(metrics: string[], text: string): DashboardKpi[] {
  const lower = text.toLowerCase();
  const warningBias = includesAny(lower, ['预警', '风险', '逾期', '异常', '瓶颈', '不足']);
  const values = ['92.6', '86.4', '97.2', '18.5', '7', '104.8'];
  const units = ['%', '%', '%', '天', '项', '%'];
  return metrics.slice(0, 6).map((metric, index) => ({
    id: uuid(),
    label: metric,
    value: values[index],
    unit: units[index],
    trend: index % 2 === 0 ? '+3.2%' : warningBias ? '-1.8%' : '+1.1%',
    status: index === 4 || (warningBias && index === 3) ? 'warning' : 'good',
    rationale: `来自需求文件对“${metric}”的关注，适合作为首页核心指标。`,
  }));
}

function buildFilters(profile: ReturnType<typeof inferProfile>): DashboardFilter[] {
  return [
    { id: uuid(), label: '时间范围', value: '本月', options: ['本日', '本周', '本月', '本季度', '全年'] },
    { id: uuid(), label: profile.industry.includes('制造') ? '工厂/产线' : '组织范围', value: '全部', options: ['全部', '华东', '华南', '华北', '重点区域'] },
    { id: uuid(), label: '业务主题', value: profile.theme, options: [profile.theme, '经营总览', '异常预警', '趋势分析'] },
  ];
}

function buildCharts(metrics: string[], text: string): DashboardChart[] {
  const shortMetrics = metrics.slice(0, 5);
  const hasRisk = includesAny(text.toLowerCase(), ['风险', '预警', '异常', '逾期']);
  return [
    {
      id: uuid(),
      type: 'bar',
      title: `${shortMetrics[0]}分布`,
      description: '按区域/组织拆解当前核心指标表现。',
      unit: '%',
      data: [
        { label: '华东', value: 96 },
        { label: '华南', value: 91 },
        { label: '华北', value: 88 },
        { label: '西南', value: 84 },
      ],
    },
    {
      id: uuid(),
      type: 'line',
      title: `${shortMetrics[1]}趋势`,
      description: '展示近 6 个月经营变化趋势。',
      unit: '%',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'].map((label, index) => ({
        label,
        value: [78, 81, 83, 86, 85, 89][index],
      })),
    },
    {
      id: uuid(),
      type: 'donut',
      title: `${shortMetrics[2]}结构`,
      description: '按业务类型展示结构占比。',
      unit: '%',
      data: [
        { label: '重点业务', value: 42 },
        { label: '常规业务', value: 35 },
        { label: '长尾业务', value: 23 },
      ],
    },
    {
      id: uuid(),
      type: 'table',
      title: hasRisk ? '重点异常清单' : '重点事项跟踪',
      description: '面向管理层的可追踪问题列表。',
      unit: '',
      data: [],
      columns: ['事项', '负责人', '状态', '影响'],
      rows: [
        [shortMetrics[3] ?? '运营效率', '运营部', hasRisk ? '预警' : '推进中', hasRisk ? '高' : '中'],
        [shortMetrics[4] ?? '风险事项', '业务部', '跟进中', '中'],
        [shortMetrics[0], '数据团队', '已同步', '低'],
      ],
    },
  ];
}

function buildAlerts(metrics: string[], text: string): DashboardAlert[] {
  const lower = text.toLowerCase();
  const riskWord = includesAny(lower, ['逾期', '延迟']) ? '逾期' : includesAny(lower, ['库存', '缺料']) ? '库存' : '异常';
  return [
    {
      id: uuid(),
      level: 'high',
      title: `${metrics[4] ?? '风险事项'}需要优先处理`,
      description: `需求文件提到${riskWord}或预警诉求，建议在驾驶舱首页暴露红色提醒。`,
      owner: '业务负责人',
    },
    {
      id: uuid(),
      level: 'medium',
      title: `${metrics[1] ?? '核心指标'}低于目标线`,
      description: '部分组织表现低于管理目标，需要支持下钻定位责任区域。',
      owner: '运营分析岗',
    },
    {
      id: uuid(),
      level: 'low',
      title: '数据口径待统一',
      description: '上线前需确认数据源、统计周期与组织权限口径。',
      owner: '数据治理岗',
    },
  ];
}

function buildInsights(profile: ReturnType<typeof inferProfile>, metrics: string[]): DashboardInsight[] {
  return [
    {
      id: uuid(),
      title: '首页聚焦管理动作',
      content: `${profile.theme}应先突出 ${metrics.slice(0, 3).join('、')}，让${profile.audience}快速判断经营状态。`,
    },
    {
      id: uuid(),
      title: '支持从总览到明细下钻',
      content: '建议从指标卡进入区域、组织、客户或产线明细，支撑售前 demo 中的追因路径。',
    },
    {
      id: uuid(),
      title: '预警要绑定责任闭环',
      content: '预警区需要展示负责人、影响等级和处理状态，体现从看数到管事的价值。',
    },
  ];
}

function buildDashboardImagePrompt(
  workspaceName: string,
  profile: ReturnType<typeof inferProfile>,
  kpis: DashboardKpi[],
  charts: DashboardChart[],
  alerts: DashboardAlert[],
  sourceSummary: string
): string {
  return [
    '生成一张企业级 BI Demo 驾驶舱大屏截图，必须是完整可交付的视觉稿，不要生成代码，不要生成网页说明。',
    '画面比例固定 16:9，分辨率 3840x2160，输出 PNG。',
    `驾驶舱标题：${workspaceName}${profile.theme}`,
    `行业与受众：${profile.industry}，${profile.audience}`,
    `核心指标卡：${kpis.map((kpi) => `${kpi.label} ${kpi.value}${kpi.unit}`).join('、')}`,
    `图表模块：${charts.map((chart) => `${chart.title}(${chart.type})`).join('、')}`,
    `预警事项：${alerts.map((alert) => alert.title).join('、')}`,
    `客户需求摘要：${sourceSummary.slice(0, 700)}`,
    '视觉要求：专业售前演示风格，浅色企业管理驾驶舱，顶部标题栏，筛选器，六个 KPI 指标卡，四个图表区，右侧预警和洞察区域。',
    '图表要像真实数据可视化界面，包含柱状图、折线图、环形占比图、明细表格；文字使用中文业务标签，界面清晰紧凑。',
    '不要出现“mock”“占位图”“示意”字样，不要出现代码编辑器、前后端、数据库工程架构等本应用开发信息。',
  ].join('\n');
}

function buildDashboardBlueprint(workspaceId: string): {
  workspace: NonNullable<ReturnType<typeof getWorkspace>>;
  files: UploadedFile[];
  sections: ParsedSection[];
  requirementText: string;
  profile: ReturnType<typeof inferProfile>;
  kpis: DashboardKpi[];
  charts: DashboardChart[];
  alerts: DashboardAlert[];
  imagePrompt: string;
} {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const { files, sections } = pickRequirementSource(listFiles(workspaceId));
  if (!sections.length) {
    throw new Error('请先上传并解析客户需求文件，再生成 Demo驾驶舱。');
  }

  const requirementText = sections.map((section) => section.text).join('\n');
  const profile = inferProfile(`${workspace.industry}\n${workspace.requirementSummary}\n${requirementText}`, workspace.industry);
  const now = new Date().toISOString();
  const kpis = buildKpis(profile.metrics, requirementText);
  const charts = buildCharts(profile.metrics, requirementText);
  const alerts = buildAlerts(profile.metrics, requirementText);
  const imagePrompt = buildDashboardImagePrompt(
    workspace.customerName || workspace.name,
    profile,
    kpis,
    charts,
    alerts,
    requirementText
  );
  return { workspace, files, sections, requirementText, profile, kpis, charts, alerts, imagePrompt };
}

export function buildDashboardPromptSuggestion(workspaceId: string, userInstruction?: string): DashboardPromptDraft {
  const { workspace, files, profile, kpis, charts, alerts, requirementText, imagePrompt } = buildDashboardBlueprint(workspaceId);
  const adjustedPrompt = userInstruction
    ? `${imagePrompt}\n\n用户确认/调整要求：${userInstruction}`
    : imagePrompt;

  return {
    workspaceId,
    imagePrompt: adjustedPrompt,
    sourceFileIds: files.map((file) => file.id),
    title: `${workspace.customerName || workspace.name}${profile.theme}`,
    summary: [
      `受众：${profile.audience}`,
      `核心指标：${kpis.map((kpi) => kpi.label).join('、')}`,
      `图表：${charts.map((chart) => chart.title).join('、')}`,
      `预警：${alerts.map((alert) => alert.title).join('、')}`,
      `需求摘要：${requirementText.slice(0, 220)}`,
    ].join('\n'),
    confirmedAt: '',
    updatedAt: new Date().toISOString(),
  };
}

export async function generateDashboard(workspaceId: string): Promise<DemoDashboard> {
  const promptDraft = getDashboardPromptDraft(workspaceId);
  if (!promptDraft) {
    throw new Error('请先在右侧 AI 对话中确认 Demo驾驶舱内容，并点击“应用修改”保存提示词。');
  }

  const { workspace, files, profile, kpis, charts, alerts } = buildDashboardBlueprint(workspaceId);
  const imagePrompt = promptDraft.imagePrompt;
  const now = new Date().toISOString();
  const previous = getDashboard(workspaceId);
  const priorHistory = previous?.imageHistory
    ?? (previous?.generatedImage ? [{ url: previous.generatedImage.url, createdAt: previous.updatedAt }] : []);
  const imageId = `dashboard_${uuid()}`;
  const image = await generateImage(
    { prompt: imagePrompt, width: 3840, height: 2160, format: 'png' },
    path.join(IMAGE_ROOT, workspaceId),
    imageId
  );
  const dashboard: DemoDashboard = {
    id: uuid(),
    workspaceId,
    title: promptDraft.title || `${workspace.customerName || workspace.name}${profile.theme}`,
    subtitle: `面向${profile.audience}，基于 ${files.map((file) => file.originalName).join('、')} 和已确认提示词生成的售前演示驾驶舱。`,
    sourceFileIds: promptDraft.sourceFileIds.length ? promptDraft.sourceFileIds : files.map((file) => file.id),
    industry: profile.industry,
    audience: profile.audience,
    imagePrompt,
    generatedImage: {
      ...image,
      width: 3840,
      height: 2160,
      format: 'png',
      aspectRatio: '16:9',
    },
    imageHistory: [...priorHistory, { url: image.url, createdAt: now }],
    filters: buildFilters(profile),
    kpis,
    charts,
    alerts,
    insights: buildInsights(profile, profile.metrics),
    layout: [
      ...kpis.map((kpi, order) => ({ id: kpi.id, area: 'kpi' as const, order })),
      ...charts.map((chart, order) => ({ id: chart.id, area: 'main' as const, order })),
    ],
    createdAt: now,
    updatedAt: now,
  };

  saveDashboard(dashboard);
  return dashboard;
}
