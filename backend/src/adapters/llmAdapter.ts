import * as dotenv from 'dotenv';
import * as path from 'path';
import { logger } from '../utils/logger';

// Load .env.ai from project root
dotenv.config({ path: path.resolve(process.cwd(), '../.env.ai') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.ai') });

export interface LLMConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelName: string;
}

export interface LLMResponse {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

function getTextConfig(): LLMConfig {
  return {
    provider: process.env.TEXT_MODEL_PROVIDER || 'openai-compatible',
    apiKey: process.env.TEXT_MODEL_API_KEY ?? '',
    baseUrl: process.env.TEXT_MODEL_BASE_URL ?? '',
    modelName: process.env.TEXT_MODEL_NAME ?? 'mock-text',
  };
}

function getChatConfig(): LLMConfig {
  return {
    provider: process.env.AI_CHAT_MODEL_PROVIDER || 'openai-compatible',
    apiKey: process.env.AI_CHAT_MODEL_API_KEY ?? '',
    baseUrl: process.env.AI_CHAT_MODEL_BASE_URL ?? '',
    modelName: process.env.AI_CHAT_MODEL_NAME ?? 'mock-chat',
  };
}

// ─── Mock LLM Adapter ─────────────────────────────────────────────────────────
// When TEXT_MODEL_PROVIDER is not set or is 'mock', this returns deterministic
// mock responses. To use a real LLM, set .env.ai and replace the real* functions.

async function mockTextCompletion(prompt: string): Promise<LLMResponse> {
  logger.info('[mockLLMAdapter] text completion called (mock)');
  await new Promise((r) => setTimeout(r, 300)); // simulate latency

  // Detect what kind of prompt this is
  if (prompt.includes('生成包含以下字段的JSON')) {
    return {
      content: JSON.stringify({
        title: '帆软数字化报表与分析平台解决方案',
        summary:
          '基于帆软 FineReport + FineBI 构建统一数据分析平台，打通企业各业务系统数据孤岛，实现从数据采集、治理到可视化分析的全链路数字化升级，支撑管理层决策与一线业务效率提升。',
        chapters: [
          {
            id: 'c1',
            order: 1,
            heading: '客户背景与痛点分析',
            content:
              '客户当前面临多系统数据分散、报表制作效率低、缺乏自助分析能力等核心痛点。各部门使用 Excel 手工汇总数据，月报周期长达 5-7 天，数据口径不一致导致决策延迟。',
            sourceReferences: [],
          },
          {
            id: 'c2',
            order: 2,
            heading: '帆软解决方案架构',
            content:
              '采用帆软 FineDataLink 进行数据集成与治理，FineReport 承担标准化报表与打印场景，FineBI 支撑自助探索分析，三层架构共同构成统一数据分析中台，通过决策平台提供统一门户入口。',
            sourceReferences: [],
          },
          {
            id: 'c3',
            order: 3,
            heading: '核心功能与业务价值',
            content:
              '① 数据集成：打通 ERP/MES/CRM 等 10+ 系统，实现 T+1 数据更新；② 标准报表：覆盖财务、生产、销售等 200+ 报表场景；③ 自助分析：业务人员自助拖拽分析，降低 IT 依赖；④ 移动端：支持 APP/小程序访问，随时掌握经营动态。',
            sourceReferences: [],
          },
          {
            id: 'c4',
            order: 4,
            heading: '成功案例参考',
            content:
              '参考同行业头部客户案例：某大型制造企业通过帆软平台实现月报周期从 7 天压缩至 2 小时，数据准确率提升至 99.8%；某零售集团借助 FineBI 实现 300+ 门店实时销售分析，库存周转率提升 23%。',
            sourceReferences: [],
          },
          {
            id: 'c5',
            order: 5,
            heading: '实施规划与保障',
            content:
              '分三期实施：第一期（1-2 月）数据集成与基础报表上线；第二期（3-4 月）BI 自助分析与移动端部署；第三期（5-6 月）高级功能定制与运营培训。全程提供项目经理、实施顾问、技术支持三位一体服务保障。',
            sourceReferences: [],
          },
        ],
      }),
    };
  }

  if (prompt.includes('Mermaid')) {
    return {
      content: `graph TB
  A[数据源] --> B[FineDataLink]
  B --> C[FineReport]
  B --> D[FineBI]
  C --> E[决策平台]
  D --> E
  E --> F[用户]`,
    };
  }

  return { content: '这是一条 AI 模拟回复，实际部署时请在 .env.ai 中配置真实模型参数。' };
}

async function mockChatCompletion(
  messages: Array<{ role: string; content: string }>,
  context?: string
): Promise<LLMResponse> {
  logger.info('[mockLLMAdapter] chat completion called (mock)');
  await new Promise((r) => setTimeout(r, 400));

  const lastMsg = messages[messages.length - 1]?.content ?? '';

  if (lastMsg.includes('修改') || lastMsg.includes('调整') || lastMsg.includes('更新')) {
    return {
      content: JSON.stringify({
        type: 'suggestion',
        explanation: '我理解您的修改需求，以下是我的建议内容，请确认后应用。',
        patch: {
          target: 'solution',
          field: 'summary',
          value: '根据您的反馈优化后的方案摘要：基于帆软平台为客户构建全面数字化分析能力，实现数据驱动业务决策。',
          description: '优化方案摘要，使其更加简洁有力',
        },
      }),
    };
  }

  if (lastMsg.includes('架构图') || lastMsg.includes('流程图')) {
    return {
      content: JSON.stringify({
        type: 'suggestion',
        explanation: '我可以为您调整架构图内容，以下是建议的 Mermaid 修改，请确认后应用。',
        patch: {
          target: 'diagram',
          field: 'mermaidCode',
          value: `graph LR\n  A[用户需求] --> B[帆软平台]\n  B --> C[报表分析]\n  C --> D[业务决策]`,
          description: '简化架构图，突出核心价值链路',
        },
      }),
    };
  }

  return {
    content: JSON.stringify({
      type: 'explanation',
      explanation: `收到您的问题："${lastMsg}"。\n\n当前处于 Mock 模式，真实对话能力请在 .env.ai 中配置 AI_CHAT_MODEL_* 参数后启用。\n\n我可以帮助您：\n• 调整方案摘要和章节内容\n• 修改架构图和流程图\n• 优化案例匹配方向\n• 完善飞书文档结构`,
    }),
  };
}

// ─── Real LLM Adapter entry points ────────────────────────────────────────────
// TODO: 真实接入时，根据 config.provider 选择对应实现（OpenAI/Claude/通义等）

async function realTextCompletion(
  _config: LLMConfig,
  _prompt: string
): Promise<LLMResponse> {
  // TODO: implement real text completion
  throw new Error('Real LLM not implemented. Configure .env.ai to enable.');
}

async function realChatCompletion(
  config: LLMConfig,
  messages: Array<{ role: string; content: string }>,
  context?: string
): Promise<LLMResponse> {
  logger.info('[llmAdapter] chat completion called', {
    provider: config.provider,
    modelName: config.modelName,
  });

  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const systemPrompt = [
    '你是帆软售前工作台内的 AI 对话助手。',
    '你需要用中文简洁回答，围绕项目需求、方案、驾驶舱、案例和文档生成提供建议。',
    '如果用户明确要求修改项目数据，请优先返回 JSON：{"type":"suggestion","explanation":"...","patch":{"target":"workspace|solution|diagram","field":"...","value":...,"description":"..."}}。',
    '如果只是普通咨询，请直接自然语言回答，或返回 {"type":"explanation","explanation":"..."}。',
    context ? `当前项目上下文：\n${context}` : '',
  ].filter(Boolean).join('\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chat model request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Chat model returned empty content');
  }

  return {
    content,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
    } : undefined,
  };
}

