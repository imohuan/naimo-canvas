<template>
  <div class="video-generation-mode h-full flex items-center justify-center">
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
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
      </svg>
      <h3 class="text-xl font-semibold mb-2">视频生成</h3>
      <p class="text-sm opacity-70">该功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@/composables";

const { theme } = useTheme();
</script>
