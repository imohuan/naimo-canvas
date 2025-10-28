<template>
  <div class="image-generation-mode h-full flex flex-col">
    <!-- 卡片容器 -->
    <div class="grow relative overflow-hidden">
      <!-- SVG 连接线容器 -->
      <svg class="connections-svg absolute top-0 left-0 w-full h-full pointer-events-none">
        <path
          v-for="(connection, index) in connections"
          :key="`${connection.from}-${connection.to}-${index}`"
          :d="getConnectionPathByData(connection)"
          :class="[
            'connection-path fill-none cursor-pointer pointer-events-auto',
            theme.connectionStroke,
            isPlayerConnection(connection) && 'stroke-blue-500 stroke-[4px]',
          ]"
          stroke-width="3"
          @click.stop="$emit('remove-connection', connection.from, connection.to)"
        />

        <!-- 临时连接线（拖拽中） -->
        <path
          v-if="tempConnectionPath"
          :d="tempConnectionPath"
          :class="['connection-path fill-none', theme.connectionStroke]"
          stroke-width="3"
        />
      </svg>

      <!-- 卡片插槽 -->
      <div
        ref="shotPanelRef"
        class="shot-panel storyboard-shot-panel absolute top-0 left-0 w-full h-full p-5 cursor-move"
        @mousedown="handleShotPanelMouseDown"
      >
        <slot name="cards"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "@/composables";
import { canvasConfig } from "@/config";
import type { Connection, Point, Card } from "@/typings/canvas";

const { theme } = useTheme();

interface Props {
  connections: Connection[];
  cards: Card[];
  zoom: number;
  tempConnectionPath?: string;
}

interface Emits {
  (e: "remove-connection", from: number, to: number): void;
  (e: "drag-start", event: MouseEvent): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const shotPanelRef = ref<HTMLElement>();

// 从配置文件读取卡片尺寸
const IMAGE_CARD_WIDTH = canvasConfig.imageCard.width;
const PLAYER_CARD_WIDTH = canvasConfig.playerCard.width;

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
  emit("drag-start", e);
};

// 根据卡片数据计算连接器位置（不依赖DOM）
const getConnectorPositionByData = (cardId: number, type: "in" | "out"): Point | null => {
  const card = props.cards.find((c) => c.id === cardId);
  if (!card) return null;

  // 根据卡片类型确定尺寸
  const cardWidth = card.type === "player" ? PLAYER_CARD_WIDTH : IMAGE_CARD_WIDTH;

  // 连接器位置配置（与 CanvasCard.vue 中的 CSS 对应）
  // -left-2 top-4 = 左侧 -8px, 顶部 16px
  // -right-2 top-4 = 右侧 -8px, 顶部 16px
  // 连接器大小 w-4 h-4 = 16x16px，中心点偏移 +8px
  const CONNECTOR_OFFSET_TOP = 16; // top-4
  const CONNECTOR_SIZE = 16; // w-4 h-4
  const CONNECTOR_CENTER = CONNECTOR_SIZE / 2; // 8px

  // 连接点位置：
  // - 输入连接器在卡片左上角（-left-2 top-4）
  // - 输出连接器在卡片右上角（-right-2 top-4）
  if (type === "in") {
    return {
      x: card.x, // -left-2 的中心点正好在卡片左边缘
      y: card.y + CONNECTOR_OFFSET_TOP + CONNECTOR_CENTER,
    };
  } else {
    return {
      x: card.x + cardWidth, // -right-2 的中心点正好在卡片右边缘
      y: card.y + CONNECTOR_OFFSET_TOP + CONNECTOR_CENTER,
    };
  }
};

// 绘制贝塞尔曲线路径
const drawBezierPath = (startPos: Point, endPos: Point): string => {
  const dx = Math.abs(startPos.x - endPos.x);
  return `M ${startPos.x} ${startPos.y} C ${startPos.x + dx * 0.5} ${startPos.y}, ${endPos.x - dx * 0.5} ${endPos.y}, ${endPos.x} ${endPos.y}`;
};

// 基于数据获取连接路径（实时响应卡片位置变化）
const getConnectionPathByData = (connection: Connection): string => {
  const startPos = getConnectorPositionByData(connection.from, "out");
  const endPos = getConnectorPositionByData(connection.to, "in");

  if (!startPos || !endPos) return "";

  return drawBezierPath(startPos, endPos);
};

// 判断是否是播放器连接
const isPlayerConnection = (connection: Connection): boolean => {
  const toCard = props.cards.find((c) => c.id === connection.to);
  return toCard?.type === "player";
};
</script>

<style scoped>
.connection-path {
  transition: stroke-width 0.2s;
}

.connection-path:hover {
  stroke-width: 5;
}
</style>
