/**
 * 画布类型定义
 */

/** 卡片类型 */
export type CardType = "image" | "player";

/** 基础卡片数据 */
export interface BaseCard {
  /** 卡片 ID */
  id: number;
  /** 卡片类型 */
  type: CardType;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
}

/** 图片卡片数据 */
export interface ImageCard extends BaseCard {
  type: "image";
  /** 卡片标题 */
  title: string;
  /** 图片描述/提示词 */
  description: string;
  /** 镜头运动 */
  cameraMovement?: string;
  /** 是否加载中 */
  isLoading: boolean;
  /** 图片 URL */
  imageUrl?: string;
  /** 分镜 ID（对应列表项，字符串类型） */
  shotId?: string;
  /** 原始数据 */
  rawData?: any;
}

/** 播放器卡片数据 */
export interface PlayerCard extends BaseCard {
  type: "player";
  /** 是否准备就绪 */
  isReady: boolean;
  /** 是否播放中 */
  isPlaying: boolean;
  /** 播放列表 */
  playlist: ImageCard[];
  /** 当前帧索引 */
  currentFrame: number;
  /** 缩略图 URL */
  thumbnailUrl?: string;
}

/** 卡片联合类型 */
export type Card = ImageCard | PlayerCard;

/** 连接线数据 */
export interface Connection {
  /** 起始卡片 ID */
  from: number;
  /** 目标卡片 ID */
  to: number;
}

/** 故事板数据 */
export interface Storyboard {
  /** 故事板 ID */
  id: number;
  /** 故事板标题 */
  title: string;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** book_id（项目 ID） */
  bookId: string;
  /** 剧本内容 */
  scriptText?: string;
  /** 角色参考图 URL（已废弃，使用 characterReferenceImageFileIds） */
  characterReferenceImage?: string;
  /** 场景参考图 URL（已废弃，使用 sceneReferenceImageFileId） */
  sceneReferenceImage?: string;
  /** 角色参考图文件 ID 数组（支持多张） */
  characterReferenceImageFileIds?: string[];
  /** 场景参考图文件 ID */
  sceneReferenceImageFileId?: string;
  /** 卡片列表 */
  cards: Card[];
  /** 连接线列表 */
  connections: Connection[];
}

/** 画布状态 */
export interface CanvasState {
  /** 平移坐标 */
  pan: { x: number; y: number };
  /** 缩放比例 */
  zoom: number;
  /** 是否拖动中 */
  isPanning: boolean;
  /** 拖动起始点 */
  panStart: { x: number; y: number };
  /** 故事板列表 */
  storyboards: Storyboard[];
  /** 下一个故事板 ID */
  nextStoryboardId: number;
  /** 下一个卡片 ID */
  nextCardId: number;
  /** 当前激活的修改卡片 ID */
  activeModifyCardId: number | null;
  /** 当前激活的执行故事板 ID */
  activeExecuteStoryboardId: number | null;
  /** 角色参考图数组（支持多张） */
  characterReferenceImages: string[];
  /** 场景参考图 */
  sceneReferenceImage: string | null;
  /** 是否连接中 */
  isConnecting: boolean;
  /** 连接起始信息 */
  connectionStart: {
    cardId: number;
    storyboardId: number;
  } | null;
  /** 播放器定时器 */
  playbackIntervals: Record<number, number>;
}

/** 项目信息（聚合的 book_id） */
export interface ProjectInfo {
  /** 项目 ID */
  bookId: string;
  /** 项目标题 */
  title?: string;
  /** 分镜数量 */
  count?: number;
}

/** 坐标点 */
export interface Point {
  x: number;
  y: number;
}
