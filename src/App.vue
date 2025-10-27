<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import NotifyContainer from "@/components/common/NotifyContainer.vue";
import { setNotifyContainer } from "@/utils/notify";

const themeStore = useThemeStore();
const notifyContainerRef = ref();

onMounted(() => {
  themeStore.initTheme();
  // 设置全局通知容器
  if (notifyContainerRef.value) {
    setNotifyContainer(notifyContainerRef.value);
  }
});
</script>

<template>
  <RouterView />
  <NotifyContainer ref="notifyContainerRef" />
</template>
