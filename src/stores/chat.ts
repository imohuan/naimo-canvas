/**
 * 聊天 Store
 * 管理聊天状态和消息
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { aiChatService } from "@/services/aiChat";
import type { AIProviderConfig, ChatMessage, ModelInfo, AIProviderType } from "@/typings/chat";

export const useChatStore = defineStore("chat", () => {
  // 状态
  const messages = ref<ChatMessage[]>([]);
  const models = ref<ModelInfo[]>([]);
  const selectedModel = ref<string>("");
  const isLoading = ref(false);

  // 提供商配置
  const providerConfig = ref<AIProviderConfig>({
    type: "openai",
    baseURL: "https://api.openai.com/v1",
    apiKey: "",
  });

  // 计算属性
  const hasConfig = computed(() => {
    return !!providerConfig.value.apiKey;
  });

  const canChat = computed(() => {
    return hasConfig.value && !!selectedModel.value && !isLoading.value;
  });

  // Actions

  /** 设置提供商类型 */
  function setProviderType(type: AIProviderType) {
    providerConfig.value.type = type;
    // 切换提供商时重置模型列表
    models.value = [];
    selectedModel.value = "";

    // 设置默认 baseURL
    if (type === "openai") {
      providerConfig.value.baseURL = "https://api.openai.com/v1";
    } else {
      providerConfig.value.baseURL = "";
    }
  }

  /** 设置 API 密钥 */
  function setApiKey(key: string) {
    providerConfig.value.apiKey = key;
  }

  /** 设置基础 URL */
  function setBaseURL(url: string) {
    providerConfig.value.baseURL = url;
  }

  /** 设置选中的模型 */
  function setSelectedModel(model: string) {
    selectedModel.value = model;
    providerConfig.value.model = model;
  }

  /** 初始化服务并获取模型列表 */
  async function fetchModels() {
    if (!providerConfig.value.apiKey) {
      throw new Error("请先配置 API 密钥");
    }

    try {
      isLoading.value = true;
      aiChatService.init(providerConfig.value);
      models.value = await aiChatService.getModels();

      // 自动选择第一个模型
      if (models.value.length > 0 && !selectedModel.value) {
        setSelectedModel(models.value[0]?.id || "");
      }
    } catch (error) {
      console.error("获取模型列表失败:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /** 发送消息 */
  async function sendMessage(content: string) {
    if (!canChat.value) {
      throw new Error("无法发送消息：请检查配置");
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    messages.value.push(userMessage);

    try {
      isLoading.value = true;

      // 发送请求
      const response = await aiChatService.chat({
        messages: messages.value,
        model: selectedModel.value,
      });

      // 添加助手回复
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: Date.now(),
      };
      messages.value.push(assistantMessage);
    } catch (error) {
      console.error("发送消息失败:", error);
      // 移除失败的用户消息
      messages.value = messages.value.filter((msg) => msg.id !== userMessage.id);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /** 清空聊天记录 */
  function clearMessages() {
    messages.value = [];
  }

  /** 删除指定消息 */
  function deleteMessage(id: string) {
    messages.value = messages.value.filter((msg) => msg.id !== id);
  }

  return {
    // 状态
    messages,
    models,
    selectedModel,
    isLoading,
    providerConfig,

    // 计算属性
    hasConfig,
    canChat,

    // Actions
    setProviderType,
    setApiKey,
    setBaseURL,
    setSelectedModel,
    fetchModels,
    sendMessage,
    clearMessages,
    deleteMessage,
  };
});