// ─── Document / Image parsing via chat model ──────────────────────────────────
// 所有上传文件的解析（含图片 OCR）统一走对话模型：
// - 文本类（txt/excel/docx/pptx）：先在 uploadService 抽取原始文本，再交给对话模型结构化
// - 图片（png）：以 base64 传给支持视觉(vision)的对话模型识别

export interface DocumentParseInput {
  filename: string;
  text?: string;
  imageBase64?: string;
  imageMime?: string;
}

const PARSE_SYSTEM_PROMPT = [
  '你是帆软售前工作台的文档解析助手。',
  '你的任务是阅读客户提供的需求文件内容（文本或图片），提取并整理出对制作 BI 驾驶舱 / 售前方案有用的关键信息。',
  '请用简洁中文分条输出以下维度（文件中没有的维度可省略，不要编造）：',
  '1) 行业领域；2) 目标受众/使用角色；3) 关注的核心指标(KPI)；4) 期望的图表与看板模块；',
  '5) 预警/风险关注点；6) 业务痛点与目标；7) 涉及的业务系统与数据字段。',
  '只整理文件中确实出现或可合理推断的信息，保持客观，不要附加与解析无关的寒暄。',
].join('\n');

async function mockParseDocument(input: DocumentParseInput): Promise<string> {
  logger.info('[mockLLMAdapter] parse document called (mock)');
  await new Promise((r) => setTimeout(r, 200));
  if (input.imageBase64) {
    return [
      `[未配置视觉对话模型] 已接收图片“${input.filename}”，但当前为 Mock 模式，无法识别图片内容。`,
      '请在 .env.ai 配置支持视觉(vision)的 AI_CHAT_MODEL_*（如 gpt-4o）并重启后端后重新解析。',
    ].join('\n');
  }
  const text = (input.text ?? '').trim();
  // Mock 模式下直接回传抽取到的原始文本，保证 txt/excel/docx 内容仍可用于后续流程
  return text ? text.slice(0, 4000) : `[空文件] ${input.filename} 未提取到文本内容。`;
}

