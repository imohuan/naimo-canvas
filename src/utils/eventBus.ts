import mitt from "mitt";

/** 事件类型定义 */
export type Events = {
  notify: { type: "success" | "error" | "warning" | "info"; message: string };
  refresh: void;
};

export const eventBus = mitt<Events>();
