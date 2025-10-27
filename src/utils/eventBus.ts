import mitt from "mitt";

/** 事件类型定义 */
export type Events = {
  notify: { type: "success" | "error" | "warning" | "info"; message: string };
  refresh: void;
  /** 画布数据刷新事件 */
  "canvas:refresh": void;
  /** 异步工作流完成事件 */
  "workflow:completed": {
    workflowKey?: string;
    executeId: string;
    output: any;
  };
};

export const eventBus = mitt<Events>();
