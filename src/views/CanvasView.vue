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
              @retry="handleRetryCard"
              @delete="handleDeleteCard"
            />
          </template>
        </CanvasStoryboard>
      </div>
    </div>

    <!-- 底部控制条 -->
    <CanvasControls
      :is-thinking="isThinking"
      :character-reference-image="canvas.state.characterReferenceImage"
      :scene-reference-image="canvas.state.sceneReferenceImage"
      @generate="handleGenerate"
      @update:character-reference-image="canvas.setCharacterReference"
      @update:scene-reference-image="canvas.setSceneReference"
    />

    <!-- 右下角控制按钮 -->
    <div class="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
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
import { ref, computed, onMounted } from "vue";
import { useCanvas, useTheme } from "@/composables";
import {
  textToVideoShots,
  getAllDataGroupedByBookId,
  generateVideo,
  cozeClient,
} from "@/services/canvas";
import { canvasConfig } from "@/config";
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

const canvasStyle = computed(() => canvas.canvasStyle.value);

// ==================== 画布操作 ====================

const handleCanvasMouseDown = (e: MouseEvent) => {
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

const handleCloseStoryboard = (storyboardId: number) => {
  canvas.removeStoryboard(storyboardId);
};

const handleUpdateHeight = () => {
  // 高度更新由组件内部处理，这里可以不做操作
};

// ==================== 辅助函数 ====================

/**
 * 从工作流返回结果中提取图片 URL
 * 优先使用 output_images，并获取最后一个
 */
const extractImageUrl = (result: any): string | null => {
  const split_char = "|!!!|";

  // 尝试从 dataJSON.output_images 中提取
  if (result?.dataJSON?.output_images && typeof result.dataJSON.output_images === "string") {
    const images = result.dataJSON.output_images.split(split_char).filter(Boolean);
    if (images.length > 0) {
      console.log(`[extractImageUrl] 从 output_images 提取，共 ${images.length} 张，使用最后一张`);
      return images[images.length - 1];
    }
  }

  // 兼容：尝试从 dataJSON.output 中提取
  if (result?.dataJSON?.output?.[0]) {
    console.log(`[extractImageUrl] 从 output[0] 提取`);
    return result.dataJSON.output[0];
  }

  console.warn(`[extractImageUrl] 未找到有效的图片 URL`);
  return null;
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

const handleDeleteCard = (cardId: number) => {
  canvas.removeCard(cardId);
};

const handleRetryCard = async (cardId: number, newDescription: string) => {
  const card = canvas.findCardById(cardId) as ImageCard;
  const storyboard = canvas.findStoryboardByCardId(cardId);

  if (!card || !storyboard) {
    console.error("[handleRetryCard] 未找到卡片或故事板");
    return;
  }

  try {
    console.log(`[handleRetryCard] 开始重新生成图片，卡片 ID: ${cardId}`);

    // 更新描述并设置加载状态
    canvas.updateCard(cardId, {
      description: newDescription,
      isLoading: true,
    });

    // 从故事板中获取参考图片的 file_id
    const imageFiles: { file_id: string }[] = [];
    if (storyboard.characterReferenceImageFileId) {
      imageFiles.push({ file_id: storyboard.characterReferenceImageFileId });
    }
    if (storyboard.sceneReferenceImageFileId) {
      imageFiles.push({ file_id: storyboard.sceneReferenceImageFileId });
    }

    console.log(`[handleRetryCard] 使用参考图片:`, imageFiles);

    // 调用生成视频/图片工作流
    const result = await generateVideo({
      prompt: newDescription,
      image: imageFiles,
      book_id: storyboard.bookId || "",
      id: card.shotId || card.id,
    });

    console.log(`[handleRetryCard] 生成完成:`, result);

    // 更新卡片状态（使用辅助函数提取图片 URL）
    const imageUrl = extractImageUrl(result);
    if (imageUrl) {
      canvas.updateCard(cardId, {
        isLoading: false,
        imageUrl,
      });
      alert("图片重新生成成功！");
    } else {
      canvas.updateCard(cardId, { isLoading: false });
      alert("图片重新生成失败，返回结果为空");
    }
  } catch (error) {
    console.error(`[handleRetryCard] 生成失败:`, error);
    canvas.updateCard(cardId, { isLoading: false });
    alert("图片重新生成失败，请重试");
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
    if (!shotPanel || !cardEl) return;

    // 获取连接点元素
    const connectorDot = cardEl.querySelector('[data-connector-type="out"]');
    if (!connectorDot) return;

    const sbRect = shotPanel.getBoundingClientRect();
    const dotRect = connectorDot.getBoundingClientRect();

    // 起点：连接器的中心点（已考虑缩放）
    const startX = (dotRect.left - sbRect.left + dotRect.width / 2) / canvas.state.zoom;
    const startY = (dotRect.top - sbRect.top + dotRect.height / 2) / canvas.state.zoom;

    // 终点：鼠标位置（已考虑缩放）
    const endX = (e.clientX - sbRect.left) / canvas.state.zoom;
    const endY = (e.clientY - sbRect.top) / canvas.state.zoom;

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

const handleTogglePlay = (playerId: number) => {
  const playerCard = canvas.findCardById(playerId) as PlayerCard;
  if (!playerCard || playerCard.type !== "player") return;

  if (playerCard.isPlaying) {
    canvas.stopPlayback(playerId);
  } else {
    canvas.startPlayback(playerId, (frame) => {
      console.log("播放帧:", frame);
    });
  }
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
    const imageFiles: { file_id: string }[] = [];
    if (storyboard.characterReferenceImageFileId) {
      imageFiles.push({ file_id: storyboard.characterReferenceImageFileId });
    }
    if (storyboard.sceneReferenceImageFileId) {
      imageFiles.push({ file_id: storyboard.sceneReferenceImageFileId });
    }

    console.log(`[confirmExecute] 开始批量生图，共 ${imageCards.length} 个节点`);
    console.log(`[confirmExecute] 使用参考图片:`, imageFiles);

    // 批量执行生图任务
    const tasks = imageCards.map(async (card, index) => {
      try {
        console.log(`[confirmExecute] 正在生成第 ${index + 1}/${imageCards.length} 个图片...`);

        // 设置加载状态
        canvas.updateCard(card.id, { isLoading: true });

        // 调用生成视频/图片工作流
        const result = await generateVideo({
          prompt: card.description,
          image: imageFiles,
          book_id: storyboard.bookId || "",
          id: card.shotId || card.id,
        });

        console.log(`[confirmExecute] 第 ${index + 1} 个图片生成完成:`, result);

        // 更新卡片状态（使用辅助函数提取图片 URL）
        const imageUrl = extractImageUrl(result);
        if (imageUrl) {
          canvas.updateCard(card.id, {
            isLoading: false,
            imageUrl,
          });
        } else {
          canvas.updateCard(card.id, { isLoading: false });
        }
      } catch (error) {
        console.error(`[confirmExecute] 第 ${index + 1} 个图片生成失败:`, error);
        canvas.updateCard(card.id, { isLoading: false });
      }
    });

    // 等待所有任务完成
    await Promise.all(tasks);

    console.log(`[confirmExecute] 批量生图完成`);
    alert(`生图任务已完成，共生成 ${imageCards.length} 张图片`);

    // 生图完成后，准备播放器
    const playerCard = storyboard.cards.find((c) => c.type === "player");
    if (playerCard) {
      canvas.preparePlayer(playerCard.id);
    }
  } catch (error) {
    console.error("[confirmExecute] 批量生图失败:", error);
    alert("批量生图失败，请重试");
  } finally {
    isThinking.value = false;
  }
};

// ==================== 下载故事板 ====================

const handleDownloadStoryboard = async (storyboardId: number) => {
  const storyboard = canvas.findStoryboardById(storyboardId);
  if (!storyboard) return;

  // 使用 JSZip 打包下载（需要安装依赖）
  alert("下载功能需要安装 jszip 库，暂未实现");
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

const handleGenerate = async (prompt: string, charFile: File | null, sceneFile: File | null) => {
  isThinking.value = true;

  try {
    const split_char = "|!!!|";

    // 批量上传图片文件并获取 file_id
    console.log("[handleGenerate] 开始批量上传图片");
    const uploadPromises: Promise<{ id: string; type: "char" | "scene" }>[] = [];

    if (charFile) {
      console.log("[handleGenerate] 添加角色图片到上传队列");
      uploadPromises.push(
        cozeClient.uploadFile(charFile).then((result) => {
          console.log("[handleGenerate] 角色图片上传成功，file_id:", result?.data?.id);
          return { id: result?.data?.id || "", type: "char" as const };
        })
      );
    }

    if (sceneFile) {
      console.log("[handleGenerate] 添加场景图片到上传队列");
      uploadPromises.push(
        cozeClient.uploadFile(sceneFile).then((result) => {
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
    await textToVideoShots(prompt, workflowParams);

    console.log("[handleGenerate] 工作流已提交，等待后台处理");
    alert("生成任务已提交，请稍后刷新查看结果");
  } catch (error) {
    console.error("[handleGenerate] 生成失败:", error);
    alert("生成失败，请重试");
  } finally {
    isThinking.value = false;
  }
};

// ==================== 初始化加载 ====================

/**
 * 从数据创建故事板
 */
const createStoryboardFromData = (bookId: string, items: any[], index: number) => {
  // 使用配置文件中的值
  const { imageCard, playerCard, cardPadding, imageCardsPerRow, leftPanelWidth, minPanelWidth } =
    canvasConfig;

  const IMAGE_CARD_WIDTH = imageCard.width;
  const PLAYER_CARD_WIDTH = playerCard.width;

  // 计算故事板位置（横向排列，间距 100px）
  const initialY = 100;

  // 查找 order_index="0" 的元数据项（order_index 是字符串）
  const metadataItem = items.find(
    (item: any) =>
      item.order_index === "0" ||
      item.orderIndex === "0" ||
      item.order_index === 0 ||
      item.orderIndex === 0
  );

  // 尝试多种方式读取 metadata
  let metadata = metadataItem?.metadata || {};

  // 如果 metadata 是字符串，尝试解析
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch (e) {
      console.error("解析 metadata 失败:", e);
      metadata = {};
    }
  }

  // 从 metadata 中提取信息，如果没有则使用默认值
  const title = metadata.title || metadataItem?.title || items[0]?.title || `项目 ${bookId}`;
  const scriptText = metadata.scriptText || metadataItem?.script || items[0]?.script || "";
  const referenceImages = metadata.reference_images || metadataItem?.reference_images || "";

  // 解析 reference_images，按分隔符拆分为 file_id 数组
  const split_char = "|!!!|";
  let characterFileId: string | undefined;
  let sceneFileId: string | undefined;

  if (referenceImages && typeof referenceImages === "string") {
    const fileIds = referenceImages.split(split_char).filter(Boolean);
    console.log("[createStoryboardFromData] 解析 reference_images:", fileIds);

    if (fileIds.length > 0) {
      characterFileId = fileIds[0];
      console.log("[createStoryboardFromData] 角色参考 file_id:", characterFileId);
    }

    if (fileIds.length > 1) {
      sceneFileId = fileIds[1];
      console.log("[createStoryboardFromData] 场景参考 file_id:", sceneFileId);
    }
  }

  // 计算故事板宽度（用于初始化和横向排列）
  const actualShotColumns = Math.min(items.length, imageCardsPerRow);
  // 网格宽度 = 列数 * 卡片宽度 + (列数 - 1) * 间距
  const actualImageGridWidth =
    actualShotColumns > 0
      ? actualShotColumns * IMAGE_CARD_WIDTH + (actualShotColumns - 1) * cardPadding
      : 0;
  const actualShotPanelWidth = Math.max(
    minPanelWidth,
    cardPadding + actualImageGridWidth + cardPadding + PLAYER_CARD_WIDTH + cardPadding
  );
  const actualContainerWidth = leftPanelWidth + actualShotPanelWidth;

  // 计算故事板的 X 坐标
  const initialX = index * (actualContainerWidth + 100);

  // 创建故事板
  const newStoryboard = canvas.addStoryboard({
    title,
    x: initialX,
    y: initialY,
    width: actualContainerWidth,
    bookId,
    scriptText,
    characterReferenceImageFileId: characterFileId,
    sceneReferenceImageFileId: sceneFileId,
    cards: [],
    connections: [],
  });

  if (!newStoryboard) return;

  // 创建分镜卡片（初始位置为 0, 0，稍后由 handleResetLayout 统一布局）
  items.forEach((item: any, idx: number) => {
    // 处理图片 URL：如果 output_images 存在，split 并获取最后一个
    let imageUrl = item.image_url || item.imageUrl || item.image || item.url || "";

    if (item.output_images && typeof item.output_images === "string") {
      const images = item.output_images.split(split_char).filter(Boolean);
      if (images.length > 0) {
        imageUrl = images[images.length - 1]; // 获取最后一个图片链接
        console.log(`[createStoryboardFromData] 分镜 ${idx + 1} 图片链接:`, imageUrl);
      }
    }

    canvas.addCard(newStoryboard.id, {
      type: "image" as const,
      x: 0,
      y: 0,
      title: item.title || item.name || `分镜 ${idx + 1}`,
      description: item.prompt || item.description || item.text || "",
      cameraMovement: item.camera_movement || item.cameraMovement || item.camera,
      isLoading: false,
      imageUrl,
      shotId: item.id,
      rawData: item,
    } as Omit<ImageCard, "id">);
  });

  // 添加播放器卡片（初始位置为 0, 0，稍后由 handleResetLayout 统一布局）
  canvas.addCard(newStoryboard.id, {
    type: "player" as const,
    x: 0,
    y: 0,
    isReady: false,
    isPlaying: false,
    playlist: [],
    currentFrame: 0,
  } as Omit<PlayerCard, "id">);

  // 统一布局：调用 handleResetLayout 来计算并设置所有卡片的正确位置
  handleResetLayout(newStoryboard.id);

  // 自动连接节点：按索引顺序连接所有卡片
  autoConnectCards(newStoryboard.id);
};

/**
 * 加载初始数据
 */
const loadInitialData = async () => {
  isThinking.value = true;

  try {
    const groupedData = await getAllDataGroupedByBookId();
    console.log("加载的数据:", groupedData);

    // 按 book_id 创建故事板
    const bookIds = Object.keys(groupedData);
    bookIds.forEach((bookId, index) => {
      const items = groupedData[bookId];
      if (items && items.length > 0) {
        createStoryboardFromData(bookId, items, index);
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

// 页面加载时初始化数据
onMounted(() => {
  loadInitialData();
});
</script>

<style scoped>
/* 样式已在组件中定义 */
</style>
