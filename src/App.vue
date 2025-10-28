<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import { useThemeStore } from "@/stores/theme";
import NotifyContainer from "@/components/common/NotifyContainer.vue";
import { setNotifyContainer } from "@/utils/notify";
import { useCozeClient } from "@/composables";
import { eventBus } from "@/utils/eventBus";

const themeStore = useThemeStore();
const notifyContainerRef = ref();

onMounted(() => {
  themeStore.initTheme();
  // 设置全局通知容器
  if (notifyContainerRef.value) {
    setNotifyContainer(notifyContainerRef.value);
  }

  // 初始化全局 CozeClient 实例
  useCozeClient(import.meta.env.VITE_COZE_TOKEN, {
    onAsyncSuccess: (result) => {
      console.log("[App] 异步任务完成:", result);

      // 触发画布刷新事件
      eventBus.emit("canvas:refresh");

      // 触发工作流完成事件（携带详细信息）
      eventBus.emit("workflow:completed", {
        workflowKey: result.workflowKey,
        executeId: result.execute_id,
        output: result.output,
      });

      console.log("[App] 已发送画布刷新事件");
    },
    onAsyncError: (error) => {
      console.error("[App] 异步任务失败:", error);
    },
    onAsyncTimeout: () => {
      console.warn("[App] 异步任务超时");
    },
  });
});
</script>

<template>
  <RouterView />
  <NotifyContainer ref="notifyContainerRef" />
</template>
