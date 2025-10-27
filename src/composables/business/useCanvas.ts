/**
 * 画布状态管理
 */

import { reactive, computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { canvasConfig } from "@/config";
import type {
  CanvasState,
  Storyboard,
  Card,
  ImageCard,
  PlayerCard,
  Connection,
} from "@/typings/canvas";

// 使用 LocalStorage 持久化数据
const persistedStoryboards = useLocalStorage<Storyboard[]>("canvas-storyboards", []);
const persistedNextStoryboardId = useLocalStorage<number>("canvas-next-storyboard-id", 0);
const persistedNextCardId = useLocalStorage<number>("canvas-next-card-id", 0);
const persistedPan = useLocalStorage<{ x: number; y: number }>("canvas-pan", { x: 0, y: 0 });
const persistedZoom = useLocalStorage<number>("canvas-zoom", 1);

const state = reactive<CanvasState>({
  pan: persistedPan.value,
  zoom: persistedZoom.value,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  storyboards: persistedStoryboards.value,
  nextStoryboardId: persistedNextStoryboardId.value,
  nextCardId: persistedNextCardId.value,
  activeModifyCardId: null,
  activeExecuteStoryboardId: null,
  characterReferenceImage: null,
  sceneReferenceImage: null,
  isConnecting: false,
  connectionStart: null,
  playbackIntervals: {},
});

// 监听 storyboards 变化并自动保存到 LocalStorage
watch(
  () => state.storyboards,
  (newValue) => {
    persistedStoryboards.value = newValue;
  },
  { deep: true }
);

// 监听 ID 计数器变化并自动保存
watch(
  () => state.nextStoryboardId,
  (newValue) => {
    persistedNextStoryboardId.value = newValue;
  }
);

watch(
  () => state.nextCardId,
  (newValue) => {
    persistedNextCardId.value = newValue;
  }
);

// 监听画布平移和缩放变化并自动保存
watch(
  () => state.pan,
  (newValue) => {
    persistedPan.value = newValue;
  },
  { deep: true }
);

watch(
  () => state.zoom,
  (newValue) => {
    persistedZoom.value = newValue;
  }
);

export function useCanvas() {
  // ==================== 画布变换 ====================

  /** 更新画布变换 */
  const updateCanvasTransform = () => {
    return {
      transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
    };
  };

  /** 开始拖动画布 */
  const startPanning = (clientX: number, clientY: number) => {
    state.isPanning = true;
    state.panStart.x = clientX - state.pan.x;
    state.panStart.y = clientY - state.pan.y;
  };

  /** 拖动画布中 */
  const panCanvas = (clientX: number, clientY: number) => {
    if (!state.isPanning) return;
    state.pan.x = clientX - state.panStart.x;
    state.pan.y = clientY - state.panStart.y;
  };

  /** 停止拖动画布 */
  const stopPanning = () => {
    state.isPanning = false;
  };

  /** 缩放画布 */
  const zoomCanvas = (delta: number, mouseX: number, mouseY: number) => {
    const zoomFactor = 1.1;
    const oldZoom = state.zoom;

    if (delta < 0) {
      state.zoom = Math.min(3, state.zoom * zoomFactor);
    } else {
      state.zoom = Math.max(0.2, state.zoom / zoomFactor);
    }

    state.pan.x = mouseX - (mouseX - state.pan.x) * (state.zoom / oldZoom);
    state.pan.y = mouseY - (mouseY - state.pan.y) * (state.zoom / oldZoom);
  };

  /** 放大 */
  const zoomIn = () => {
    state.zoom = Math.min(3, state.zoom * 1.2);
  };

  /** 缩小 */
  const zoomOut = () => {
    state.zoom = Math.max(0.2, state.zoom * 0.8);
  };

  /** 重置视图 */
  const resetView = () => {
    state.zoom = 1;
    state.pan.x = 0;
    state.pan.y = 0;
  };

  // ==================== 故事板管理 ====================

  /** 添加故事板 */
  const addStoryboard = (storyboard: Omit<Storyboard, "id">) => {
    const newStoryboard: Storyboard = {
      ...storyboard,
      id: state.nextStoryboardId++,
    };
    state.storyboards.push(newStoryboard);
    return newStoryboard;
  };

  /** 删除故事板 */
  const removeStoryboard = (id: number) => {
    const index = state.storyboards.findIndex((sb) => sb.id === id);
    if (index !== -1) {
      // 清理播放器定时器
      const storyboard = state.storyboards[index];
      if (storyboard) {
        storyboard.cards.forEach((card) => {
          if (card.type === "player" && state.playbackIntervals[card.id]) {
            clearInterval(state.playbackIntervals[card.id]);
            delete state.playbackIntervals[card.id];
          }
        });
      }
      state.storyboards.splice(index, 1);
    }
  };

  /** 更新故事板 */
  const updateStoryboard = (id: number, updates: Partial<Storyboard>) => {
    const storyboard = state.storyboards.find((sb) => sb.id === id);
    if (storyboard) {
      Object.assign(storyboard, updates);
    }
  };

  /** 根据 ID 查找故事板 */
  const findStoryboardById = (id: number) => {
    return state.storyboards.find((sb) => sb.id === id);
  };

  /** 根据卡片 ID 查找故事板 */
  const findStoryboardByCardId = (cardId: number) => {
    return state.storyboards.find((sb) => sb.cards.some((c) => c.id === cardId));
  };

  // ==================== 卡片管理 ====================

  /** 添加卡片 */
  const addCard = (storyboardId: number, card: Omit<Card, "id">) => {
    const storyboard = findStoryboardById(storyboardId);
    if (!storyboard) return null;

    const newCard = {
      ...card,
      id: state.nextCardId++,
    } as Card;

    storyboard.cards.push(newCard);
    return newCard;
  };

  /** 删除卡片 */
  const removeCard = (cardId: number) => {
    const storyboard = findStoryboardByCardId(cardId);
    if (!storyboard) return;

    // 清理连接
    storyboard.connections = storyboard.connections.filter(
      (conn) => conn.from !== cardId && conn.to !== cardId
    );

    // 清理播放器定时器
    if (state.playbackIntervals[cardId]) {
      clearInterval(state.playbackIntervals[cardId]);
      delete state.playbackIntervals[cardId];
    }

    // 删除卡片
    const index = storyboard.cards.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      storyboard.cards.splice(index, 1);
    }
  };

  /** 更新卡片 */
  const updateCard = (cardId: number, updates: Partial<Card>) => {
    console.log(`[updateCard] 更新卡片 ${cardId}:`, updates);

    const storyboard = findStoryboardByCardId(cardId);
    if (!storyboard) {
      console.error(`[updateCard] ❌ 未找到卡片 ${cardId} 所属的故事板`);
      return;
    }

    const card = storyboard.cards.find((c) => c.id === cardId);
    if (card) {
      console.log(`[updateCard] 找到卡片，更新前状态:`, card);
      Object.assign(card, updates);
      console.log(`[updateCard] 更新后状态:`, card);
    } else {
      console.error(`[updateCard] ❌ 在故事板中未找到卡片 ${cardId}`);
    }
  };

  /** 根据 ID 查找卡片 */
  const findCardById = (cardId: number) => {
    const storyboard = findStoryboardByCardId(cardId);
    return storyboard?.cards.find((c) => c.id === cardId);
  };

  // ==================== 连接线管理 ====================

  /** 添加连接 */
  const addConnection = (storyboardId: number, connection: Connection) => {
    const storyboard = findStoryboardById(storyboardId);
    if (!storyboard) return;

    // 检查是否已存在相同的连接
    const exists = storyboard.connections.some(
      (conn) => conn.from === connection.from && conn.to === connection.to
    );

    if (exists) {
      console.log("[addConnection] 连接已存在，跳过");
      return;
    }

    // 一个输出端口只能连接一条线：删除该 from 节点的所有现有连接
    const existingFromConnections = storyboard.connections.filter(
      (conn) => conn.from === connection.from
    );

    if (existingFromConnections.length > 0) {
      console.log(
        `[addConnection] 删除节点 ${connection.from} 的 ${existingFromConnections.length} 条现有输出连接`
      );
      storyboard.connections = storyboard.connections.filter(
        (conn) => conn.from !== connection.from
      );
    }

    // 一个输入端口只能连接一条线：删除该 to 节点的所有现有连接
    const existingToConnections = storyboard.connections.filter(
      (conn) => conn.to === connection.to
    );

    if (existingToConnections.length > 0) {
      console.log(
        `[addConnection] 删除节点 ${connection.to} 的 ${existingToConnections.length} 条现有输入连接`
      );
      storyboard.connections = storyboard.connections.filter((conn) => conn.to !== connection.to);
    }

    // 添加新连接
    console.log(`[addConnection] 添加新连接: ${connection.from} -> ${connection.to}`);
    storyboard.connections.push(connection);
  };

  /** 删除连接 */
  const removeConnection = (storyboardId: number, from: number, to: number) => {
    const storyboard = findStoryboardById(storyboardId);
    if (!storyboard) return;

    storyboard.connections = storyboard.connections.filter(
      (conn) => !(conn.from === from && conn.to === to)
    );
  };

  // ==================== 播放器管理 ====================

  /** 开始播放 */
  const startPlayback = (playerId: number, onFrame: (frame: number) => void) => {
    const card = findCardById(playerId) as PlayerCard;

    console.log("[startPlayback] 开始播放，playerId:", playerId);
    console.log("[startPlayback] 播放器卡片:", card);

    if (!card || card.type !== "player") {
      console.warn("[startPlayback] 卡片不存在或类型不是播放器");
      return;
    }

    if (!card.isReady) {
      console.warn("[startPlayback] 播放器未准备好");
      return;
    }

    if (card.playlist.length === 0) {
      console.warn("[startPlayback] 播放列表为空");
      return;
    }

    console.log(
      `[startPlayback] 播放列表长度: ${card.playlist.length}, 帧率: ${canvasConfig.player.frameRate}ms, 循环: ${canvasConfig.player.loop}`
    );

    updateCard(playerId, { isPlaying: true, currentFrame: 0 });

    state.playbackIntervals[playerId] = window.setInterval(() => {
      const currentCard = findCardById(playerId) as PlayerCard;
      if (!currentCard || !currentCard.isPlaying) {
        stopPlayback(playerId);
        return;
      }

      const nextFrame = currentCard.currentFrame + 1;

      if (nextFrame >= currentCard.playlist.length) {
        // 播放完成
        if (canvasConfig.player.loop) {
          // 循环播放：回到第一帧
          console.log("[startPlayback] 循环播放，回到第一帧");
          updateCard(playerId, { currentFrame: 0 });
          onFrame(0);
        } else {
          // 不循环：停止播放
          console.log("[startPlayback] 播放完成，停止");
          stopPlayback(playerId);
        }
      } else {
        // 继续播放下一帧
        console.log(`[startPlayback] 播放第 ${nextFrame} 帧`);
        updateCard(playerId, { currentFrame: nextFrame });
        onFrame(nextFrame);
      }
    }, canvasConfig.player.frameRate);
  };

  /** 停止播放 */
  const stopPlayback = (playerId: number) => {
    console.log("[stopPlayback] 停止播放，playerId:", playerId);

    if (state.playbackIntervals[playerId]) {
      console.log("[stopPlayback] 清除播放定时器");
      clearInterval(state.playbackIntervals[playerId]);
      delete state.playbackIntervals[playerId];
    } else {
      console.log("[stopPlayback] 没有找到播放定时器");
    }

    console.log("[stopPlayback] 重置播放状态");
    updateCard(playerId, { isPlaying: false, currentFrame: 0 });
    console.log("[stopPlayback] 停止播放完成");
  };

  /** 准备播放器 */
  const preparePlayer = (playerId: number) => {
    console.log("[preparePlayer] 准备播放器，playerId:", playerId);

    const storyboard = findStoryboardByCardId(playerId);
    if (!storyboard) {
      console.warn("[preparePlayer] 未找到故事板");
      return;
    }

    const playerCard = storyboard.cards.find((c) => c.id === playerId) as PlayerCard;
    if (!playerCard || playerCard.type !== "player") {
      console.warn("[preparePlayer] 播放器卡片不存在或类型错误");
      return;
    }

    console.log("[preparePlayer] 故事板连接线:", storyboard.connections);
    console.log("[preparePlayer] 故事板卡片:", storyboard.cards);

    // 构建播放列表（从连接线倒推）
    const playlist: ImageCard[] = [];
    let currentNodeId: number | undefined = playerId;

    while (currentNodeId !== undefined) {
      const incomingConnection = storyboard.connections.find((c) => c.to === currentNodeId);
      console.log(`[preparePlayer] 查找连接到节点 ${currentNodeId} 的连接:`, incomingConnection);

      if (!incomingConnection) break;

      const fromCard = storyboard.cards.find((c) => c.id === incomingConnection.from);
      console.log(`[preparePlayer] 找到源卡片 (ID: ${incomingConnection.from}):`, fromCard);

      if (fromCard && fromCard.type === "image" && fromCard.imageUrl) {
        playlist.unshift(fromCard as ImageCard);
        console.log(`[preparePlayer] 添加图片到播放列表: ${fromCard.title}`);
      }
      currentNodeId = incomingConnection.from;
    }

    console.log(`[preparePlayer] 播放列表构建完成，共 ${playlist.length} 张图片`);

    if (playlist.length > 0) {
      updateCard(playerId, {
        isReady: true,
        playlist,
        thumbnailUrl: playlist[0]?.imageUrl,
      });
      console.log("[preparePlayer] 播放器已准备就绪");
    } else {
      updateCard(playerId, {
        isReady: false,
        playlist: [],
        thumbnailUrl: undefined,
      });
      console.warn("[preparePlayer] 播放列表为空，播放器未准备好");
    }
  };

  // ==================== 参考图管理 ====================

  /** 设置角色参考图 */
  const setCharacterReference = (image: string | null) => {
    state.characterReferenceImage = image;
  };

  /** 设置场景参考图 */
  const setSceneReference = (image: string | null) => {
    state.sceneReferenceImage = image;
  };

  // ==================== 连接拖拽状态 ====================

  /** 开始连接 */
  const startConnecting = (cardId: number, storyboardId: number) => {
    state.isConnecting = true;
    state.connectionStart = { cardId, storyboardId };
  };

  /** 结束连接 */
  const endConnecting = (targetCardId?: number) => {
    if (state.connectionStart && targetCardId) {
      const { cardId, storyboardId } = state.connectionStart;
      if (cardId !== targetCardId) {
        addConnection(storyboardId, { from: cardId, to: targetCardId });
      }
    }
    state.isConnecting = false;
    state.connectionStart = null;
  };

  /** 取消连接 */
  const cancelConnecting = () => {
    state.isConnecting = false;
    state.connectionStart = null;
  };

  // ==================== 模态框状态 ====================

  /** 设置激活的修改卡片 ID */
  const setActiveModifyCardId = (id: number | null) => {
    state.activeModifyCardId = id;
  };

  /** 设置激活的执行故事板 ID */
  const setActiveExecuteStoryboardId = (id: number | null) => {
    state.activeExecuteStoryboardId = id;
  };

  // ==================== 数据融合 ====================

  /**
   * 融合或创建故事板
   * 如果已存在相同 bookId 的故事板，则更新其数据；否则创建新故事板
   */
  const mergeOrCreateStoryboard = (
    bookId: string,
    newData: {
      title: string;
      scriptText: string;
      characterReferenceImageFileId?: string;
      sceneReferenceImageFileId?: string;
      cards: Array<{
        shotId?: string | number;
        title: string;
        description: string;
        cameraMovement?: string;
        imageUrl?: string;
        rawData?: any;
      }>;
    }
  ) => {
    // 查找是否已存在相同 bookId 的故事板
    const existingStoryboard = state.storyboards.find((sb) => sb.bookId === bookId);

    if (existingStoryboard) {
      console.log(`[mergeOrCreateStoryboard] 发现已存在的故事板，bookId: ${bookId}，开始融合数据`);

      // 更新元数据（但保留位置、尺寸等用户自定义信息）
      existingStoryboard.title = newData.title;
      existingStoryboard.scriptText = newData.scriptText;
      existingStoryboard.characterReferenceImageFileId = newData.characterReferenceImageFileId;
      existingStoryboard.sceneReferenceImageFileId = newData.sceneReferenceImageFileId;

      // 融合卡片数据
      const existingImageCards = existingStoryboard.cards.filter((c) => c.type === "image");
      const existingPlayerCards = existingStoryboard.cards.filter((c) => c.type === "player");

      // 创建 shotId 到现有卡片的映射
      const existingCardsByShotId = new Map<string | number, ImageCard>();
      existingImageCards.forEach((card) => {
        const imageCard = card as ImageCard;
        if (imageCard.shotId !== undefined) {
          existingCardsByShotId.set(imageCard.shotId, imageCard);
        }
      });

      // 处理新数据中的卡片
      const updatedCardIds = new Set<number>();
      newData.cards.forEach((newCardData) => {
        const shotId = newCardData.shotId;
        if (shotId !== undefined) {
          const existingCard = existingCardsByShotId.get(shotId);
          if (existingCard) {
            // 更新已存在的卡片（保留位置信息，只更新内容）
            console.log(`[mergeOrCreateStoryboard] 更新卡片 shotId: ${shotId}`);
            existingCard.title = newCardData.title;
            existingCard.description = newCardData.description;
            existingCard.cameraMovement = newCardData.cameraMovement;
            if (newCardData.imageUrl) {
              existingCard.imageUrl = newCardData.imageUrl;
            }
            existingCard.rawData = newCardData.rawData;
            updatedCardIds.add(existingCard.id);
          } else {
            // 新增卡片
            console.log(`[mergeOrCreateStoryboard] 新增卡片 shotId: ${shotId}`);
            const newCard = addCard(existingStoryboard.id, {
              type: "image" as const,
              x: 0,
              y: 0,
              title: newCardData.title,
              description: newCardData.description,
              cameraMovement: newCardData.cameraMovement,
              isLoading: false,
              imageUrl: newCardData.imageUrl || "",
              shotId,
              rawData: newCardData.rawData,
            } as Omit<ImageCard, "id">);
            if (newCard) {
              updatedCardIds.add(newCard.id);
            }
          }
        }
      });

      // 删除不在新数据中的图片卡片
      const cardsToRemove = existingImageCards.filter((card) => !updatedCardIds.has(card.id));
      cardsToRemove.forEach((card) => {
        console.log(`[mergeOrCreateStoryboard] 删除卡片 id: ${card.id}`);
        removeCard(card.id);
      });

      // 确保播放器卡片存在
      if (existingPlayerCards.length === 0) {
        console.log(`[mergeOrCreateStoryboard] 添加播放器卡片`);
        addCard(existingStoryboard.id, {
          type: "player" as const,
          x: 0,
          y: 0,
          isReady: false,
          isPlaying: false,
          playlist: [],
          currentFrame: 0,
        } as Omit<PlayerCard, "id">);
      }

      return existingStoryboard;
    } else {
      // 创建新故事板
      console.log(`[mergeOrCreateStoryboard] 创建新故事板，bookId: ${bookId}`);
      return null; // 返回 null 表示需要外部创建新故事板
    }
  };

  // ==================== 计算属性 ====================

  const canvasStyle = computed(() => updateCanvasTransform());

  return {
    // 状态
    state,

    // 计算属性
    canvasStyle,

    // 画布变换
    updateCanvasTransform,
    startPanning,
    panCanvas,
    stopPanning,
    zoomCanvas,
    zoomIn,
    zoomOut,
    resetView,

    // 故事板管理
    addStoryboard,
    removeStoryboard,
    updateStoryboard,
    findStoryboardById,
    findStoryboardByCardId,

    // 卡片管理
    addCard,
    removeCard,
    updateCard,
    findCardById,

    // 连接线管理
    addConnection,
    removeConnection,

    // 播放器管理
    startPlayback,
    stopPlayback,
    preparePlayer,

    // 参考图管理
    setCharacterReference,
    setSceneReference,

    // 连接拖拽状态
    startConnecting,
    endConnecting,
    cancelConnecting,

    // 模态框状态
    setActiveModifyCardId,
    setActiveExecuteStoryboardId,

    // 数据融合
    mergeOrCreateStoryboard,
  };
}
