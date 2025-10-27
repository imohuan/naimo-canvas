import { createCozeClient } from "@/core";
import { useWorkflowStore } from "@/stores/workflow";
import type { CozeClient } from "@/core/cozeClient";
import { notify } from "@/utils";

let clientInstance: CozeClient | null = null;

/**
 * 初始化全局 CozeClient 实例（建议在 App.vue 中调用一次）
 * @param token - API Token
 * @param options - 配置选项
 * @returns CozeClient 实例
 *
 * @example
 * ```ts
 * // 在 App.vue 中初始化
 * import { onMounted } from "vue";
 * import { useCozeClient } from "@/composables";
 *
 * onMounted(() => {
 *   useCozeClient("your_token", {
 *     onAsyncSuccess: (result) => {
 *       console.log("异步任务完成:", result);
 *       // 刷新数据、更新 UI 等
 *     }
 *   });
 * });
 * ```
 */
export function useCozeClient(
  token: string,
  options?: {
    baseURL?: string;
    /** 异步任务成功回调 */
    onAsyncSuccess?: (result: any) => void;
    /** 异步任务失败回调 */
    onAsyncError?: (error: Error) => void;
    /** 异步任务超时回调 */
    onAsyncTimeout?: () => void;
    /** 最大轮询次数（默认 60 次，即 2 分钟） */
    maxPollCount?: number;
  }
): CozeClient {
  // 如果已有实例，先清理
  if (clientInstance) {
    console.warn("[useCozeClient] 重复初始化 CozeClient，将使用新的配置");
  }

  const workflowStore = useWorkflowStore();

  // 创建 CozeClient 实例
  const client = createCozeClient({
    token,
    baseURL: options?.baseURL,
    onAsyncTaskCreated: (params) => {
      console.log("[CozeClient] 检测到异步任务创建:", params);

      // 添加到轮询队列
      workflowStore.addTask({
        workflowId: params.workflowId,
        executeId: params.executeId,
        workflowKey: params.workflowKey as any,
        maxPollCount: options?.maxPollCount || 60,
        onSuccess: (result) => {
          // notify.success("异步任务执行成功", params.workflowKey || "工作流");
          console.log("[CozeClient] 异步任务成功:", result);

          // 传递完整信息给回调
          options?.onAsyncSuccess?.({
            ...result,
            workflowKey: params.workflowKey,
          });
        },
        onError: (error) => {
          notify.error(error.message, "异步任务失败");
          console.error("[CozeClient] 异步任务失败:", error);
          options?.onAsyncError?.(error);
        },
        onTimeout: () => {
          notify.warning("任务执行超时，请稍后刷新查看结果", "异步任务超时");
          console.warn("[CozeClient] 异步任务超时");
          options?.onAsyncTimeout?.();
        },
      });
    },
  });

  // 将 CozeClient 实例注入到 WorkflowStore
  workflowStore.setCozeClient(client);

  // 缓存实例
  clientInstance = client;

  console.log("[CozeClient] 全局实例初始化完成");

  return client;
}

/**
 * 获取全局 CozeClient 实例
 * @returns CozeClient 实例，如果未初始化则抛出错误
 *
 * @example
 * ```ts
 * // 在组件中使用
 * import { getCozeClientInstance } from "@/composables";
 *
 * const cozeClient = getCozeClientInstance();
 * const result = await cozeClient.runWorkflow("TEXT_TO_VIDEO_SHOTS", {
 *   prompt: "一个小女孩在雨夜行走"
 * });
 * ```
 */
export function getCozeClientInstance(): CozeClient {
  if (!clientInstance) {
    throw new Error("[CozeClient] 实例未初始化，请先在 App.vue 中调用 useCozeClient() 进行初始化");
  }
  return clientInstance;
}

/**
 * 检查 CozeClient 是否已初始化
 * @returns 是否已初始化
 */
export function isCozeClientInitialized(): boolean {
  return clientInstance !== null;
}
