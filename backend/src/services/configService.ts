interface ConfigItem {
  key: string;
  label: string;
  configured: boolean;
  required: boolean;
}

interface ConfigGroup {
  id: 'chat' | 'image' | 'knowhow';
  title: string;
  mode: 'mock' | 'ready';
  items: ConfigItem[];
}

function hasValue(key: string): boolean {
  return Boolean((process.env[key] ?? '').trim());
}

function item(key: string, label: string, required = true): ConfigItem {
  return { key, label, required, configured: hasValue(key) };
}

function groupMode(items: ConfigItem[]): 'mock' | 'ready' {
  return items.filter((config) => config.required).every((config) => config.configured) ? 'ready' : 'mock';
}

export function getConfigStatus(): { groups: ConfigGroup[]; envFile: string; note: string } {
  const chatItems = [
    item('AI_CHAT_MODEL_PROVIDER', '对话模型服务商', false),
    item('AI_CHAT_MODEL_API_KEY', '对话模型 API Key'),
    item('AI_CHAT_MODEL_BASE_URL', '对话模型 Base URL'),
    item('AI_CHAT_MODEL_NAME', '对话模型名称'),
  ];
  const imageItems = [
    item('IMAGE_MODEL_PROVIDER', '生图模型服务商', false),
    item('IMAGE_MODEL_API_KEY', '生图模型 API Key'),
    item('IMAGE_MODEL_BASE_URL', '生图模型 Base URL'),
    item('IMAGE_MODEL_NAME', '生图模型名称'),
  ];
  const knowhowItems = [
    item('KNOWHOW_API_PROVIDER', 'KnowHow API 服务商', false),
    item('KNOWHOW_API_KEY', 'KnowHow API Key'),
    item('KNOWHOW_API_BASE_URL', 'KnowHow API Base URL'),
    item('KNOWHOW_API_SEARCH_PATH', 'KnowHow 搜索路径'),
    item('KNOWHOW_API_TOP_N', 'KnowHow 返回数量', false),
  ];

  return {
    envFile: '.env.ai',
    note: '未配置完整必填项时，系统自动使用 mock adapter；填好 .env.ai 并重启后端后进入 ready 状态。',
    groups: [
      { id: 'chat', title: 'AI 对话模型', mode: groupMode(chatItems), items: chatItems },
      { id: 'image', title: 'AI 生图模型', mode: groupMode(imageItems), items: imageItems },
      { id: 'knowhow', title: '帆软 KnowHow API', mode: groupMode(knowhowItems), items: knowhowItems },
    ],
  };
}
