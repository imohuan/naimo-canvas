<script setup lang="ts">
import { ref } from "vue";
import { useBoolean } from "@/composables";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();
const loading = useBoolean();
const count = ref(0);

async function handleClick() {
  await loading.run(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    count.value++;
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">欢迎使用 Vue 3</h1>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-gray-600">当前主题:</span>
          <button
            @click="appStore.toggleTheme"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {{ appStore.theme }}
          </button>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-gray-600">计数器:</span>
          <span class="text-2xl font-bold text-blue-500">{{ count }}</span>
        </div>

        <button
          @click="handleClick"
          :disabled="loading.value.value"
          class="w-full py-3 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ loading.value.value ? "加载中..." : "点击增加" }}
        </button>
      </div>
    </div>
  </div>
</template>
