<template>
  <div
    :id="`card-${card.id}`"
    :class="[
      'card absolute rounded-lg overflow-hidden select-none border flex flex-col',
      card.type === 'player' ? 'w-[576px]' : 'w-72 h-[380px]',
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
      <!-- 图片区域 - 自适应内容高度，保持16:9宽高比 -->
      <div
        :class="[
          'image-container w-full relative group cursor-grab',
          theme.storyboardPanel,
          isDragging && 'cursor-grabbing',
        ]"
        style="aspect-ratio: 16/9"
        @mousedown="handlePlayerImageMouseDown"
      >
        <!-- 图片预览 - 保持宽高比 -->
        <div class="w-full h-full flex items-center justify-center bg-black/5">
          <ImagePreview
            v-if="card.isReady && currentThumbnail"
            :src="currentThumbnail"
            alt="播放器预览"
            container-class="w-full h-full flex items-center justify-center"
            image-class="!object-contain max-w-full max-h-full"
          />
        </div>

        <!-- 播放按钮遮罩层（仅在有图片时显示，且不阻止拖拽） -->
        <div
          v-if="card.isReady && currentThumbnail"
          class="absolute inset-0 flex items-center justify-center transition-all group pointer-events-none"
          :class="card.isPlaying ? '' : 'bg-black/20 hover:bg-black/40'"
        >
          <!-- 调试标记 -->
          <div class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {{ card.isReady ? "已就绪" : "未就绪" }}
          </div>

          <!-- 播放按钮 - 未播放时显示，播放中隐藏 -->
          <button
            v-if="!card.isPlaying"
            class="pointer-events-auto bg-black/40 hover:bg-black/60 rounded-full p-6 transition-all hover:scale-110"
            @click.stop="handlePlayClick"
            @mousedown.stop
            title="点击播放"
          >
            <!-- 简洁的播放三角形图标 -->
            <svg
              class="text-white"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <!-- 播放中时，hover 显示暂停按钮 -->
          <button
            v-else
            class="pointer-events-auto bg-black/40 hover:bg-black/60 rounded-full p-6 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            @click.stop="handlePlayClick"
            @mousedown.stop
            title="点击暂停"
          >
            <!-- 简洁的暂停图标 -->
            <svg
              class="text-white"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        </div>

        <!-- 未就绪状态的调试标记 -->
        <div
          v-if="!card.isReady || !currentThumbnail"
          class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded pointer-events-none"
        >
          未就绪
        </div>
      </div>

      <!-- 底部控制区域 - 固定高度不收缩 -->
      <div :class="['p-3 shrink-0', theme.storyboardPanel]">
        <div class="flex justify-between items-center">
          <div class="flex-1">
            <h3 :class="['font-semibold truncate', theme.textPrimary]">播放器</h3>
            <p :class="['text-xs mt-1', theme.textSecondary]">
              {{ card.isReady ? `${card.playlist.length} 张图片已就绪` : "连接卡片并点击执行" }}
            </p>
          </div>
          <!-- 手动准备播放器按钮（仅在未就绪时显示） -->
          <button
            v-if="!card.isReady"
            class="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded shrink-0"
            @click.stop="manualPreparePlayer"
            title="根据连接线准备播放列表"
          >
            🔧 准备
          </button>
        </div>
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
        <div class="flex items-center space-x-3 relative">
          <button
            class="action-btn text-yellow-400 hover:text-yellow-300 font-semibold"
            @click.stop="$emit('retry', card.id, editedDescription, useCurrentImage)"
          >
            重试
          </button>
          <button
            class="action-btn hover:text-red-400"
            @click.stop="showDeleteConfirm = !showDeleteConfirm"
          >
            删除
          </button>

          <!-- 删除确认框 -->
          <div
            v-if="showDeleteConfirm"
            :class="[
              'absolute right-0 bottom-full mb-2 p-3 rounded-lg shadow-xl border z-50 min-w-[200px]',
              theme.modalBg,
              theme.cardBorder,
            ]"
            @click.stop
          >
            <p :class="['text-sm mb-3', theme.textPrimary]">确认删除此节点？</p>
            <div class="flex justify-end space-x-2">
              <button
                class="px-3 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white"
                @click.stop="showDeleteConfirm = false"
              >
                取消
              </button>
              <button
                class="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
                @click.stop="handleConfirmDelete"
              >
                确认
              </button>
            </div>
          </div>
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
  (e: "prepare-player", cardId: number): void;
  (e: "retry", cardId: number, newDescription: string, useCurrentImage: boolean): void;
  (e: "delete", cardId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragging = ref(false);
const editedDescription = ref("");
const useCurrentImage = ref(false); // 是否使用当前图片进行重试
const textareaRef = ref<HTMLTextAreaElement>();
const showDeleteConfirm = ref(false); // 显示删除确认框

// 计算属性
const currentThumbnail = computed(() => {
  if (props.card.type !== "player") return "";
  const playerCard = props.card as PlayerCard;

  console.log("[CanvasCard currentThumbnail] 播放器状态:", {
    cardId: props.card.id,
    isReady: playerCard.isReady,
    isPlaying: playerCard.isPlaying,
    currentFrame: playerCard.currentFrame,
    playlistLength: playerCard.playlist.length,
    thumbnailUrl: playerCard.thumbnailUrl,
  });

  if (playerCard.isPlaying && playerCard.playlist.length > 0) {
    const url = playerCard.playlist[playerCard.currentFrame]?.imageUrl || "";
    console.log(`[CanvasCard currentThumbnail] 播放中，显示第 ${playerCard.currentFrame} 帧:`, url);
    return url;
  }

  console.log("[CanvasCard currentThumbnail] 未播放，显示缩略图:", playerCard.thumbnailUrl);
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
const manualPreparePlayer = () => {
  console.log("🔧 手动准备播放器，卡片 ID:", props.card.id);
  emit("prepare-player", props.card.id);
};

const handlePlayerImageMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // 如果点击的是播放按钮或其子元素，不触发拖拽
  if (target.closest("button")) {
    return;
  }

  // 触发拖拽
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

const handlePlayClick = (e: MouseEvent) => {
  console.log("🔥🔥🔥 [CanvasCard handlePlayClick] 播放按钮被点击了！");
  e.preventDefault();
  e.stopPropagation();

  console.log("=== [CanvasCard handlePlayClick] 播放按钮被点击 ===");
  console.log("[CanvasCard handlePlayClick] 事件对象:", e);
  console.log("[CanvasCard handlePlayClick] 卡片 ID:", props.card.id);
  console.log("[CanvasCard handlePlayClick] 卡片类型:", props.card.type);

  if (props.card.type === "player") {
    const playerCard = props.card as PlayerCard;
    console.log("[CanvasCard handlePlayClick] 播放器完整信息:", {
      id: props.card.id,
      type: props.card.type,
      isReady: playerCard.isReady,
      isPlaying: playerCard.isPlaying,
      currentFrame: playerCard.currentFrame,
      playlistLength: playerCard.playlist?.length || 0,
      playlist: playerCard.playlist,
    });
  }

  console.log("[CanvasCard handlePlayClick] 准备触发 toggle-play 事件");
  emit("toggle-play", props.card.id);
  console.log("[CanvasCard handlePlayClick] toggle-play 事件已触发");
};

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

const handleConfirmDelete = () => {
  showDeleteConfirm.value = false;
  emit("delete", props.card.id);
};

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  // 忽略按钮、连接点、文本域的点击
  if (target.closest("button") || target.closest(".connector-dot") || target.closest("textarea")) {
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
