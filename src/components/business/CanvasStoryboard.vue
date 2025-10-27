<template>
  <div
    :id="`storyboard-${storyboard.id}`"
    :class="[
      'storyboard-container absolute rounded-2xl shadow-2xl flex flex-col select-none backdrop-blur-xl border',
      theme.storyboardBg,
      theme.storyboardBorder,
    ]"
    :style="{
      left: `${storyboard.x}px`,
      top: `${storyboard.y}px`,
      width: `${storyboard.width}px`,
      height: `${computedHeight}px`,
      zIndex: isDragging ? 50 : 40,
    }"
  >
    <!-- 头部 -->
    <div
      :class="[
        'storyboard-header p-3 flex justify-between items-center shrink-0 cursor-move',
        theme.storyboardHeader,
      ]"
      @mousedown="handleHeaderMouseDown"
    >
      <h2 :class="['font-bold truncate flex-1', theme.textPrimary]">{{ storyboard.title }}</h2>
      <div class="flex items-center space-x-2">
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
          class="bg-red-600 hover:bg-red-700 text-white font-bold h-8 w-8 rounded-lg flex items-center justify-center"
          @click.stop="$emit('close', storyboard.id)"
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
            <span v-if="storyboard.characterReferenceImageFileIds.length > 1" class="text-xs ml-1">
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

      <!-- 右侧分镜面板 -->
      <div
        ref="shotPanelRef"
        class="storyboard-shot-panel grow relative p-5 cursor-move"
        @mousedown="handleShotPanelMouseDown"
      >
        <!-- SVG 连接线容器 -->
        <svg class="connections-svg absolute top-0 left-0 w-full h-full pointer-events-none">
          <path
            v-for="(connection, index) in storyboard.connections"
            :key="`${connection.from}-${connection.to}-${index}-${connectionUpdateKey}`"
            :d="getConnectionPath(connection)"
            :class="[
              'connection-path fill-none cursor-pointer pointer-events-auto',
              theme.connectionStroke,
              isPlayerConnection(connection) && 'stroke-blue-500 stroke-[4px]',
            ]"
            stroke-width="3"
            @click.stop="$emit('remove-connection', storyboard.id, connection.from, connection.to)"
          />

          <!-- 临时连接线（拖拽中） -->
          <path
            v-if="tempConnectionPath"
            :d="tempConnectionPath"
            :class="['connection-path fill-none', theme.connectionStroke]"
            stroke-width="3"
          />
        </svg>

        <!-- 卡片 -->
        <slot name="cards"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { useTheme } from "@/composables";
import { canvasConfig } from "@/config";
import ReferenceImagePreview from "@/components/business/ReferenceImagePreview.vue";
import type { Storyboard, Connection, Point } from "@/typings/canvas";

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
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragging = ref(false);
const isScriptExpanded = ref(true);
const shotPanelRef = ref<HTMLElement>();
const topicPanelRef = ref<HTMLElement>();
const computedHeight = ref(600);
const connectionUpdateKey = ref(0); // 用于强制更新连接线

// 切换剧本展开/收起
const toggleScript = () => {
  isScriptExpanded.value = !isScriptExpanded.value;
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
  const target = e.target as HTMLElement;

  // 如果点击的是卡片或其子元素，不触发拖拽
  if (target.closest(".card")) return;

  // 如果点击的是连接线，不触发拖拽
  if (target.closest(".connection-path")) return;

  // 如果点击的是按钮，不触发拖拽
  if (target.closest("button")) return;

  e.stopPropagation();
  isDragging.value = true;
  emit("drag-start", props.storyboard.id, e);

  const onMouseUp = () => {
    isDragging.value = false;
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mouseup", onMouseUp);
};

// 获取连接器位置
const getConnectorPosition = (cardId: number, type: "in" | "out"): Point | null => {
  if (!shotPanelRef.value) return null;

  const cardEl = shotPanelRef.value.querySelector(`#card-${cardId}`);
  if (!cardEl) return null;

  const dot = cardEl.querySelector(`[data-connector-type="${type}"]`);
  if (!dot) return null;

  const panelRect = shotPanelRef.value.getBoundingClientRect();
  const dotRect = dot.getBoundingClientRect();

  // getBoundingClientRect 返回的是缩放后的屏幕坐标
  // 需要除以 zoom 转换为 SVG 坐标系中的坐标
  return {
    x: (dotRect.left - panelRect.left + dotRect.width / 2) / props.zoom,
    y: (dotRect.top - panelRect.top + dotRect.height / 2) / props.zoom,
  };
};

// 绘制贝塞尔曲线路径
const drawBezierPath = (startPos: Point, endPos: Point): string => {
  const dx = Math.abs(startPos.x - endPos.x);
  return `M ${startPos.x} ${startPos.y} C ${startPos.x + dx * 0.5} ${startPos.y}, ${endPos.x - dx * 0.5} ${endPos.y}, ${endPos.x} ${endPos.y}`;
};

// 获取连接路径
const getConnectionPath = (connection: Connection): string => {
  const startPos = getConnectorPosition(connection.from, "out");
  const endPos = getConnectorPosition(connection.to, "in");

  if (!startPos || !endPos) return "";

  return drawBezierPath(startPos, endPos);
};

// 判断是否是播放器连接
const isPlayerConnection = (connection: Connection): boolean => {
  const toCard = props.storyboard.cards.find((c) => c.id === connection.to);
  return toCard?.type === "player";
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

// 监听卡片变化，立即更新高度和连接线
watch(
  () => props.storyboard.cards,
  async () => {
    updateHeight();
    // 等待 DOM 更新后再重新计算连接线
    await nextTick();
    connectionUpdateKey.value++;
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

// 监听 zoom 变化，强制重新计算连接线
watch(
  () => props.zoom,
  async () => {
    // 等待 DOM 更新后再重新计算连接线
    await nextTick();
    connectionUpdateKey.value++;
  }
);

// 监听连接线变化，强制重新渲染
watch(
  () => props.storyboard.connections,
  async () => {
    await nextTick();
    connectionUpdateKey.value++;
  },
  { deep: true }
);

onMounted(() => {
  updateHeight();
});
</script>

<style scoped>
/* 样式已在组件中定义 */
</style>
