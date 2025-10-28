<template>
  <div :class="['relative w-full h-screen overflow-hidden', theme.canvasBg, theme.textPrimary]">
    <!-- 画布容器 -->
    <div
      ref="canvasContainerRef"
      class="absolute top-0 left-0 w-full h-full cursor-grab active:cursor-grabbing"
      :style="{
        backgroundImage: `radial-gradient(${theme.gridColor} 1px, transparent 0)`,
        backgroundSize: '20px 20px',
      }"
      @mousedown="handleCanvasMouseDown"
      @wheel="handleCanvasWheel"
    >
      <div
        id="canvas"
        ref="canvasRef"
        class="relative"
        :style="canvasStyle"
        style="transform-origin: 0 0"
      >
        <!-- 故事板 -->
        <CanvasStoryboard
          v-for="storyboard in canvas.state.storyboards"
          :key="storyboard.id"
          :storyboard="storyboard"
          :zoom="canvas.state.zoom"
          :temp-connection-path="tempConnectionPath"
          @drag-start="handleStoryboardDragStart"
          @execute="handleExecuteStoryboard"
          @download="handleDownloadStoryboard"
          @close="handleCloseStoryboard"
          @reset-layout="handleResetLayout"
          @remove-connection="handleRemoveConnection"
          @update-height="handleUpdateHeight"
          @fullscreen-change="handleFullscreenChange"
        >
          <template #cards>
            <CanvasCard
              v-for="card in storyboard.cards"
              :key="card.id"
              :card="card"
              @drag-start="handleCardDragStart"
              @connect-start="handleConnectStart"
              @connect-end="handleConnectEnd"
              @toggle-play="handleTogglePlay"
              @prepare-player="handlePreparePlayer"
              @retry="handleRetryCard"
              @delete="handleDeleteCard"
            />
          </template>
        </CanvasStoryboard>
      </div>
    </div>

    <!-- 底部控制条 -->
    <CanvasControls
      v-show="!isAnyStoryboardFullscreen"
      :is-thinking="isThinking"
      :character-reference-images="canvas.state.characterReferenceImages"
      :scene-reference-image="canvas.state.sceneReferenceImage"
      @generate="handleGenerate"
      @update:character-reference-images="canvas.setCharacterReferences"
      @update:scene-reference-image="canvas.setSceneReference"
    />

    <!-- 右下角控制按钮 -->
    <div
      v-show="!isAnyStoryboardFullscreen"
      class="absolute bottom-4 right-4 flex flex-col space-y-2 z-10"
    >
      <button
        :class="[
          'w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-xl',
          theme.buttonBg,
          theme.buttonHover,
          theme.buttonText,
        ]"
        title="放大"
        @click="canvas.zoomIn"
      >
        +
      </button>
      <button
        :class="[
          'w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-xl',
          theme.buttonBg,
          theme.buttonHover,
          theme.buttonText,
        ]"
        title="缩小"
        @click="canvas.zoomOut"
      >
        -
      </button>
      <button
        :class="[
          'w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center text-sm',
          theme.buttonBg,
          theme.buttonHover,
          theme.buttonText,
        ]"
        title="重置视图"
        @click="canvas.resetView"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
        :class="[
          'w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center',
          theme.buttonBg,
          theme.buttonHover,
          theme.buttonText,
        ]"
        :title="themeStore.mode === 'light' ? '切换到暗色主题' : '切换到亮色主题'"
        @click="themeStore.toggleTheme"
      >
        <svg
          v-if="themeStore.mode === 'light'"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>
    </div>

    <!-- 执行确认模态框 -->
    <Teleport to="body">
      <div
        v-if="showExecuteModal"
        :class="[
          'modal-backdrop fixed inset-0 flex items-center justify-center z-50',
          theme.modalBackdrop,
        ]"
        @click.self="closeExecuteModal"
      >
        <div
          :class="['modal-content rounded-xl shadow-2xl p-6 w-full max-w-md mx-4', theme.modalBg]"
        >
          <h3 :class="['text-xl font-semibold mb-4', theme.textPrimary]">执行预览</h3>
          <p :class="['mb-6', theme.textSecondary]">
            准备对所有图片节点执行批量生图任务，这可能需要一些时间。
          </p>
          <div class="flex justify-end space-x-3">
            <button
              class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              @click="closeExecuteModal"
            >
              取消
            </button>
            <button
              class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
              @click="confirmExecute"
            >
              确认执行
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useCanvas, useTheme, getCozeClientInstance } from "@/composables";
import {
  textToVideoShots,
  getAllDataGroupedByBookId,
  generateVideo,
  deleteData,
} from "@/services/canvas";
import { canvasConfig, type ImageFile } from "@/config";
import { compressImages, notify } from "@/utils";
import { eventBus } from "@/utils/eventBus";
import CanvasCard from "@/components/business/CanvasCard.vue";
import CanvasStoryboard from "@/components/business/CanvasStoryboard.vue";
import CanvasControls from "@/components/business/CanvasControls.vue";
import type { ImageCard, PlayerCard } from "@/typings/canvas";

