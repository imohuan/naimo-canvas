import type { App } from "vue";
import type { NotifyType } from "@/components/common/NotifyItem.vue";

/** 通知配置选项 */
export interface NotifyOptions {
  /** 通知消息 */
  message: string;
  /** 通知标题 */
  title?: string;
  /** 通知类型 */
  type?: NotifyType;
  /** 自动关闭时间（毫秒），0 表示不自动关闭 */
  duration?: number;
}

/** 通知容器实例 */
let notifyContainer: any = null;

/** 设置通知容器实例 */
export const setNotifyContainer = (container: any) => {
  notifyContainer = container;
};

/** 显示通知 */
export const notify = (options: NotifyOptions | string) => {
  if (!notifyContainer) {
    console.warn("通知容器未初始化");
    return;
  }

  const config: NotifyOptions = typeof options === "string" ? { message: options } : options;

  return notifyContainer.addNotification(config);
};

/** 成功通知 */
notify.success = (message: string, title?: string, duration?: number) => {
  return notify({ message, title, type: "success", duration });
};

/** 错误通知 */
notify.error = (message: string, title?: string, duration?: number) => {
  return notify({ message, title, type: "error", duration });
};

/** 警告通知 */
notify.warning = (message: string, title?: string, duration?: number) => {
  return notify({ message, title, type: "warning", duration });
};

/** 信息通知 */
notify.info = (message: string, title?: string, duration?: number) => {
  return notify({ message, title, type: "info", duration });
};

/** 清空所有通知 */
notify.clear = () => {
  if (notifyContainer) {
    notifyContainer.clearNotifications();
  }
};

/** Vue 插件安装方法 */
export const NotifyPlugin = {
  install(app: App) {
    app.config.globalProperties.$notify = notify;
  },
};

export default notify;
