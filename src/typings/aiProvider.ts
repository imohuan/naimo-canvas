import type * as z from 'zod'

/**
 * AI Provider 类型枚举
 */
export const ProviderTypeSchema = z.enum([
  'openai',
  'openai-response',
  'anthropic',
  'gemini',
  'qwenlm',
  'azure-openai',
  'vertexai',
  'mistral',
  'aws-bedrock',
  'vertex-anthropic',
  'new-api'
])

export type ProviderType = z.infer<typeof ProviderTypeSchema>

/**
 * AI Provider API 选项
 */
export type ProviderApiOptions = {
  /** 是否不支持 message 的 content 为数组类型 */
  isNotSupportArrayContent?: boolean
  /** 是否不支持 stream_options 参数 */
  isNotSupportStreamOptions?: boolean
  /** 是否支持 message 的 role 为 developer */
  isSupportDeveloperRole?: boolean
  /** 是否支持 service_tier 参数 (仅 OpenAI) */
  isSupportServiceTier?: boolean
  /** 是否不支持 enable_thinking 参数 */
  isNotSupportEnableThinking?: boolean
}

/**
 * AI 模型定义
 */
export interface AIModel {
  /** 模型 ID */
  id: string
  /** 模型名称 */
  name: string
  /** 是否启用 */
  enabled?: boolean
  /** 模型描述 */
  description?: string
  /** 上下文长度 */
  contextLength?: number
  /** 是否支持视觉 */
  vision?: boolean
  /** 是否支持工具调用 */
  toolCall?: boolean
  /** 额外配置 */
  extra?: Record<string, unknown>
}

/**
 * AI Provider 提供商配置
 */
export interface AIProvider {
  /** Provider ID */
  id: string
  /** Provider 类型 */
  type: ProviderType
  /** Provider 名称 */
  name: string
  /** API Key */
  apiKey: string
  /** API Host */
  apiHost: string
  /** Anthropic API Host (用于支持 Anthropic 兼容接口) */
  anthropicApiHost?: string
  /** API Version */
  apiVersion?: string
  /** 支持的模型列表 */
  models: AIModel[]
  /** 是否启用 */
  enabled?: boolean
  /** 是否为系统内置 Provider */
  isSystem?: boolean
  /** 是否已认证 */
  isAuthed?: boolean
  /** API 选项 */
  apiOptions?: ProviderApiOptions
  /** 认证类型 */
  authType?: 'apiKey' | 'oauth'
  /** 备注 */
  notes?: string
  /** 额外 HTTP Headers */
  extra_headers?: Record<string, string>
}

/**
 * 系统内置 Provider ID 枚举
 */
export const SystemProviderIds = {
  // 国内 AI 厂商
  cherryin: 'cherryin',
  silicon: 'silicon',
  aihubmix: 'aihubmix',
  ocoolai: 'ocoolai',
  deepseek: 'deepseek',
  ppio: 'ppio',
  alayanew: 'alayanew',
  qiniu: 'qiniu',
  dmxapi: 'dmxapi',
  burncloud: 'burncloud',
  tokenflux: 'tokenflux',
  '302ai': '302ai',
  cephalon: 'cephalon',
  lanyun: 'lanyun',
  ph8: 'ph8',
  zhipu: 'zhipu',
  yi: 'yi',
  moonshot: 'moonshot',
  baichuan: 'baichuan',
  dashscope: 'dashscope',
  stepfun: 'stepfun',
  doubao: 'doubao',
  infini: 'infini',
  minimax: 'minimax',
  modelscope: 'modelscope',
  xirang: 'xirang',
  hunyuan: 'hunyuan',
  'tencent-cloud-ti': 'tencent-cloud-ti',
  'baidu-cloud': 'baidu-cloud',
  longcat: 'longcat',
  
  // 国际 AI 厂商
  openai: 'openai',
  anthropic: 'anthropic',
  'azure-openai': 'azure-openai',
  gemini: 'gemini',
  vertexai: 'vertexai',
  github: 'github',
  copilot: 'copilot',
  groq: 'groq',
  together: 'together',
  fireworks: 'fireworks',
  nvidia: 'nvidia',
  grok: 'grok',
  hyperbolic: 'hyperbolic',
  mistral: 'mistral',
  jina: 'jina',
  perplexity: 'perplexity',
  gpustack: 'gpustack',
  voyageai: 'voyageai',
  'aws-bedrock': 'aws-bedrock',
  poe: 'poe',
  aionly: 'aionly',
  huggingface: 'huggingface',
  
  // 开源/本地部署
  openrouter: 'openrouter',
  ollama: 'ollama',
  'new-api': 'new-api',
  lmstudio: 'lmstudio',
  ovms: 'ovms'
} as const

export type SystemProviderId = keyof typeof SystemProviderIds

/**
 * 判断是否为系统 Provider ID
 */
export const isSystemProviderId = (id: string): id is SystemProviderId => {
  return Object.hasOwn(SystemProviderIds, id)
}

/**
 * 系统 Provider 类型 (必须是内置的)
 */
export type SystemProvider = AIProvider & {
  id: SystemProviderId
  isSystem: true
}

/**
 * 判断是否为系统 Provider
 */
export const isSystemProvider = (provider: AIProvider): provider is SystemProvider => {
  return isSystemProviderId(provider.id) && !!provider.isSystem
}

/**
 * 聊天消息角色
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

/**
 * 聊天消息
 */
export interface ChatMessage {
  /** 消息 ID */
  id: string
  /** 消息角色 */
  role: MessageRole
  /** 消息内容 */
  content: string
  /** 时间戳 */
  timestamp: number
  /** 模型名称 */
  model?: string
  /** 额外数据 */
  extra?: Record<string, unknown>
}

/**
 * AI 聊天请求参数
 */
export interface AIChatRequest {
  /** 使用的 Provider ID */
  providerId: string
  /** 使用的模型 ID */
  modelId: string
  /** 消息历史 */
  messages: ChatMessage[]
  /** 温度 (0-2) */
  temperature?: number
  /** Top P (0-1) */
  topP?: number
  /** 最大 Token 数 */
  maxTokens?: number
  /** 是否流式返回 */
  stream?: boolean
  /** 额外参数 */
  extra?: Record<string, unknown>
}

/**
 * AI 聊天响应
 */
export interface AIChatResponse {
  /** 响应内容 */
  content: string
  /** 使用的模型 */
  model: string
  /** 完成原因 */
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter'
  /** Token 使用统计 */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