const { theme, themeStore } = useTheme();

const canvas = useCanvas();
const canvasContainerRef = ref<HTMLElement>();
const canvasRef = ref<HTMLElement>();

const isThinking = ref(false);
const showExecuteModal = ref(false);
const tempConnectionPath = ref("");
const isAnyStoryboardFullscreen = ref(false);

const canvasStyle = computed(() => canvas.canvasStyle.value);

// ==================== 画布操作 ====================

const handleCanvasMouseDown = (e: MouseEvent) => {
  // 全屏时禁用平移
  if (isAnyStoryboardFullscreen.value) return;

  if ((e.target as HTMLElement).closest(".storyboard-container")) return;
  if ((e.target as HTMLElement).closest(".canvas-controls")) return;

  e.preventDefault();
  canvas.startPanning(e.clientX, e.clientY);

  const onMouseMove = (moveEvent: MouseEvent) => {
    canvas.panCanvas(moveEvent.clientX, moveEvent.clientY);
  };

  const onMouseUp = () => {
    canvas.stopPanning();
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

const handleCanvasWheel = (e: WheelEvent) => {
  // 全屏时禁用缩放
  if (isAnyStoryboardFullscreen.value) {
    e.preventDefault();
    return;
  }

  e.preventDefault();
  if (!canvasContainerRef.value) return;

  const rect = canvasContainerRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  canvas.zoomCanvas(e.deltaY, mouseX, mouseY);
};

// ==================== 故事板操作 ====================

const handleStoryboardDragStart = (storyboardId: number, e: MouseEvent) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  // 保存初始位置和鼠标位置
  const initialStoryboardX = storyboard.x;
  const initialStoryboardY = storyboard.y;
  const initialMouseX = e.clientX;
  const initialMouseY = e.clientY;

  const onMouseMove = (moveEvent: MouseEvent) => {
    // 计算鼠标移动的距离（考虑当前 zoom）
    const deltaX = (moveEvent.clientX - initialMouseX) / canvas.state.zoom;
    const deltaY = (moveEvent.clientY - initialMouseY) / canvas.state.zoom;

    // 计算新位置（基于初始位置 + 移动距离）
    canvas.updateStoryboard(storyboardId, {
      x: initialStoryboardX + deltaX,
      y: initialStoryboardY + deltaY,
    });
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

const handleCloseStoryboard = async (storyboardId: number) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard || !storyboard.bookId) {
    console.warn("[handleCloseStoryboard] 未找到故事板或缺少 bookId");
    canvas.removeStoryboard(storyboardId);
    return;
  }

  try {
    console.log(`[handleCloseStoryboard] 调用 DELETE_DATA 工作流，book_id: ${storyboard.bookId}`);

    // 调用删除工作流
    const result = await deleteData({
      book_id: storyboard.bookId,
      id: "", // 删除整个项目时 id 为空字符串
    });

    console.log("[handleCloseStoryboard] DELETE_DATA 返回结果:", result);

    // 检查返回的删除数量;
    const deleteCount = result?.dataJSON?.output || 0;

    console.log(`[handleCloseStoryboard] 删除数量: ${deleteCount}`);

    if (deleteCount >= 1) {
      // 删除成功，移除本地数据
      canvas.removeStoryboard(storyboardId);
      notify.success(`已删除 ${deleteCount} 条数据`, "删除成功");
    } else {
      notify.warning("未删除任何数据", "删除失败");
    }
  } catch (error) {
    console.error("[handleCloseStoryboard] 删除失败:", error);
    notify.error("删除失败，请重试", "删除失败");
  }
};

const handleUpdateHeight = () => {
  // 高度更新由组件内部处理，这里可以不做操作
};

const handleFullscreenChange = (isFullscreen: boolean) => {
  isAnyStoryboardFullscreen.value = isFullscreen;
};

// ==================== 卡片操作 ====================

const handleCardDragStart = (cardId: number, e: MouseEvent) => {
  const card = canvas.findCardById(cardId);
  const storyboard = canvas.findStoryboardByCardId(cardId);
  if (!card || !storyboard) return;

  // 保存初始卡片位置和鼠标位置
  const initialCardX = card.x;
  const initialCardY = card.y;
  const initialMouseX = e.clientX;
  const initialMouseY = e.clientY;

  const PADDING = 20; // 面板内边距
  const MIN_PANEL_WIDTH = 1000; // 最小面板宽度

  /**
   * 自动扩展容器大小
   */
  const expandContainer = (maxX: number) => {
    const newWidth = Math.max(MIN_PANEL_WIDTH, maxX + PADDING);

    // 更新故事板宽度（包含左侧面板）
    const LEFT_PANEL_WIDTH = 320;
    canvas.updateStoryboard(storyboard.id, {
      width: LEFT_PANEL_WIDTH + newWidth,
    });
  };

  const onMouseMove = (moveEvent: MouseEvent) => {
    // 计算鼠标移动的距离（考虑当前 zoom）
    const deltaX = (moveEvent.clientX - initialMouseX) / canvas.state.zoom;
    const deltaY = (moveEvent.clientY - initialMouseY) / canvas.state.zoom;

    // 计算新位置（基于初始位置 + 移动距离）
    let newX = initialCardX + deltaX;
    let newY = initialCardY + deltaY;

    // 限制最小坐标（不能小于 PADDING）
    newX = Math.max(PADDING, newX);
    newY = Math.max(PADDING, newY);

    // 更新卡片位置
    canvas.updateCard(cardId, {
      x: newX,
      y: newY,
    });

    // 计算所有卡片的最大 X 坐标
    const maxX = Math.max(
      ...storyboard.cards.map((c) => {
        const w = c.type === "player" ? 576 : 288;
        return c.x + w;
      })
    );

    // 自动扩展容器宽度（高度由 CanvasStoryboard 组件自动计算）
    expandContainer(maxX);
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

const handleDeleteCard = async (cardId: number) => {
  const card = canvas.findCardById(cardId) as ImageCard;
  const storyboard = canvas.findStoryboardByCardId(cardId);

  if (!card || !storyboard) {
    console.warn("[handleDeleteCard] 未找到卡片或故事板");
    canvas.removeCard(cardId);
    return;
  }

  // 获取数据 ID（优先使用 rawData.id，其次使用 shotId）
  const dataId = card.rawData?.id || card.shotId;

  // 如果没有 ID，直接删除本地数据
  if (!dataId) {
    console.log("[handleDeleteCard] 卡片没有数据 ID，直接删除本地数据");
    canvas.removeCard(cardId);
    return;
  }

  try {
    console.log(
      `[handleDeleteCard] 调用 DELETE_DATA 工作流，id: ${dataId} (类型: ${typeof dataId})`
    );

    // 调用删除工作流（删除节点时不携带 book_id）
    const result = await deleteData({ id: String(dataId) });
    console.log("[handleDeleteCard] DELETE_DATA 返回结果:", result);

    // 检查返回的删除数量
    const deleteCount = result?.dataJSON?.output || 0;
    console.log(`[handleDeleteCard] 删除数量: ${deleteCount}`);

    if (deleteCount >= 1) {
      // 删除成功，移除本地数据
      canvas.removeCard(cardId);
      notify.success("节点已删除", "删除成功");
    } else {
      notify.warning("未删除任何数据", "删除失败");
    }
  } catch (error) {
    console.error("[handleDeleteCard] 删除失败:", error);
    notify.error("删除失败，请重试", "删除失败");
  }
};

const handleRetryCard = async (
  cardId: number,
  newDescription: string,
  useCurrentImage: boolean
) => {
  const card = canvas.findCardById(cardId) as ImageCard;
  const storyboard = canvas.findStoryboardByCardId(cardId);

  if (!card || !storyboard) {
    console.error("[handleRetryCard] 未找到卡片或故事板");
    return;
  }

  try {
    console.log(`[handleRetryCard] 开始重新生成图片，卡片 ID: ${cardId}`);
    console.log(`[handleRetryCard] 使用当前图片作为参考: ${useCurrentImage}`);

    // 更新描述并设置加载状态
    canvas.updateCard(cardId, {
      description: newDescription,
      isLoading: true,
    });

    // 根据 useCurrentImage 决定使用哪个参考图片
    const imageFiles: Array<ImageFile> = [];

    if (useCurrentImage && card.imageUrl) {
      // 使用当前节点的输出图片作为参考（直接传 URL 字符串）
      imageFiles.push(card.imageUrl);
      console.log(`[handleRetryCard] 使用当前节点图片作为参考:`, card.imageUrl);
    } else {
      // 使用故事板的参考图片（传 file_id 对象）
      // 支持多张角色参考图片
      if (
        storyboard.characterReferenceImageFileIds &&
        storyboard.characterReferenceImageFileIds.length > 0
      ) {
        storyboard.characterReferenceImageFileIds.forEach((fileId) => {
          imageFiles.push({ file_id: fileId });
        });
      }
      if (storyboard.sceneReferenceImageFileId) {
        imageFiles.push({ file_id: storyboard.sceneReferenceImageFileId });
      }
      console.log(`[handleRetryCard] 使用故事板参考图片:`, imageFiles);
    }

    // 调用生成视频/图片工作流（异步执行）
    const result = await generateVideo({
      prompt: newDescription,
      image: imageFiles,
      book_id: storyboard.bookId || "",
      id: card.shotId || "",
    });

    console.log(`[handleRetryCard] 工作流已提交（异步执行），返回结果:`, result);
    console.log(`[handleRetryCard] execute_id:`, result?.execute_id);

    // GENERATE_VIDEO 是异步工作流，不会立即返回图片 URL
    // 保持加载状态，等待下次刷新数据时更新
    if (result?.code === 0) {
      console.log(`[handleRetryCard] 任务提交成功，卡片保持加载状态`);
      notify.success("图片生成任务已提交！", "提交成功", 4000);
      // 注意：不关闭加载状态，等待数据刷新时自动更新
    } else {
      // 任务提交失败，关闭加载状态
      canvas.updateCard(cardId, { isLoading: false });
      notify.error("任务提交失败，请重试", "提交失败");
    }
  } catch (error) {
    console.error(`[handleRetryCard] 任务提交失败:`, error);
    canvas.updateCard(cardId, { isLoading: false });
    notify.error("任务提交失败，请重试", "提交失败");
  }
};

// ==================== 连接线操作 ====================

const handleConnectStart = (cardId: number) => {
  const storyboard = canvas.findStoryboardByCardId(cardId);
  if (!storyboard) return;

  canvas.startConnecting(cardId, storyboard.id);

  const onMouseMove = (e: MouseEvent) => {
    if (!canvas.state.isConnecting || !canvas.state.connectionStart) return;

    // 计算临时连接线路径
    const startCard = canvas.findCardById(canvas.state.connectionStart.cardId);
    if (!startCard) return;

    const sbEl = document.getElementById(`storyboard-${storyboard.id}`);
    const shotPanel = sbEl?.querySelector(".storyboard-shot-panel");
    const cardEl = shotPanel?.querySelector(`#card-${cardId}`);
    if (!shotPanel || !cardEl) {
      console.warn("[handleConnectStart] 找不到 shotPanel 或 cardEl", { shotPanel, cardEl, sbEl });
      return;
    }

    // 获取连接点元素
    const connectorDot = cardEl.querySelector('[data-connector-type="out"]');
    if (!connectorDot) return;

    const sbRect = shotPanel.getBoundingClientRect();
    const dotRect = connectorDot.getBoundingClientRect();

    // 检查是否全屏（通过故事板容器是否是 fixed 定位）
    const sbContainer = document.getElementById(`storyboard-${storyboard.id}`);
    const isFullscreen = sbContainer?.classList.contains("fixed");
    const currentZoom = isFullscreen ? 1 : canvas.state.zoom;

    // 起点：连接器的中心点（已考虑缩放）
    const startX = (dotRect.left - sbRect.left + dotRect.width / 2) / currentZoom;
    const startY = (dotRect.top - sbRect.top + dotRect.height / 2) / currentZoom;

    // 终点：鼠标位置（已考虑缩放）
    const endX = (e.clientX - sbRect.left) / currentZoom;
    const endY = (e.clientY - sbRect.top) / currentZoom;

    const dx = Math.abs(startX - endX);
    tempConnectionPath.value = `M ${startX} ${startY} C ${startX + dx * 0.5} ${startY}, ${endX - dx * 0.5} ${endY}, ${endX} ${endY}`;
  };

  const onMouseUp = () => {
    tempConnectionPath.value = "";
    canvas.cancelConnecting();
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp, { once: true });
};

const handleConnectEnd = (targetCardId: number) => {
  canvas.endConnecting(targetCardId);
  tempConnectionPath.value = "";
};

const handleRemoveConnection = (storyboardId: number, from: number, to: number) => {
  canvas.removeConnection(storyboardId, from, to);
};

// ==================== 播放器操作 ====================

const handlePreparePlayer = (playerId: number) => {
  console.log("🔧 [CanvasView handlePreparePlayer] 手动准备播放器，playerId:", playerId);
  canvas.preparePlayer(playerId);

  // 验证准备结果
  const playerCard = canvas.findCardById(playerId) as PlayerCard;
  console.log("🔧 [CanvasView handlePreparePlayer] 准备后的状态:", playerCard);
};

const handleTogglePlay = (playerId: number) => {
  console.log("=== [CanvasView handleTogglePlay] 接收到播放切换事件 ===");
  console.log("[CanvasView handleTogglePlay] playerId:", playerId);
  console.log("[CanvasView handleTogglePlay] playerId 类型:", typeof playerId);

  const playerCard = canvas.findCardById(playerId) as PlayerCard;

  console.log("[CanvasView handleTogglePlay] 查找到的播放器卡片:", playerCard);
  console.log("[CanvasView handleTogglePlay] 所有故事板:", canvas.state.storyboards);

  if (!playerCard) {
    console.error("[CanvasView handleTogglePlay] ❌ 未找到播放器卡片，playerId:", playerId);
    return;
  }

  if (playerCard.type !== "player") {
    console.error("[CanvasView handleTogglePlay] ❌ 卡片类型错误:", playerCard.type);
    return;
  }

  console.log("[CanvasView handleTogglePlay] 播放器当前状态:", {
    isReady: playerCard.isReady,
    isPlaying: playerCard.isPlaying,
    currentFrame: playerCard.currentFrame,
    playlistLength: playerCard.playlist?.length || 0,
  });

  if (playerCard.isPlaying) {
    console.log("[CanvasView handleTogglePlay] ⏸️ 停止播放");
    canvas.stopPlayback(playerId);
  } else {
    console.log("[CanvasView handleTogglePlay] ▶️ 开始播放");
    canvas.startPlayback(playerId, (frame) => {
      console.log(`[CanvasView handleTogglePlay] 🎬 播放第 ${frame} 帧`);
    });
  }

  console.log("[CanvasView handleTogglePlay] 播放切换完成");
};

const handleExecuteStoryboard = (storyboardId: number) => {
  canvas.setActiveExecuteStoryboardId(storyboardId);
  showExecuteModal.value = true;
};

const closeExecuteModal = () => {
  showExecuteModal.value = false;
  canvas.setActiveExecuteStoryboardId(null);
};

const confirmExecute = async () => {
  const storyboardId = canvas.state.activeExecuteStoryboardId;
  if (storyboardId === null) return;

  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  closeExecuteModal();
  isThinking.value = true;

  try {
    // 获取所有图片卡片
    const imageCards = storyboard.cards.filter((card) => card.type === "image");

    // 从故事板中获取参考图片的 file_id
    const imageFiles: Array<ImageFile> = [];
    // 支持多张角色参考图片
    if (
      storyboard.characterReferenceImageFileIds &&
      storyboard.characterReferenceImageFileIds.length > 0
    ) {
      storyboard.characterReferenceImageFileIds.forEach((fileId) => {
        imageFiles.push({ file_id: fileId });
      });
    }
    if (storyboard.sceneReferenceImageFileId) {
      imageFiles.push({ file_id: storyboard.sceneReferenceImageFileId });
    }

    console.log(`[confirmExecute] 开始批量生图，共 ${imageCards.length} 个节点`);
    console.log(`[confirmExecute] 使用参考图片:`, imageFiles);

    // 批量执行生图任务（异步提交）
    const tasks = imageCards.map(async (card, index) => {
      try {
        console.log(`[confirmExecute] 正在提交第 ${index + 1}/${imageCards.length} 个生图任务...`);

        // 设置加载状态
        canvas.updateCard(card.id, { isLoading: true });

        // 调用生成视频/图片工作流（异步执行）
        const result = await generateVideo({
          prompt: card.description,
          image: imageFiles,
          book_id: storyboard.bookId || "",
          id: card.shotId || "",
        });

        console.log(`[confirmExecute] 第 ${index + 1} 个任务已提交（异步执行）:`, result);
        console.log(`[confirmExecute] execute_id:`, result?.execute_id);

        // GENERATE_VIDEO 是异步工作流，不会立即返回图片 URL
        // 保持加载状态，等待下次刷新数据时更新
        if (result?.code !== 0) {
          // 任务提交失败，关闭加载状态
          console.error(`[confirmExecute] 第 ${index + 1} 个任务提交失败`);
          canvas.updateCard(card.id, { isLoading: false });
        }
        // 注意：成功时不关闭加载状态，等待数据刷新时自动更新
      } catch (error) {
        console.error(`[confirmExecute] 第 ${index + 1} 个任务提交失败:`, error);
        canvas.updateCard(card.id, { isLoading: false });
      }
    });

    // 等待所有任务提交完成
    await Promise.all(tasks);

    console.log(`[confirmExecute] 批量生图任务已全部提交`);
    notify.success(
      `共提交 ${imageCards.length} 个任务，将在后台处理。`,
      "批量生图任务已提交",
      4000
    );

    // 注意：由于是异步任务，图片尚未生成，不需要立即准备播放器
    // 播放器会在下次刷新数据时自动准备
  } catch (error) {
    console.error("[confirmExecute] 批量生图失败:", error);
    notify.error("批量生图失败，请重试", "执行失败");
  } finally {
    isThinking.value = false;
  }
};

// ==================== 下载故事板 ====================

const handleDownloadStoryboard = async (storyboardId: number) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  // 使用 JSZip 打包下载（需要安装依赖）
  notify.warning("下载功能需要安装 jszip 库，暂未实现", "功能开发中");
  console.log("下载故事板:", storyboard);
};

// ==================== 重置布局 ====================

// ==================== 自动连接卡片 ====================

/**
 * 自动连接卡片：按索引顺序依次连接
 * 图片1 → 图片2 → 图片3 → ... → 播放器
 */
const autoConnectCards = (storyboardId: number) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  // 分离图片卡片和播放器卡片
  const imageCards = storyboard.cards.filter((card) => card.type === "image");
  const playerCards = storyboard.cards.filter((card) => card.type === "player");

  // 清除现有连接
  storyboard.connections = [];

  // 图片卡片之间依次连接
  for (let i = 0; i < imageCards.length - 1; i++) {
    const fromCard = imageCards[i];
    const toCard = imageCards[i + 1];
    if (fromCard && toCard) {
      canvas.addConnection(storyboardId, {
        from: fromCard.id,
        to: toCard.id,
      });
    }
  }

  // 最后一个图片卡片连接到播放器
  if (imageCards.length > 0 && playerCards.length > 0) {
    const lastImageCard = imageCards[imageCards.length - 1];
    const firstPlayerCard = playerCards[0];
    if (lastImageCard && firstPlayerCard) {
      canvas.addConnection(storyboardId, {
        from: lastImageCard.id,
        to: firstPlayerCard.id,
      });
    }
  }

  console.log(
    `[autoConnectCards] 自动连接完成 - 图片卡片: ${imageCards.length}, 连接数: ${storyboard.connections.length}`
  );
};

// ==================== 重置布局 ====================

const handleResetLayout = (storyboardId: number) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  // 从配置中获取布局参数
  const { imageCard, playerCard, cardPadding, imageCardsPerRow, leftPanelWidth, minPanelWidth } =
    canvasConfig;

  const IMAGE_CARD_WIDTH = imageCard.width;
  // 图片卡片高度（固定）
  const IMAGE_CARD_HEIGHT = imageCard.height;
  const PLAYER_CARD_WIDTH = playerCard.width;
  const PLAYER_CARD_HEIGHT = playerCard.height;

  // 分离图片卡片和视频卡片
  const imageCards = storyboard.cards.filter((card) => card.type === "image");
  const playerCards = storyboard.cards.filter((card) => card.type === "player");

  // 布局图片卡片（Grid 布局：从左到右，从上到下）
  imageCards.forEach((card, index) => {
    const row = Math.floor(index / imageCardsPerRow);
    const col = index % imageCardsPerRow;

    // 正确的网格计算：第一个卡片从 padding 开始，之后每个卡片间有完整的间距
    const x = cardPadding + col * (IMAGE_CARD_WIDTH + cardPadding);
    const y = cardPadding + row * (IMAGE_CARD_HEIGHT + cardPadding);

    canvas.updateCard(card.id, { x, y });
  });

  console.log(
    `[resetLayout] 布局完成 - 图片数:${imageCards.length}, 每行:${imageCardsPerRow}, 播放器:${playerCards.length}, 卡片尺寸:${IMAGE_CARD_WIDTH}x${IMAGE_CARD_HEIGHT}px, 间距:${cardPadding}px`
  );

  // 计算视频卡片的起始 X 坐标（在图片卡片区域右侧）
  // 如果图片数量少于每行配置数量，则紧跟在最后一张图片后面
  const actualColumns = Math.min(imageCards.length, imageCardsPerRow);
  // 网格宽度 = 列数 * 卡片宽度 + (列数 - 1) * 间距
  const imageGridWidth =
    actualColumns > 0 ? actualColumns * IMAGE_CARD_WIDTH + (actualColumns - 1) * cardPadding : 0;
  const playerStartX = cardPadding + imageGridWidth + cardPadding;

  // 布局视频卡片（在最右侧，垂直排列）
  playerCards.forEach((card, index) => {
    const x = playerStartX;
    const y = cardPadding + index * (PLAYER_CARD_HEIGHT + cardPadding);

    canvas.updateCard(card.id, { x, y });
  });

  // 重置故事板宽度（根据内容自适应）
  const contentWidth =
    cardPadding +
    imageGridWidth +
    cardPadding +
    (playerCards.length > 0 ? PLAYER_CARD_WIDTH + cardPadding : 0);
  const newWidth = Math.max(minPanelWidth, contentWidth);

  canvas.updateStoryboard(storyboardId, {
    width: leftPanelWidth + newWidth,
  });
};

