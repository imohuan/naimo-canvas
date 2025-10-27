import { defineStore } from "pinia";
import { ref } from "vue";
import type { WorkflowKey } from "@/config/cozeWorkflow";
import type { WorkflowRunHistoryResult } from "@/typings/coze";

/**
 * 异步工作流轮询任务项
 */
export interface AsyncWorkflowTask {
  /** 工作流 ID */
  workflowId: string;
  /** 执行 ID */
  executeId: string;
  /** 工作流键名（可选，用于类型推导） */
  workflowKey?: WorkflowKey;
  /** 添加时间戳 */
  addedAt: number;
  /** 轮询次数 */
  pollCount: number;
  /** 最大轮询次数（默认 60 次，即 2 分钟） */
  maxPollCount: number;
  /** 结果回调 */
  onSuccess?: (result: WorkflowRunHistoryResult<any>) => void;
  /** 失败回调 */
  onError?: (error: Error) => void;
  /** 超时回调 */
  onTimeout?: () => void;
}

/**
 * 异步工作流管理 Store
 * 负责管理异步工作流的轮询和状态更新
 */
export const useWorkflowStore = defineStore("workflow", () => {
  // ==================== State ====================

  /** 待轮询的异步任务列表 */
  const pendingTasks = ref<Map<string, AsyncWorkflowTask>>(new Map());

  /** 轮询定时器 ID */
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  /** 轮询间隔（毫秒，默认 2 秒） */
  const pollInterval = ref(2000);

  /** CozeClient 实例（需要从外部注入） */
  let cozeClientInstance: any = null;

  // ==================== Getters ====================

  /** 获取待处理任务数量 */
  const pendingTaskCount = ref(0);

  // ==================== Actions ====================

  /**
   * 注入 CozeClient 实例
   * @param client - CozeClient 实例
   */
  function setCozeClient(client: any) {
    cozeClientInstance = client;
  }

  /**
   * 添加异步任务到轮询队列
   * @param task - 异步任务配置
   */
  function addTask(task: Omit<AsyncWorkflowTask, "addedAt" | "pollCount">) {
    const taskId = `${task.workflowId}_${task.executeId}`;

    const fullTask: AsyncWorkflowTask = {
      ...task,
      addedAt: Date.now(),
      pollCount: 0,
    };

    pendingTasks.value.set(taskId, fullTask);
    pendingTaskCount.value = pendingTasks.value.size;

    console.log(`[WorkflowStore] 添加异步任务: ${taskId}`, fullTask);

    // 如果定时器未启动，启动它
    if (!pollTimer) {
      startPolling();
    }
  }

  /**
   * 移除任务
   * @param workflowId - 工作流 ID
   * @param executeId - 执行 ID
   */
  function removeTask(workflowId: string, executeId: string) {
    const taskId = `${workflowId}_${executeId}`;
    pendingTasks.value.delete(taskId);
    pendingTaskCount.value = pendingTasks.value.size;

    console.log(`[WorkflowStore] 移除任务: ${taskId}`);

    // 如果没有待处理任务，停止轮询
    if (pendingTasks.value.size === 0) {
      stopPolling();
    }
  }

  /**
   * 启动轮询
   */
  function startPolling() {
    if (pollTimer) return;

    console.log("[WorkflowStore] 启动轮询定时器");
    pollTimer = setInterval(() => {
      pollAllTasks();
    }, pollInterval.value);
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
      console.log("[WorkflowStore] 停止轮询定时器");
    }
  }

  /**
   * 轮询所有待处理任务
   */
  async function pollAllTasks() {
    if (!cozeClientInstance) {
      console.warn("[WorkflowStore] CozeClient 未注入，无法轮询");
      return;
    }

    const tasks = Array.from(pendingTasks.value.entries());

    for (const [taskId, task] of tasks) {
      try {
        // 增加轮询次数
        task.pollCount++;

        // 检查是否超过最大轮询次数
        if (task.pollCount > task.maxPollCount) {
          console.warn(`[WorkflowStore] 任务超时: ${taskId}`);
          task.onTimeout?.();
          removeTask(task.workflowId, task.executeId);
          continue;
        }

        // 获取执行结果
        const result = await cozeClientInstance.getWorkflowRunHistory(
          task.workflowId,
          task.executeId
        );

        console.log(`[WorkflowStore] 轮询任务 ${taskId}, 状态: ${result.execute_status}`);

        // 检查执行状态
        if (result.execute_status === "Success") {
          console.log(`[WorkflowStore] 任务成功: ${taskId}`, result);
          task.onSuccess?.(result);
          removeTask(task.workflowId, task.executeId);
        } else if (result.execute_status === "Failed") {
          console.error(`[WorkflowStore] 任务失败: ${taskId}`, result.error_message);
          task.onError?.(new Error(result.error_message || "工作流执行失败"));
          removeTask(task.workflowId, task.executeId);
        }
        // 如果是 Running，继续等待下次轮询
      } catch (error) {
        console.error(`[WorkflowStore] 轮询任务失败: ${taskId}`, error);
        // 轮询出错不移除任务，继续重试
      }
    }
  }

  /**
   * 清空所有任务
   */
  function clearAllTasks() {
    pendingTasks.value.clear();
    pendingTaskCount.value = 0;
    stopPolling();
  }

  /**
   * 设置轮询间隔
   * @param interval - 轮询间隔（毫秒）
   */
  function setPollInterval(interval: number) {
    pollInterval.value = interval;
    // 如果正在轮询，重启定时器以应用新的间隔
    if (pollTimer) {
      stopPolling();
      startPolling();
    }
  }

  return {
    // State
    pendingTasks,
    pendingTaskCount,
    pollInterval,

    // Actions
    setCozeClient,
    addTask,
    removeTask,
    startPolling,
    stopPolling,
    pollAllTasks,
    clearAllTasks,
    setPollInterval,
  };
});
