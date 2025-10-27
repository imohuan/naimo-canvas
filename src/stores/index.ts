import { createPinia } from "pinia";

const pinia = createPinia();

export default pinia;

// 导出所有 stores
export { useAppStore } from "./app";
export { useChatStore } from "./chat";
export { useThemeStore } from "./theme";
export { useWorkflowStore } from "./workflow";
