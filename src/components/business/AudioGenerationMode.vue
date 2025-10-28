<template>
  <div class="audio-generation-mode h-full flex items-center justify-center">
    <div :class="['text-center', theme.textSecondary]">
      <svg
        class="w-24 h-24 mx-auto mb-4 opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <h3 class="text-xl font-semibold mb-2">音频生成</h3>
      <p class="text-sm opacity-70">该功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@/composables";

const { theme } = useTheme();
</script>