// ==================== 生成故事板 ====================

const handleGenerate = async (prompt: string, charFiles: File[], sceneFile: File | null) => {
  isThinking.value = true;

  try {
    const split_char = "|!!!|";

    // 批量压缩图片
    console.log("[handleGenerate] 开始批量压缩图片");
    const filesToCompress: File[] = [...charFiles];
    if (sceneFile) {
      filesToCompress.push(sceneFile);
    }

    const compressedFiles = await compressImages(filesToCompress);
    console.log("[handleGenerate] 图片压缩完成");

    // 分离压缩后的角色图片和场景图片
    const compressedCharFiles = compressedFiles.slice(0, charFiles.length);
    const compressedSceneFile = sceneFile ? compressedFiles[charFiles.length] : null;

    // 批量上传图片文件并获取 file_id
    console.log("[handleGenerate] 开始批量上传图片");
    const uploadPromises: Promise<{ id: string; type: "char" | "scene" }>[] = [];

    // 批量上传多张角色图片
    const cozeClient = getCozeClientInstance();
    if (compressedCharFiles && compressedCharFiles.length > 0) {
      console.log(`[handleGenerate] 添加 ${compressedCharFiles.length} 张角色图片到上传队列`);
      compressedCharFiles.forEach((charFile, index) => {
        uploadPromises.push(
          cozeClient.uploadFile(charFile).then((result) => {
            console.log(
              `[handleGenerate] 角色图片 ${index + 1} 上传成功，file_id:`,
              result?.data?.id
            );
            return { id: result?.data?.id || "", type: "char" as const };
          })
        );
      });
    }

    if (compressedSceneFile) {
      console.log("[handleGenerate] 添加场景图片到上传队列");
      uploadPromises.push(
        cozeClient.uploadFile(compressedSceneFile).then((result) => {
          console.log("[handleGenerate] 场景图片上传成功，file_id:", result?.data?.id);
          return { id: result?.data?.id || "", type: "scene" as const };
        })
      );
    }

    // 使用 Promise.all 批量上传
    const uploadResults = await Promise.all(uploadPromises);
    console.log("[handleGenerate] 批量上传完成，结果:", uploadResults);

    const fileIds = uploadResults.map((r) => r.id).filter(Boolean);

    // 调用文本转分镜工作流（异步任务，不等待结果）
    const workflowParams: any = {};
    if (fileIds.length > 0) {
      workflowParams.reference_images = fileIds.join(split_char);
      console.log(
        "[handleGenerate] 传递给工作流的 reference_images:",
        workflowParams.reference_images
      );
    } else {
      console.log("[handleGenerate] 未上传参考图片");
    }

    console.log("[handleGenerate] 调用文本转分镜工作流，提示词:", prompt);
    const result = await textToVideoShots(prompt, workflowParams);

    console.log("[handleGenerate] 工作流已提交（异步执行），返回结果:", result);
    console.log("[handleGenerate] execute_id:", result?.execute_id);

    // TEXT_TO_VIDEO_SHOTS 是异步工作流，只需显示成功提示
    if (result?.code === 0) {
      notify.success("分镜生成任务已成功提交！", "提交成功", 4000);
    } else {
      notify.error("任务提交失败，请重试", "提交失败");
    }
  } catch (error) {
    console.error("[handleGenerate] 生成失败:", error);
    notify.error("生成失败，请重试", "生成失败");
  } finally {
    isThinking.value = false;
  }
};

