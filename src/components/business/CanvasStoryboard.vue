<template>
  <Teleport to="body" :disabled="!isFullscreen">
    <div
      :id="`storyboard-${storyboard.id}`"
      :class="[
        'storyboard-container flex flex-col select-none backdrop-blur-xl border shadow-2xl',
        isFullscreen ? 'fixed inset-0 rounded-none' : 'absolute rounded-2xl',
        theme.storyboardBg,
        theme.storyboardBorder,
      ]"
      :style="
        isFullscreen
          ? { zIndex: 9999 }
          : {
              left: `${storyboard.x}px`,
              top: `${storyboard.y}px`,
              width: `${storyboard.width}px`,
              height: `${computedHeight}px`,
              zIndex: isDragging ? 50 : 40,
            }
      "
    >
      <!-- 头部 -->
      <div
        :class="[
          'storyboard-header p-3 flex justify-between items-center shrink-0 relative',
          isFullscreen ? 'cursor-default' : 'cursor-move',
          theme.storyboardHeader,
        ]"
        @mousedown="handleHeaderMouseDown"
      >
        <h2 :class="['font-bold truncate flex-1', theme.textPrimary]">{{ storyboard.title }}</h2>

        <!-- Tab切换栏（绝对定位居中） -->
        <div class="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10',
            ]"
            @click.stop="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex items-center space-x-2 relative">
          <button
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 w-8 rounded-lg flex items-center justify-center"
            title="重置卡片位置"
            @click.stop="$emit('reset-layout', storyboard.id)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 2v6h6" />
              <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
              <path d="M21 22v-6h-6" />
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
            </svg>
          </button>
          <button
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 px-3 rounded-lg flex items-center justify-center text-sm"
            @click.stop="$emit('execute', storyboard.id)"
          >
            执行
          </button>
          <button
            class="bg-green-600 hover:bg-green-700 text-white font-bold h-8 w-8 rounded-lg flex items-center justify-center"
            @click.stop="$emit('download', storyboard.id)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            :class="[
              'text-white font-bold h-8 w-8 rounded-lg flex items-center justify-center',
              isFullscreen
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-indigo-600 hover:bg-indigo-700',
            ]"
            :title="isFullscreen ? '退出全屏' : '全屏显示'"
            @click.stop="toggleFullscreen"
          >
            <svg
              v-if="!isFullscreen"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
              />
            </svg>
          </button>
          <button
            class="bg-red-600 hover:bg-red-700 text-white font-bold h-8 w-8 rounded-lg flex items-center justify-center"
            @click.stop="showDeleteConfirm = !showDeleteConfirm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>

          <!-- 删除确认框 -->
          <div
            v-if="showDeleteConfirm"
            :class="[
              'absolute right-0 top-full mt-2 p-4 rounded-lg shadow-2xl border z-50 min-w-[280px]',
              theme.modalBg,
              theme.cardBorder,
            ]"
            @click.stop
          >
            <p :class="['text-sm mb-3', theme.textPrimary]">确认删除整个故事板？</p>
            <p :class="['text-xs mb-4', theme.textSecondary]">
              此操作将删除所有分镜数据，不可恢复。
            </p>
            <div class="flex justify-end space-x-2">
              <button
                class="px-4 py-2 text-sm rounded bg-gray-600 hover:bg-gray-700 text-white"
                @click.stop="showDeleteConfirm = false"
              >
                取消
              </button>
              <button
                class="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700 text-white"
                @click.stop="handleConfirmDelete"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="grow flex overflow-hidden">
        <!-- 左侧主题面板 -->
        <div
          ref="topicPanelRef"
          :class="[
            'storyboard-topic-panel w-80 p-5 overflow-y-auto shrink-0 border-r',
            theme.storyboardPanel,
            theme.storyboardBorder,
          ]"
          @wheel="handleTopicPanelWheel"
        >
          <!-- 角色参考（支持多张） -->
          <template
            v-if="
              storyboard.characterReferenceImageFileIds &&
              storyboard.characterReferenceImageFileIds.length > 0
            "
          >
            <h4 :class="['text-sm font-semibold mb-2', theme.textSecondary]">
              角色参考
              <span
                v-if="storyboard.characterReferenceImageFileIds.length > 1"
                class="text-xs ml-1"
              >
                ({{ storyboard.characterReferenceImageFileIds.length }} 张)
              </span>
            </h4>
            <div class="space-y-2">
              <ReferenceImagePreview
                v-for="(fileId, index) in storyboard.characterReferenceImageFileIds"
                :key="fileId"
                :file-id="fileId"
                :alt="`角色参考 ${index + 1}`"
                container-class="h-48 rounded-md overflow-hidden"
                image-class="object-contain!"
              />
            </div>
          </template>

          <!-- 场景参考 -->
          <template v-if="storyboard.sceneReferenceImageFileId">
            <h4 :class="['text-sm font-semibold mt-3 mb-2', theme.textSecondary]">场景参考</h4>
            <ReferenceImagePreview
              :file-id="storyboard.sceneReferenceImageFileId"
              alt="场景参考"
              container-class="h-48 rounded-md overflow-hidden"
              image-class="object-cover"
            />
          </template>

          <!-- 剧本内容 -->
          <template v-if="storyboard.scriptText">
            <div
              :class="[
                'flex justify-between items-center mb-2',
                storyboard.characterReferenceImage || storyboard.sceneReferenceImage ? 'mt-3' : '',
              ]"
            >
              <h4 :class="['text-sm font-semibold', theme.textSecondary]">剧本内容</h4>
              <button
                :class="['expand-script-btn', theme.textSecondary, theme.buttonHover]"
                @click.stop="toggleScript"
              >
                <svg
                  :class="['expand-arrow w-4 h-4', { 'rotate-180': isScriptExpanded }]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div
              :class="['script-content overflow-hidden', isScriptExpanded ? 'max-h-96' : 'max-h-0']"
            >
              <p :class="['text-sm whitespace-pre-wrap', theme.textSecondary]">
                {{ storyboard.scriptText }}
              </p>
            </div>
          </template>
        </div>

        <!-- 右侧内容面板 -->
        <div class="storyboard-content-panel grow relative">
          <!-- 图片生成模式 -->
          <ImageGenerationMode
            v-show="activeTab === 'image'"
            :connections="storyboard.connections"
            :cards="storyboard.cards"
            :zoom="isFullscreen ? 1 : zoom"
            :temp-connection-path="tempConnectionPath"
            @remove-connection="(from, to) => $emit('remove-connection', storyboard.id, from, to)"
            @drag-start="handleShotPanelMouseDown"
          >
            <template #cards>
              <slot name="cards"></slot>
            </template>
          </ImageGenerationMode>

          <!-- 视频生成模式 -->
          <VideoGenerationMode v-show="activeTab === 'video'" />

          <!-- 音频生成模式 -->
          <AudioGenerationMode v-show="activeTab === 'audio'" />

          <!-- 完整故事预览模式 -->
          <StoryPreviewMode v-show="activeTab === 'story'" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useTheme } from "@/composables";
