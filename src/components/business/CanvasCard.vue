<template>
  <div
    :id="`card-${card.id}`"
    :class="[
      'card absolute rounded-lg overflow-hidden select-none border flex flex-col',
      card.type === 'player' ? 'w-[576px] h-[436px]' : 'w-72 h-[380px]',
      theme.cardBg,
      theme.cardBorder,
      theme.cardShadow,
      theme.cardHover,
      isDragging ? 'cursor-grabbing z-50' : 'cursor-grab',
    ]"
    :style="{ left: `${card.x}px`, top: `${card.y}px` }"
    @mousedown="handleMouseDown"
  >
    <!-- 连接点：输入 -->
    <div
      data-connector-type="in"
      class="connector-dot absolute -left-2 top-4 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-800 z-10 hover:scale-150 hover:bg-blue-500"
      @mouseup="$emit('connect-end', card.id)"
    ></div>

    <!-- 连接点：输出（仅图片卡片） -->
    <div
      v-if="card.type === 'image'"
      data-connector-type="out"
      class="connector-dot absolute -right-2 top-4 w-4 h-4 bg-gray-500 rounded-full border-2 border-gray-800 z-10 hover:scale-150 hover:bg-blue-500"
      @mousedown.stop="$emit('connect-start', card.id)"
    ></div>

    <!-- 播放器卡片 -->
    <template v-if="card.type === 'player'">
      <div
        :class="[
          'image-container w-full h-96 flex items-center justify-center relative group cursor-grab shrink-0',
          theme.storyboardPanel,
          isDragging && 'cursor-grabbing',
        ]"
      >
        <ImagePreview
          v-if="card.isReady && currentThumbnail"
          :src="currentThumbnail"
          alt="播放器预览"
          container-class="w-full h-full"
        />
        <!-- 未执行状态 -->
        <div v-else class="flex flex-col items-center space-y-4 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="theme.textTertiary"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <div class="text-center">
            <p :class="['font-semibold mb-1', theme.textSecondary]">播放器待机中</p>
            <p :class="['text-xs', theme.textTertiary]">连接卡片并点击执行</p>
          </div>
        </div>

        <!-- 播放按钮（仅在准备就绪时显示） -->
        <div
          v-if="card.isReady"
          class="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none"
        >
          <button
            class="player-card-play-button text-gray-400 hover:scale-110 hover:text-white pointer-events-auto"
            @click.stop="$emit('toggle-play', card.id)"
          >
            <!-- 播放中 - 显示暂停图标（hover 时） -->
            <div v-if="card.isPlaying" class="opacity-0 group-hover:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"
                />
              </svg>
            </div>
            <!-- 未播放 - 显示播放图标 -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M10.804 8 5 4.633v6.734L10.804 8zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm15 0a7 7 0 1 0-14 0 7 7 0 0 0 14 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div :class="['p-3 shrink-0', theme.storyboardPanel]">
        <h3 :class="['font-semibold truncate', theme.textPrimary]">播放器</h3>
        <p :class="['text-xs', theme.textSecondary]">点击上方卡片连接器创建播放列表</p>
      </div>
    </template>

    <!-- 图片卡片 -->
    <template v-else-if="card.type === 'image'">
      <div
        :class="[
          'image-container w-full h-48 flex items-center justify-center cursor-grab shrink-0',
          theme.storyboardPanel,
          isDragging && 'cursor-grabbing',
        ]"
      >
        <!-- 加载中 -->
        <div v-if="card.isLoading" class="flex flex-col items-center space-y-3 pointer-events-none">
          <div
            class="loader border-4 border-gray-300 border-t-blue-500 rounded-full w-10 h-10 animate-spin"
          ></div>
          <span :class="['text-sm', theme.textSecondary]">生成中...</span>
        </div>
        <!-- 图片 -->
        <ImagePreview
          v-else-if="card.imageUrl"
          :src="card.imageUrl"
          :alt="card.title"
          container-class="w-full h-full"
        />
        <!-- 失败 -->
        <div v-else class="flex flex-col items-center space-y-3 p-4 pointer-events-none">
          <div class="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div class="text-center">
            <p class="text-red-400 font-semibold mb-1">生成失败</p>
            <p :class="['text-xs', theme.textTertiary]">可修改提示词后重试</p>
          </div>
        </div>
      </div>

      <div class="p-3 flex-1 flex flex-col overflow-hidden min-h-0">
        <div class="flex justify-between items-center mb-1 shrink-0">
          <h3 :class="['font-semibold truncate', theme.textPrimary]">{{ card.title }}</h3>
        </div>

        <!-- 镜头运动 -->
        <div
          v-if="card.cameraMovement"
          :class="['flex items-center text-xs mb-2 shrink-0', theme.textTertiary]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            fill="currentColor"
            class="mr-2"
            viewBox="0 0 16 16"
          >
            <path
              d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"
            />
          </svg>
          <span>{{ card.cameraMovement }}</span>
        </div>

        <!-- 提示词内容 -->
        <div class="description-content flex-1 min-h-0">
          <textarea
            ref="textareaRef"
            v-model="editedDescription"
            :class="[
              'description-area p-2 rounded-md text-sm w-full h-full resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 border',
              theme.storyboardPanel,
              theme.textSecondary,
              theme.inputBorder,
            ]"
            placeholder="输入提示词..."
            @wheel="handleTextareaWheel"
          ></textarea>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div
        :class="[
          'p-3 flex items-center text-xs shrink-0',
          theme.storyboardPanel,
          card.imageUrl ? 'justify-between' : 'justify-end',
        ]"
      >
        <!-- 左侧：参考图片切换（仅在有图片时显示） -->
        <button
          v-if="card.imageUrl"
          :class="[
            'flex items-center space-x-1 px-2 py-1 rounded transition-colors',
            useCurrentImage
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30',
          ]"
          @click.stop="useCurrentImage = !useCurrentImage"
          :title="useCurrentImage ? '使用参考图片' : '不使用参考图片'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>参考图片</span>
        </button>

        <!-- 右侧：重试和删除 -->
        <div class="flex items-center space-x-3">
          <button
            class="action-btn text-yellow-400 hover:text-yellow-300 font-semibold"
            @click.stop="$emit('retry', card.id, editedDescription)"
          >
            重试
          </button>
          <button class="action-btn hover:text-red-400" @click.stop="$emit('delete', card.id)">
            删除
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTheme } from "@/composables";
import ImagePreview from "@/components/common/ImagePreview.vue";
import type { Card, PlayerCard } from "@/typings/canvas";

