<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none">
      <NotifyItem
        v-for="item in notifications"
        :key="item.id"
        v-bind="item"
        class="pointer-events-auto"
        :on-close="() => removeNotification(item.id)"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import NotifyItem, { type NotifyType } from "./NotifyItem.vue";

/** 通知项接口 */
export interface NotificationItem {
  id: string;
  message: string;
  title?: string;
  type?: NotifyType;
  duration?: number;
}

const notifications = ref<NotificationItem[]>([]);

/** 添加通知 */
const addNotification = (notification: Omit<NotificationItem, "id">) => {
  const id = `notify-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  notifications.value.push({
    id,
    ...notification,
  });
  return id;
};

/** 移除通知 */
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

/** 清空所有通知 */
const clearNotifications = () => {
  notifications.value = [];
};

// 暴露方法供全局 API 使用
defineExpose({
  addNotification,
  removeNotification,
  clearNotifications,
});
</script>
