import { createCozeClient } from "@/core";
import { useWorkflowStore } from "@/stores/workflow";
import type { CozeClient } from "@/core/cozeClient";
import { notify } from "@/utils";

let clientInstance: CozeClient | null = null;

/**
 * 创建并获取集成了异步任务轮询的 CozeClient 实例
 * @param token - API Token
 * @param options - 其他配置选项
 * @returns CozeClient 实例
 *
 * @example
 * ```ts
 * const cozeClient = useCozeClient("your_token");
 *
 * // 执行异步工作流，会自动加入轮询队列
 * const result = await cozeClient.runWorkflow("GENERATE_VIDEO", {
 *   image: [{ file_id: "xxx" }],
 *   book_id: "xxx",
 *   id: 1
 * });
 * ```
 */
export function useCozeClient(
  token?: string,
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
  // 如果已有实例且 token 未变化，直接返回
  if (clientInstance && !token) {
    return clientInstance;
  }

  const workflowStore = useWorkflowStore();

  // 创建 CozeClient 实例
  const client = createCozeClient({
    token: token || "",
    baseURL: options?.baseURL,
    onAsyncTaskCreated: (params) => {
      console.log("[useCozeClient] 检测到异步任务创建:", params);

      // 添加到轮询队列
      workflowStore.addTask({
        workflowId: params.workflowId,
        executeId: params.executeId,
        workflowKey: params.workflowKey as any,
        maxPollCount: options?.maxPollCount || 60,
        onSuccess: (result) => {
          notify.success("异步任务执行成功", params.workflowKey || "工作流");
          console.log("[useCozeClient] 异步任务成功:", result);
          options?.onAsyncSuccess?.(result);
        },
        onError: (error) => {
          notify.error(error.message, "异步任务失败");
          console.error("[useCozeClient] 异步任务失败:", error);
          options?.onAsyncError?.(error);
        },
        onTimeout: () => {
          notify.warning("任务执行超时，请稍后刷新查看结果", "异步任务超时");
          console.warn("[useCozeClient] 异步任务超时");
          options?.onAsyncTimeout?.();
        },
      });
    },
  });

  // 将 CozeClient 实例注入到 WorkflowStore
  workflowStore.setCozeClient(client);

  // 缓存实例
  clientInstance = client;

  return client;
}

/**
 * 获取当前的 CozeClient 实例（如果存在）
 */
export function getCozeClientInstance(): CozeClient | null {
  return clientInstance;
}
