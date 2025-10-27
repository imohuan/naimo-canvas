/**
 * AI 聊天服务
 * 提供与 OpenAI 和 Gemini 的交互功能
 */

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProviderConfig, ChatRequest, ChatResponse, ModelInfo } from "@/typings/chat";

/** OpenAI 聊天服务 */
class OpenAIChatService {
  private client: OpenAI | null = null;

  /** 初始化客户端 */
  init(config: AIProviderConfig): void {
    // 规范化 baseURL，确保以 /v1 结尾
    let baseURL = config.baseURL || "https://api.openai.com/v1";
    if (baseURL && !baseURL.endsWith("/v1")) {
      baseURL = baseURL.replace(/\/$/, "") + "/v1";
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL,
      dangerouslyAllowBrowser: true, // 允许在浏览器中使用
    });
  }

  /** 获取模型列表 */
  async getModels(): Promise<ModelInfo[]> {
    if (!this.client) {
      throw new Error("OpenAI 客户端未初始化");
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .map((model) => ({
          id: model.id,
          name: model.id,
          description: `创建时间: ${new Date(model.created * 1000).toLocaleDateString()}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("获取 OpenAI 模型列表失败:", error);
      throw error;
    }
  }

  /** 发送聊天消息 */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error("OpenAI 客户端未初始化");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      });

      const choice = response.choices[0];
      return {
        content: choice?.message?.content || "",
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("OpenAI 聊天请求失败:", error);
      throw error;
    }
  }
}

/** Gemini 聊天服务 */
class GeminiChatService {
  private client: GoogleGenerativeAI | null = null;

  /** 初始化客户端 */
  init(config: AIProviderConfig): void {
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  /** 获取模型列表 */
  async getModels(): Promise<ModelInfo[]> {
    // Gemini 目前没有 API 获取模型列表，返回固定列表
    return [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash (Experimental)",
        description: "最新的实验性模型，速度快",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "高级模型，适合复杂任务",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "快速响应模型",
      },
      {
        id: "gemini-pro",
        name: "Gemini Pro",
        description: "通用对话模型",
      },
    ];
  }

  /** 发送聊天消息 */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error("Gemini 客户端未初始化");
    }

    try {
      const model = this.client.getGenerativeModel({
        model: request.model,
      });

      // 转换消息格式
      const history = request.messages.slice(0, -1).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const lastMessage = request.messages[request.messages.length - 1];

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
        },
      });

      const result = await chat.sendMessage(lastMessage?.content || "");
      const response = await result.response;

      return {
        content: response.text(),
        model: request.model,
        usage: {
          promptTokens: 0, // Gemini API 不返回具体 token 数
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      console.error("Gemini 聊天请求失败:", error);
      throw error;
    }
  }
}

/** AI 聊天服务管理器 */
export class AIChatService {
  private openaiService = new OpenAIChatService();
  private geminiService = new GeminiChatService();
  private currentConfig: AIProviderConfig | null = null;

  /** 初始化服务 */
  init(config: AIProviderConfig): void {
    this.currentConfig = config;
    if (config.type === "openai") {
      this.openaiService.init(config);
    } else if (config.type === "gemini") {
      this.geminiService.init(config);
    }
  }

  /** 获取模型列表 */
  async getModels(): Promise<ModelInfo[]> {
    if (!this.currentConfig) {
      throw new Error("服务未初始化");
    }

    if (this.currentConfig.type === "openai") {
      return this.openaiService.getModels();
    } else if (this.currentConfig.type === "gemini") {
      return this.geminiService.getModels();
    }

    return [];
  }

  /** 发送聊天消息 */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.currentConfig) {
      throw new Error("服务未初始化");
    }

    if (this.currentConfig.type === "openai") {
      return this.openaiService.chat(request);
    } else if (this.currentConfig.type === "gemini") {
      return this.geminiService.chat(request);
    }

    throw new Error("不支持的服务类型");
  }

  /** 获取当前配置 */
  getConfig(): AIProviderConfig | null {
    return this.currentConfig;
  }
}

// 导出单例
export const aiChatService = new AIChatService();
