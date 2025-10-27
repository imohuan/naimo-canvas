import { ref } from "vue";
import { defineStore } from "pinia";

export type ThemeMode = "light" | "dark";

export const useThemeStore = defineStore("theme", () => {
  // 从 localStorage 读取主题，默认为亮色
  const mode = ref<ThemeMode>((localStorage.getItem("theme") as ThemeMode) || "light");

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    mode.value = mode.value === "light" ? "dark" : "light";
    localStorage.setItem("theme", mode.value);
    applyTheme();
  };

  /**
   * 设置主题
   */
  const setTheme = (theme: ThemeMode) => {
    mode.value = theme;
    localStorage.setItem("theme", theme);
    applyTheme();
  };

  /**
   * 应用主题到 DOM
   */
  const applyTheme = () => {
    const root = document.documentElement;
    if (mode.value === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  /**
   * 初始化主题
   */
  const initTheme = () => {
    applyTheme();
  };

  return {
    mode,
    toggleTheme,
    setTheme,
    initTheme,
  };
});
