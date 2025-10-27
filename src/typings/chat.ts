/**
 * AI 聊天相关的类型定义
 */

/** 消息角色 */
export type MessageRole = "user" | "assistant" | "system";

/** 聊天消息 */
export interface ChatMessage {
  /** 消息 ID */
  id: string;
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 创建时间戳 */
  timestamp: number;
}

/** AI 提供商类型 */
export type AIProviderType = "openai" | "gemini";

/** AI 提供商配置 */
export interface AIProviderConfig {
  /** 提供商类型 */
  type: AIProviderType;
  /** API 基础 URL */
  baseURL?: string;
  /** API 密钥 */
  apiKey: string;
  /** 选中的模型 */
  model?: string;
}

/** 模型信息 */
export interface ModelInfo {
  /** 模型 ID */
  id: string;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description?: string;
}

/** 聊天请求参数 */
export interface ChatRequest {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 模型 ID */
  model: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大 tokens */
  maxTokens?: number;
}

/** 聊天响应 */
export interface ChatResponse {
  /** 响应内容 */
  content: string;
  /** 使用的模型 */
  model: string;
  /** 使用的 tokens */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
