<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useChatStore } from "@/stores/chat";
import { useBoolean } from "@/composables";
import Button from "@/volt/Button.vue";
import InputText from "@/volt/InputText.vue";
import Select from "@/volt/Select.vue";
import Textarea from "@/volt/Textarea.vue";
import Card from "@/volt/Card.vue";
import Message from "@/volt/Message.vue";
import type { AIProviderType } from "@/typings/chat";

const chatStore = useChatStore();
const loading = useBoolean();
const fetchingModels = useBoolean();
const inputMessage = ref("");
const errorMessage = ref("");
const messagesContainer = ref<HTMLElement>();

// 提供商选项
const providerOptions = [
  { label: "OpenAI", value: "openai" },
  { label: "Google Gemini", value: "gemini" },
];

// 使用 LocalStorage 缓存配置（不缓存 API 密钥，出于安全考虑）
const cachedProviderType = useLocalStorage<AIProviderType>("ai-provider-type", "openai");
const cachedBaseURL = useLocalStorage("ai-base-url", "https://api.openai.com/v1");
const cachedSelectedModel = useLocalStorage("ai-selected-model", "");
const cachedModels = useLocalStorage<string>("ai-models-cache", "[]");

// 临时配置值
const tempApiKey = ref("");
const tempBaseURL = ref(cachedBaseURL.value);

onMounted(() => {
  // 从缓存恢复配置
  chatStore.setProviderType(cachedProviderType.value);
  tempBaseURL.value = cachedBaseURL.value;

  // 恢复模型列表
  try {
    const cachedModelsList = JSON.parse(cachedModels.value);
    if (Array.isArray(cachedModelsList) && cachedModelsList.length > 0) {
      chatStore.models = cachedModelsList;
    }
  } catch {
    // 解析失败，忽略
  }

  if (cachedSelectedModel.value) {
    chatStore.setSelectedModel(cachedSelectedModel.value);
  }
});

// 监听配置变化并保存到 LocalStorage
watch(
  () => chatStore.providerConfig.type,
  (newType) => {
    cachedProviderType.value = newType;
  }
);

watch(tempBaseURL, (newURL) => {
  cachedBaseURL.value = newURL;
});

watch(
  () => chatStore.selectedModel,
  (newModel) => {
    if (newModel) {
      cachedSelectedModel.value = newModel;
    }
  }
);

watch(
  () => chatStore.models,
  (newModels) => {
    if (newModels.length > 0) {
      cachedModels.value = JSON.stringify(newModels);
    }
  },
  { deep: true }
);

// 处理提供商切换
function handleProviderChange() {
  tempBaseURL.value = chatStore.providerConfig.baseURL || "";
  errorMessage.value = "";
  cachedProviderType.value = chatStore.providerConfig.type;
}

