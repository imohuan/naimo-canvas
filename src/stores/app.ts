import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAppStore = defineStore("app", () => {
  // state
  const loading = ref(false);
  const theme = ref<"light" | "dark">("light");

  // getters
  const isDark = computed(() => theme.value === "dark");

  // actions
  function setLoading(value: boolean) {
    loading.value = value;
  }

  function toggleTheme() {
    theme.value = theme.value === "light" ? "dark" : "light";
  }

  return {
    loading,
    theme,
    isDark,
    setLoading,
    toggleTheme,
  };
});