// ==================== 初始化加载 ====================

/**
 * 从数据创建或更新故事板（融合逻辑）
 */
const mergeOrCreateStoryboardFromData = (bookId: string, items: any[]) => {
  const split_char = "|!!!|";

  // 查找 order_index="0" 的元数据项
  const metadataItem = items.find(
    (item: any) =>
      item.order_index === "0" ||
      item.orderIndex === "0" ||
      item.order_index === 0 ||
      item.orderIndex === 0
  );

  // 尝试解析 metadata
  let metadata = metadataItem?.metadata || {};
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.error("解析 metadata 失败:", e);
      metadata = {};
    }
  }

  // 从 metadata 中提取信息
  const title = metadata.title || metadataItem?.title || items[0]?.title || `项目 ${bookId}`;
  const scriptText = metadata.scriptText || metadataItem?.script || items[0]?.script || "";
  const referenceImages = metadata.reference_images || metadataItem?.reference_images || "";

  // 解析 reference_images（支持多张角色图片）
  let characterFileIds: string[] = [];
  let sceneFileId: string | undefined;

  if (referenceImages && typeof referenceImages === "string") {
    const fileIds = referenceImages.split(split_char).filter(Boolean);
    console.log("[mergeOrCreateStoryboardFromData] 解析 reference_images:", fileIds);

    // 假设最后一个是场景图片，其余都是角色图片
    if (fileIds.length > 1) {
      sceneFileId = fileIds[fileIds.length - 1];
      characterFileIds = fileIds.slice(0, -1);
    } else if (fileIds.length === 1 && fileIds[0]) {
      characterFileIds = [fileIds[0]];
    }

    console.log("[mergeOrCreateStoryboardFromData] 角色图片 file_ids:", characterFileIds);
    console.log("[mergeOrCreateStoryboardFromData] 场景图片 file_id:", sceneFileId);
  }

  // 构建卡片数据
  const cardsData = items.map((item: any, idx: number) => {
    // 处理图片 URL：如果 output_images 存在，split 并获取最后一个
    let imageUrl = item.image_url || item.imageUrl || item.image || item.url || "";

    if (item.output_images && typeof item.output_images === "string") {
      const images = item.output_images.split(split_char).filter(Boolean);
      if (images.length > 0) {
        imageUrl = images[images.length - 1];
        console.log(`[mergeOrCreateStoryboardFromData] 分镜 ${idx + 1} 图片链接:`, imageUrl);
      }
    }

    return {
      shotId: item.id,
      title: item.title || item.name || `分镜 ${idx + 1}`,
      description: item.prompt || item.description || item.text || "",
      cameraMovement: item.camera_movement || item.cameraMovement || item.camera,
      imageUrl,
      rawData: item,
    };
  });

  // 尝试融合数据
  const mergedStoryboard = canvas.mergeOrCreateStoryboard(bookId, {
    title,
    scriptText,
    characterReferenceImageFileIds: characterFileIds,
    sceneReferenceImageFileId: sceneFileId,
    cards: cardsData,
  });

  if (mergedStoryboard) {
    console.log(`[mergeOrCreateStoryboardFromData] 已融合故事板，bookId: ${bookId}`);

    // 自动准备播放器（如果有图片卡片）
    const player = mergedStoryboard.cards.find((c) => c.type === "player");
    const hasImages = mergedStoryboard.cards.some(
      (c) => c.type === "image" && (c as ImageCard).imageUrl
    );
    if (player && hasImages) {
      console.log(`[mergeOrCreateStoryboardFromData] 融合后自动准备播放器，playerId: ${player.id}`);
      canvas.preparePlayer(player.id);
    }

    // 融合成功，不需要重新布局（保留用户调整的位置）
    return;
  }

  // 如果返回 null，表示需要创建新故事板
  console.log(`[mergeOrCreateStoryboardFromData] 创建新故事板，bookId: ${bookId}`);

  const { imageCard, playerCard, cardPadding, imageCardsPerRow, leftPanelWidth, minPanelWidth } =
    canvasConfig;

  const IMAGE_CARD_WIDTH = imageCard.width;
  const PLAYER_CARD_WIDTH = playerCard.width;

  const initialY = 100;

  // 计算故事板宽度（用于初始化和横向排列）
  const actualShotColumns = Math.min(items.length, imageCardsPerRow);
  const actualImageGridWidth =
    actualShotColumns > 0
      ? actualShotColumns * IMAGE_CARD_WIDTH + (actualShotColumns - 1) * cardPadding
      : 0;
  const actualShotPanelWidth = Math.max(
    minPanelWidth,
    cardPadding + actualImageGridWidth + cardPadding + PLAYER_CARD_WIDTH + cardPadding
  );
  const actualContainerWidth = leftPanelWidth + actualShotPanelWidth;

  // 计算故事板的 X 坐标（需要考虑已存在的故事板）
  const existingStoryboardsCount = canvas.state.storyboards.length;
  const initialX = existingStoryboardsCount * (actualContainerWidth + 100);

  // 创建故事板
  const newStoryboard = canvas.addStoryboard({
    title,
    x: initialX,
    y: initialY,
    width: actualContainerWidth,
    bookId,
    scriptText,
    characterReferenceImageFileIds: characterFileIds,
    sceneReferenceImageFileId: sceneFileId,
    cards: [],
    connections: [],
  });

  if (!newStoryboard) return;

  // 创建分镜卡片
  cardsData.forEach((cardData) => {
    canvas.addCard(newStoryboard.id, {
      type: "image" as const,
      x: 0,
      y: 0,
      title: cardData.title,
      description: cardData.description,
      cameraMovement: cardData.cameraMovement,
      isLoading: false,
      imageUrl: cardData.imageUrl || "",
      shotId: cardData.shotId,
      rawData: cardData.rawData,
    } as Omit<ImageCard, "id">);
  });

  // 添加播放器卡片
  canvas.addCard(newStoryboard.id, {
    type: "player" as const,
    x: 0,
    y: 0,
    isReady: false,
    isPlaying: false,
    playlist: [],
    currentFrame: 0,
  } as Omit<PlayerCard, "id">);

  // 统一布局
  handleResetLayout(newStoryboard.id);

  // 自动连接节点
  autoConnectCards(newStoryboard.id);

  // 自动准备播放器（如果有图片卡片）
  const player = newStoryboard.cards.find((c) => c.type === "player");
  const hasImages = newStoryboard.cards.some(
    (c) => c.type === "image" && (c as ImageCard).imageUrl
  );
  if (player && hasImages) {
    console.log(`[mergeOrCreateStoryboardFromData] 自动准备播放器，playerId: ${player.id}`);
    canvas.preparePlayer(player.id);
  }
};