// 获取模型列表
async function handleFetchModels() {
  if (!tempApiKey.value) {
    errorMessage.value = "请输入 API 密钥";
    return;
  }

  try {
    errorMessage.value = "";
    chatStore.setApiKey(tempApiKey.value);
    chatStore.setBaseURL(tempBaseURL.value);
    await fetchingModels.run(async () => {
      await chatStore.fetchModels();
    });
  } catch (error) {
    errorMessage.value = `获取模型列表失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
}

// 发送消息
async function handleSendMessage() {
  if (!inputMessage.value.trim()) return;
  if (!chatStore.canChat) {
    errorMessage.value = "请先配置 API 并选择模型";
    return;
  }

  const message = inputMessage.value.trim();
  inputMessage.value = "";
  errorMessage.value = "";

  try {
    await loading.run(async () => {
      await chatStore.sendMessage(message);
      await nextTick();
      scrollToBottom();
    });
  } catch (error) {
    errorMessage.value = `发送消息失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
}

// 清空聊天记录
function handleClearChat() {
  if (confirm("确定要清空所有聊天记录吗？")) {
    chatStore.clearMessages();
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="h-screen flex bg-surface-50 dark:bg-surface-950">
    <!-- 左侧配置面板 -->
    <div
      class="w-80 bg-surface-0 dark:bg-surface-900 border-e border-surface-200 dark:border-surface-800 flex flex-col"
    >
      <div class="p-6 border-b border-surface-200 dark:border-surface-800">
        <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0">AI 服务配置</h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">配置你的 AI 服务提供商</p>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <!-- 服务提供商选择 -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
            服务提供商
          </label>
          <Select
            v-model="chatStore.providerConfig.type"
            :options="providerOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="选择服务提供商"
            class="w-full"
            @change="handleProviderChange"
          />
        </div>

        <!-- Base URL -->
        <div v-if="chatStore.providerConfig.type === 'openai'">
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
            Base URL
          </label>
          <InputText v-model="tempBaseURL" placeholder="https://api.openai.com/v1" class="w-full" />
          <small class="text-xs text-surface-500 dark:text-surface-400 mt-1.5 block">
            官方 API: https://api.openai.com
          </small>
        </div>

        <!-- API 密钥 -->
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
            API 密钥
          </label>
          <InputText
            v-model="tempApiKey"
            type="password"
            placeholder="输入 API 密钥"
            class="w-full"
          />
        </div>

        <!-- 获取模型按钮 -->
        <Button
          label="获取模型列表"
          icon="pi pi-refresh"
          :loading="fetchingModels.value.value"
          :disabled="!tempApiKey"
          class="w-full"
          @click="handleFetchModels"
        />

        <!-- 模型选择 -->
        <div v-if="chatStore.models.length > 0">
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
            选择模型
          </label>
          <Select
            v-model="chatStore.selectedModel"
            :options="chatStore.models"
            optionLabel="name"
            optionValue="id"
            placeholder="选择模型"
            filter
            class="w-full"
            @change="(e: { value: string }) => chatStore.setSelectedModel(e.value)"
          />
          <small
            v-if="chatStore.models.find((m) => m.id === chatStore.selectedModel)?.description"
            class="text-xs text-surface-500 dark:text-surface-400 mt-1.5 block"
          >
            {{ chatStore.models.find((m) => m.id === chatStore.selectedModel)?.description }}
          </small>
        </div>

        <!-- 错误消息 -->
        <Message v-if="errorMessage" severity="error" :closable="false">
          {{ errorMessage }}
        </Message>

        <!-- 配置状态 -->
        <Card v-if="chatStore.hasConfig">
          <template #content>
            <div class="text-sm">
              <div class="flex items-center text-green-600 dark:text-green-400 mb-3">
                <i class="pi pi-check-circle text-lg me-2"></i>
                <span class="font-semibold">配置已完成</span>
              </div>
              <div class="text-surface-600 dark:text-surface-300 space-y-2">
                <div class="flex items-center">
                  <span class="text-surface-500 dark:text-surface-400 w-16">提供商</span>
                  <span class="font-medium">
                    {{ chatStore.providerConfig.type.toUpperCase() }}
                  </span>
                </div>
                <div v-if="chatStore.selectedModel" class="flex items-center">
                  <span class="text-surface-500 dark:text-surface-400 w-16">模型</span>
                  <span class="font-medium truncate">
                    {{ chatStore.selectedModel }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-surface-0 dark:bg-surface-900">
      <!-- 头部 -->
      <div
        class="h-16 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-6 bg-surface-0 dark:bg-surface-900"
      >
        <div>
          <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-0">AI 聊天助手</h1>
          <p v-if="chatStore.selectedModel" class="text-xs text-surface-500 dark:text-surface-400">
            {{ chatStore.selectedModel }}
          </p>
        </div>
        <Button
          v-if="chatStore.messages.length > 0"
          label="清空对话"
          icon="pi pi-trash"
          severity="danger"
          text
          @click="handleClearChat"
        />
      </div>

      <!-- 消息列表 -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-950"
      >
        <!-- 空状态 -->
        <div v-if="chatStore.messages.length === 0" class="h-full flex items-center justify-center">
          <div class="text-center max-w-md">
            <div
              class="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4"
            >
              <i class="pi pi-comments text-4xl text-primary"></i>
            </div>
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">
              开始你的对话
            </h3>
            <p class="text-surface-500 dark:text-surface-400">请在左侧配置 AI 服务后发送消息</p>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="space-y-6 max-w-4xl mx-auto">
          <div
            v-for="message in chatStore.messages"
            :key="message.id"
            :class="['flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start']"
          >
            <!-- 助手消息 -->
            <template v-if="message.role === 'assistant'">
              <div
                class="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
              >
                <i class="pi pi-sparkles text-primary text-sm"></i>
              </div>
              <div class="flex-1 max-w-[85%]">
                <div
                  class="bg-surface-0 dark:bg-surface-900 rounded-2xl px-4 py-3 shadow-sm border border-surface-200 dark:border-surface-800"
                >
                  <p
                    class="text-surface-800 dark:text-surface-100 whitespace-pre-wrap wrap-break-word leading-relaxed"
                  >
                    {{ message.content }}
                  </p>
                </div>
                <p class="text-xs text-surface-400 dark:text-surface-500 mt-1.5 ms-3">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
            </template>

            <!-- 用户消息 -->
            <template v-else>
              <div class="flex-1 max-w-[85%] flex flex-col items-end">
                <div class="bg-primary rounded-2xl px-4 py-3 shadow-sm">
                  <p
                    class="text-primary-contrast whitespace-pre-wrap wrap-break-word leading-relaxed"
                  >
                    {{ message.content }}
                  </p>
                </div>
                <p class="text-xs text-surface-400 dark:text-surface-500 mt-1.5 me-3">
                  {{ formatTime(message.timestamp) }}
                </p>
              </div>
              <div
                class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                <i class="pi pi-user text-primary-contrast text-sm"></i>
              </div>
            </template>
          </div>

          <!-- 加载中提示 -->
          <div v-if="loading.value.value" class="flex gap-3 justify-start">
            <div
              class="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-sparkles text-primary text-sm"></i>
            </div>
            <div class="flex-1 max-w-[85%]">
              <div
                class="bg-surface-0 dark:bg-surface-900 rounded-2xl px-4 py-3 shadow-sm border border-surface-200 dark:border-surface-800"
              >
                <div class="flex items-center gap-2">
                  <div class="flex gap-1">
                    <span
                      class="w-2 h-2 bg-surface-400 dark:bg-surface-600 rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    ></span>
                    <span
                      class="w-2 h-2 bg-surface-400 dark:bg-surface-600 rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    ></span>
                    <span
                      class="w-2 h-2 bg-surface-400 dark:bg-surface-600 rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    ></span>
                  </div>
                  <span class="text-sm text-surface-500 dark:text-surface-400"> 正在思考... </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div
        class="border-t border-surface-200 dark:border-surface-800 p-4 bg-surface-0 dark:bg-surface-900"
      >
        <div class="max-w-4xl mx-auto">
          <div class="flex gap-3">
            <Textarea
              v-model="inputMessage"
              placeholder="输入消息... (Enter 发送，Shift + Enter 换行)"
              :autoResize="true"
              rows="1"
              class="flex-1"
              :disabled="!chatStore.canChat || loading.value.value"
              @keydown.enter.exact.prevent="handleSendMessage"
            />
            <Button
              icon="pi pi-send"
              :disabled="!chatStore.canChat || loading.value.value || !inputMessage.trim()"
              class="self-end"
              @click="handleSendMessage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