const { theme } = useTheme();

interface Props {
  card: Card;
}

interface Emits {
  (e: "drag-start", cardId: number, event: MouseEvent): void;
  (e: "connect-start", cardId: number): void;
  (e: "connect-end", cardId: number): void;
  (e: "toggle-play", cardId: number): void;
  (e: "retry", cardId: number, newDescription: string): void;
  (e: "delete", cardId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragging = ref(false);
const editedDescription = ref("");
const useCurrentImage = ref(true); // 是否使用当前图片进行重试
const textareaRef = ref<HTMLTextAreaElement>();

// 计算属性
const currentThumbnail = computed(() => {
  if (props.card.type !== "player") return "";
  const playerCard = props.card as PlayerCard;
  if (playerCard.isPlaying && playerCard.playlist.length > 0) {
    return playerCard.playlist[playerCard.currentFrame]?.imageUrl || "";
  }
  return playerCard.thumbnailUrl || "";
});

// 监听卡片描述变化，同步到 editedDescription
watch(
  () => (props.card.type === "image" ? props.card.description : ""),
  (newDescription) => {
    if (props.card.type === "image") {
      editedDescription.value = newDescription;
    }
  },
  { immediate: true }
);

// 方法
const handleTextareaWheel = (e: WheelEvent) => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  // 检查是否有滚动条（内容高度 > 可见高度）
  const hasScrollbar = textarea.scrollHeight > textarea.clientHeight;

  if (hasScrollbar) {
    // 检查是否到达滚动边界
    const isAtTop = textarea.scrollTop === 0 && e.deltaY < 0;
    const isAtBottom =
      textarea.scrollTop + textarea.clientHeight >= textarea.scrollHeight && e.deltaY > 0;

    // 只有在边界且继续向边界外滚动时才允许事件冒泡，否则阻止冒泡
    if (!isAtTop && !isAtBottom) {
      e.stopPropagation();
    }
  }
  // 如果没有滚动条，允许事件冒泡到画布进行缩放
};

const handleMouseDown = (e: MouseEvent) => {
  // 忽略按钮、连接点、文本域的点击
  if (
    (e.target as HTMLElement).closest("button") ||
    (e.target as HTMLElement).closest(".connector-dot") ||
    (e.target as HTMLElement).closest("textarea")
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  isDragging.value = true;
  emit("drag-start", props.card.id, e);

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mouseup", onMouseUp);
};
</script>

<style scoped>
.loader {
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 提示词输入框滚动条样式 */
.description-area {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.description-area::-webkit-scrollbar {
  width: 6px;
}

.description-area::-webkit-scrollbar-track {
  background: transparent;
}

.description-area::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.description-area::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
