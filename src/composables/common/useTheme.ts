import { computed } from "vue";
import { useThemeStore } from "@/stores/theme";
import { themeConfig } from "@/config";

/**
 * 使用主题
 */
export function useTheme() {
  const themeStore = useThemeStore();
  const theme = computed(() => themeConfig[themeStore.mode]);

  return {
    themeStore,
    theme,
    mode: computed(() => themeStore.mode),
  };
}
