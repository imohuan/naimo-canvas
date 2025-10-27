/**
 * 画布状态管理
 */

import { reactive, computed } from "vue";
import type {
  CanvasState,
  Storyboard,
  Card,
  ImageCard,
  PlayerCard,
  Connection,
} from "@/typings/canvas";

const state = reactive<CanvasState>({
  pan: { x: 0, y: 0 },
  zoom: 1,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  storyboards: [],
  nextStoryboardId: 0,
  nextCardId: 0,
  activeModifyCardId: null,
  activeExecuteStoryboardId: null,
  characterReferenceImage: null,
  sceneReferenceImage: null,
  isConnecting: false,
  connectionStart: null,
  playbackIntervals: {},
});

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
      storyboard.cards.forEach((card) => {
        if (card.type === "player" && state.playbackIntervals[card.id]) {
          clearInterval(state.playbackIntervals[card.id]);
          delete state.playbackIntervals[card.id];
        }
      });
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
    const storyboard = findStoryboardByCardId(cardId);
    if (!storyboard) return;

    const card = storyboard.cards.find((c) => c.id === cardId);
    if (card) {
      Object.assign(card, updates);
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

    // 检查是否已存在
    const exists = storyboard.connections.some(
      (conn) => conn.from === connection.from && conn.to === connection.to
    );

    if (!exists) {
      storyboard.connections.push(connection);
    }
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
    if (!card || card.type !== "player" || !card.isReady || card.playlist.length === 0) return;

    updateCard(playerId, { isPlaying: true, currentFrame: 0 });

    state.playbackIntervals[playerId] = window.setInterval(() => {
      const currentCard = findCardById(playerId) as PlayerCard;
      if (!currentCard || !currentCard.isPlaying) {
        stopPlayback(playerId);
        return;
      }

      const nextFrame = currentCard.currentFrame + 1;
      if (nextFrame >= currentCard.playlist.length) {
        stopPlayback(playerId);
      } else {
        updateCard(playerId, { currentFrame: nextFrame });
        onFrame(nextFrame);
      }
    }, 2000);
  };

  /** 停止播放 */
  const stopPlayback = (playerId: number) => {
    if (state.playbackIntervals[playerId]) {
      clearInterval(state.playbackIntervals[playerId]);
      delete state.playbackIntervals[playerId];
    }
    updateCard(playerId, { isPlaying: false, currentFrame: 0 });
  };

  /** 准备播放器 */
  const preparePlayer = (playerId: number) => {
    const storyboard = findStoryboardByCardId(playerId);
    if (!storyboard) return;

    const playerCard = storyboard.cards.find((c) => c.id === playerId) as PlayerCard;
    if (!playerCard || playerCard.type !== "player") return;

    // 构建播放列表（从连接线倒推）
    const playlist: ImageCard[] = [];
    let currentNodeId: number | undefined = playerId;

    while (currentNodeId !== undefined) {
      const incomingConnection = storyboard.connections.find((c) => c.to === currentNodeId);
      if (!incomingConnection) break;

      const fromCard = storyboard.cards.find((c) => c.id === incomingConnection.from);
      if (fromCard && fromCard.type === "image" && fromCard.imageUrl) {
        playlist.unshift(fromCard as ImageCard);
      }
      currentNodeId = incomingConnection.from;
    }

    if (playlist.length > 0) {
      updateCard(playerId, {
        isReady: true,
        playlist,
        thumbnailUrl: playlist[0].imageUrl,
      });
    } else {
      updateCard(playerId, {
        isReady: false,
        playlist: [],
        thumbnailUrl: undefined,
      });
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
  };
}
