/**
 * 画布配置
 */
export const canvasConfig = {
  /** 图片卡片每行显示数量 */
  imageCardsPerRow: 4,

  /** 图片卡片尺寸 */
  imageCard: {
    /** 宽度 */
    width: 288,
    /** 总高度（固定） */
    height: 380,
    /** 图片高度 */
    imageHeight: 192,
    /** 内容高度（包含padding、文本区域和按钮） */
    contentHeight: 188,
    /** 按钮高度（已包含在contentHeight中） */
    buttonHeight: 0,
  },

  /** 视频卡片尺寸 */
  playerCard: {
    /** 宽度 */
    width: 576,
    /** 总高度（固定） */
    height: 436,
    /** 图片高度 */
    imageHeight: 384,
    /** 控制栏高度 */
    controlHeight: 52,
  },

  /** 卡片间距 */
  cardPadding: 20,

  /** 左侧面板宽度 */
  leftPanelWidth: 320,

  /** 最小面板宽度 */
  minPanelWidth: 1000,

  /** 播放器配置 */
  player: {
    /** 播放帧率（毫秒/帧） */
    frameRate: 2000,
    /** 是否循环播放 */
    loop: true,
  },
} as const;