async function realParseDocument(config: LLMConfig, input: DocumentParseInput): Promise<string> {
  logger.info('[llmAdapter] parse document called', {
    provider: config.provider,
    modelName: config.modelName,
    mode: input.imageBase64 ? 'vision' : 'text',
  });

  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const userContent: unknown = input.imageBase64
    ? [
        {
          type: 'text',
          text: `请识别图片“${input.filename}”中的全部文字，并按系统要求整理与 BI 驾驶舱/售前方案相关的关键信息。`,
        },
        {
          type: 'image_url',
          image_url: { url: `data:${input.imageMime || 'image/png'};base64,${input.imageBase64}` },
        },
      ]
    : `文件名：${input.filename}\n以下是从该文件抽取的原始内容，请按系统要求整理：\n${(input.text ?? '').slice(0, 12000)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [
        { role: 'system', content: PARSE_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Parse model request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Parse model returned empty content');
  return content;
}

export async function parseDocumentWithLLM(input: DocumentParseInput): Promise<string> {
  const config = getChatConfig();
  const useMock = config.provider === 'mock' || !config.apiKey || !config.baseUrl || !config.modelName;
  return useMock ? mockParseDocument(input) : realParseDocument(config, input);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function textCompletion(prompt: string): Promise<LLMResponse> {
  const config = getTextConfig();
  if (config.provider === 'mock' || !config.apiKey || !config.baseUrl || !config.modelName) {
    return mockTextCompletion(prompt);
  }
  return realTextCompletion(config, prompt);
}

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  context?: string
): Promise<LLMResponse> {
  const config = getChatConfig();
  if (config.provider === 'mock' || !config.apiKey || !config.baseUrl || !config.modelName) {
    return mockChatCompletion(messages, context);
  }
  return realChatCompletion(config, messages, context);
}