/**
 * 加载初始数据（融合逻辑）
 */
const loadInitialData = async () => {
  isThinking.value = true;

  try {
    const groupedData = await getAllDataGroupedByBookId();
    console.log("加载的数据:", groupedData);

    // 按 book_id 融合或创建故事板
    const bookIds = Object.keys(groupedData);
    bookIds.forEach((bookId) => {
      const items = groupedData[bookId];
      if (items && items.length > 0) {
        mergeOrCreateStoryboardFromData(bookId, items);
      }
    });

    // 删除在新数据中不存在的故事板
    const existingStoryboards = [...canvas.state.storyboards];
    existingStoryboards.forEach((storyboard) => {
      if (storyboard.bookId && !groupedData[storyboard.bookId]) {
        console.log(`[loadInitialData] 删除不存在的故事板，bookId: ${storyboard.bookId}`);
        canvas.removeStoryboard(storyboard.id);
      }
    });

    if (bookIds.length === 0) {
      console.log("没有数据，显示空画布");
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    isThinking.value = false;
  }
};

// 监听画布刷新事件
const handleCanvasRefresh = async () => {
  console.log("[CanvasView] 收到画布刷新事件，开始刷新数据...");
  await loadInitialData();
  notify.success("数据已刷新", "异步任务完成");
};

// 监听工作流完成事件（可选，用于更精细的处理）
const handleWorkflowCompleted = (data: any) => {
  console.log("[CanvasView] 工作流完成:", data);
  // 可以根据 workflowKey 做不同的处理
  if (data.workflowKey === "GENERATE_VIDEO") {
    console.log("[CanvasView] 视频生成完成，输出:", data.output);
  }
};

// 页面加载时初始化数据
onMounted(async () => {
  await loadInitialData();

  // 监听画布刷新事件
  eventBus.on("canvas:refresh", handleCanvasRefresh);
  eventBus.on("workflow:completed", handleWorkflowCompleted);

  console.log("[CanvasView] 已注册事件监听器");
});

onUnmounted(() => {
  // 清理事件监听器
  eventBus.off("canvas:refresh", handleCanvasRefresh);
  eventBus.off("workflow:completed", handleWorkflowCompleted);

  console.log("[CanvasView] 已清理事件监听器");
});
</script>

<style scoped>
/* 样式已在组件中定义 */
</style>