import { canvasConfig } from "@/config";
import ReferenceImagePreview from "@/components/business/ReferenceImagePreview.vue";
import ImageGenerationMode from "@/components/business/ImageGenerationMode.vue";
import VideoGenerationMode from "@/components/business/VideoGenerationMode.vue";
import AudioGenerationMode from "@/components/business/AudioGenerationMode.vue";
import StoryPreviewMode from "@/components/business/StoryPreviewMode.vue";
import type { Storyboard } from "@/typings/canvas";

const { theme } = useTheme();

interface Props {
  storyboard: Storyboard;
  zoom: number;
  tempConnectionPath?: string;
}

interface Emits {
  (e: "drag-start", storyboardId: number, event: MouseEvent): void;
  (e: "execute", storyboardId: number): void;
  (e: "download", storyboardId: number): void;
  (e: "close", storyboardId: number): void;
  (e: "reset-layout", storyboardId: number): void;
  (e: "remove-connection", storyboardId: number, from: number, to: number): void;
  (e: "update-height", storyboardId: number, height: number): void;
  (e: "fullscreen-change", isFullscreen: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragging = ref(false);
const isScriptExpanded = ref(true);
const isFullscreen = ref(false);
const topicPanelRef = ref<HTMLElement>();
const computedHeight = ref(600);
const showDeleteConfirm = ref(false); // 显示删除确认框

// Tab切换
type TabId = "image" | "video" | "audio" | "story";
const activeTab = ref<TabId>("image");
const tabs = [
  { id: "image" as TabId, label: "图片生成" },
  { id: "video" as TabId, label: "视频生成" },
  { id: "audio" as TabId, label: "音频生成" },
  { id: "story" as TabId, label: "完整故事预览" },
];

// 切换剧本展开/收起
const toggleScript = () => {
  isScriptExpanded.value = !isScriptExpanded.value;
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  emit("fullscreen-change", isFullscreen.value);
};

// 确认删除
const handleConfirmDelete = () => {
  showDeleteConfirm.value = false;
  emit("close", props.storyboard.id);
};

// 处理左侧面板滚轮事件
const handleTopicPanelWheel = (e: WheelEvent) => {
  const panel = topicPanelRef.value;
  if (!panel) return;

  // 检查是否有滚动条（内容高度 > 可见高度）
  const hasScrollbar = panel.scrollHeight > panel.clientHeight;

  if (hasScrollbar) {
    // 检查是否到达滚动边界
    const isAtTop = panel.scrollTop === 0 && e.deltaY < 0;
    const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight && e.deltaY > 0;

    // 只有在边界且继续向边界外滚动时才允许事件冒泡，否则阻止冒泡
    if (!isAtTop && !isAtBottom) {
      e.stopPropagation();
    }
  }
  // 如果没有滚动条，允许事件冒泡到画布进行缩放
};

// 处理头部拖拽
const handleHeaderMouseDown = (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest("button")) return;
  // 全屏时不允许拖拽
  if (isFullscreen.value) return;
  e.stopPropagation();
  isDragging.value = true;
  emit("drag-start", props.storyboard.id, e);

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mouseup", onMouseUp);
};

// 处理分镜面板背景拖拽
const handleShotPanelMouseDown = (e: MouseEvent) => {
  // 全屏时不允许拖拽
  if (isFullscreen.value) return;
  e.stopPropagation();
  isDragging.value = true;
  emit("drag-start", props.storyboard.id, e);

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mouseup", onMouseUp);
};

// 计算故事板高度
const updateHeight = () => {
  // 直接根据卡片数据计算高度，不依赖 DOM
  let maxBottomY = 0;

  // 使用配置文件中的值
  const { imageCard, playerCard, cardPadding } = canvasConfig;
  const IMAGE_CARD_HEIGHT = imageCard.height;
  const PLAYER_CARD_HEIGHT = playerCard.height;

  props.storyboard.cards.forEach((card) => {
    const cardHeight = card.type === "player" ? PLAYER_CARD_HEIGHT : IMAGE_CARD_HEIGHT;
    const bottomEdge = card.y + cardHeight;
    if (bottomEdge > maxBottomY) {
      maxBottomY = bottomEdge;
    }
  });

  const headerHeight = 52; // 头部高度
  const bottomPadding = cardPadding; // 底部内边距，与卡片间距保持一致
  const newHeight = Math.max(600, headerHeight + maxBottomY + bottomPadding);

  computedHeight.value = newHeight;
  emit("update-height", props.storyboard.id, newHeight);
};

// 监听卡片变化，立即更新高度
watch(
  () => props.storyboard.cards,
  () => {
    updateHeight();
  },
  { deep: true, immediate: true }
);

// 监听故事板宽度变化
watch(
  () => props.storyboard.width,
  () => {
    updateHeight();
  }
);

onMounted(() => {
  updateHeight();
});
</script>

<style scoped>
/* 样式已在组件中定义 */
</style>
