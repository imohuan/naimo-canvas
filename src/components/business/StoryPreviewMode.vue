<template>
  <div class="story-preview-mode h-full flex items-center justify-center">
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
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <h3 class="text-xl font-semibold mb-2">完整故事预览</h3>
      <p class="text-sm opacity-70">该功能正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@/composables";

const { theme } = useTheme();
</script>
