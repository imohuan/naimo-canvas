/**
 * 主题配置
 */
export const themeConfig = {
  light: {
    /** 画布背景 */
    canvasBg: "bg-gray-100",
    canvasBgColor: "#f3f4f6",

    /** 网格点颜色 */
    gridColor: "#d1d5db",

    /** 文本颜色 */
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-600",
    textTertiary: "text-gray-500",

    /** 故事板 */
    storyboardBg: "bg-white",
    storyboardBorder: "border-gray-200",
    storyboardHeader: "bg-gray-100/90",
    storyboardPanel: "bg-gray-50/50",

    /** 卡片 */
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    cardShadow: "shadow-lg",
    cardHover: "hover:shadow-xl",

    /** 按钮 */
    buttonBg: "bg-gray-100/80",
    buttonHover: "hover:bg-gray-200",
    buttonText: "text-gray-800",

    /** 输入框 */
    inputBg: "bg-white",
    inputBorder: "border-gray-300",
    inputText: "text-gray-900",
    inputPlaceholder: "placeholder-gray-400",

    /** 模态框 */
    modalBackdrop: "bg-black/40",
    modalBg: "bg-white",

    /** 连接线 */
    connectionStroke: "stroke-purple-500/60",
  },

  dark: {
    /** 画布背景 */
    canvasBg: "bg-gray-900",
    canvasBgColor: "#111827",

    /** 网格点颜色 */
    gridColor: "#4b5563",

    /** 文本颜色 */
    textPrimary: "text-gray-100",
    textSecondary: "text-gray-300",
    textTertiary: "text-gray-400",

    /** 故事板 */
    storyboardBg: "bg-gray-800",
    storyboardBorder: "border-gray-700",
    storyboardHeader: "bg-gray-900/70",
    storyboardPanel: "bg-gray-900/30",

    /** 卡片 */
    cardBg: "bg-gray-800",
    cardBorder: "border-gray-700",
    cardShadow: "shadow-xl",
    cardHover: "hover:shadow-2xl",

    /** 按钮 */
    buttonBg: "bg-gray-800/80",
    buttonHover: "hover:bg-gray-700",
    buttonText: "text-gray-100",

    /** 输入框 */
    inputBg: "bg-gray-700",
    inputBorder: "border-gray-600",
    inputText: "text-white",
    inputPlaceholder: "placeholder-gray-400",

    /** 模态框 */
    modalBackdrop: "bg-black/60",
    modalBg: "bg-gray-800",

    /** 连接线 */
    connectionStroke: "stroke-purple-400/60",
  },
} as const;
