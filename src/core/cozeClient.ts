import { CozeAPI } from "@coze/api";
import type {
  CozeClientOptions,
  WorkflowRunParams,
  WorkflowRunResult,
  FileUploadResult,
  WorkflowRunHistoryResponse,
  WorkflowRunHistoryResult,
  AsyncTaskCreatedParams,
} from "@/typings/coze";
import {
  WORKFLOWS,
  type WorkflowKey,
  type WorkflowInputs,
  type WorkflowOutputs,
} from "@/config/cozeWorkflow";
import axios from "axios";

/**
 * Coze API 客户端封装类
 * 提供工作流执行等功能，支持泛型类型推导
 */
export class CozeClient {
  /** Coze API 实例 */
  private apiClient: CozeAPI;

  /** API Token */
  private token: string;

  /** API 基础 URL */
  private baseURL: string;

  /** 异步任务创建回调 */
  private onAsyncTaskCreated?: (params: AsyncTaskCreatedParams) => void;

  /**
   * 创建 Coze 客户端实例
   * @param options - 客户端配置选项
   */
  constructor(options: CozeClientOptions) {
    this.token = options.token;
    this.baseURL = options.baseURL || "https://api.coze.cn";
    this.onAsyncTaskCreated = options.onAsyncTaskCreated;
    this.apiClient = new CozeAPI({
      token: this.token,
      baseURL: this.baseURL,
      allowPersonalAccessTokenInBrowser: true,
    });
  }

  /**
   * 执行工作流（方式1：通过工作流名称，自动推断类型）
   * @template K - 工作流名称
   * @param workflowKey - 工作流配置键名（如 "TEXT_SPLIT"）
   * @param params - 工作流输入参数（自动推断类型）
   * @returns 工作流执行结果（自动推断返回类型）
   */
  async runWorkflow<K extends WorkflowKey>(
    workflowKey: K,
    params: WorkflowInputs<(typeof WORKFLOWS)[K]>
  ): Promise<WorkflowRunResult<WorkflowOutputs<(typeof WORKFLOWS)[K]>>>;

  /**
   * 执行工作流（方式2：传统方式，直接传 workflow_id）
   * @template TParams - 工作流参数类型
   * @template TResult - 工作流返回数据类型
   * @param params - 包含 workflow_id 和 parameters 的参数对象
   * @returns 工作流执行结果
   */
  async runWorkflow<TParams extends Record<string, any> = Record<string, any>, TResult = any>(
    params: WorkflowRunParams<TParams>
  ): Promise<WorkflowRunResult<TResult>>;

  /**
   * 执行工作流（实现）
   *
   * @example
   * ```ts
   * const client = new CozeClient({ token: 'your_token' });
   *
   * // 方式1：通过工作流名称（推荐，有智能提示）
   * const result1 = await client.runWorkflow("TEXT_SPLIT", {
   *   prompt: "请将这段文本分割成段落",
   *   max_token: 2000
   * });
   *
   * // 方式2：传统方式
   * const result2 = await client.runWorkflow({
   *   workflow_id: "7565811541141454902",
   *   parameters: {
   *     prompt: "请将这段文本分割成段落",
   *     max_token: 2000
   *   }
   * });
   * ```
   */
  async runWorkflow<K extends WorkflowKey>(
    workflowKeyOrParams: K | WorkflowRunParams<any>,
    params?: WorkflowInputs<(typeof WORKFLOWS)[K]>
  ): Promise<WorkflowRunResult<any>> {
    try {
      let workflow_id: string;
      let parameters: any;
      let is_async: boolean = false;
      let workflowKey: string | undefined;

      // 判断调用方式
      if (typeof workflowKeyOrParams === "string") {
        // 方式1：通过工作流名称
        const workflow = WORKFLOWS[workflowKeyOrParams];
        workflow_id = workflow.id;
        parameters = params;
        workflowKey = workflowKeyOrParams;
        if ((workflow as any)?.system_prompt) {
          parameters.system_prompt = (workflow as any).system_prompt;
        }
        is_async = (workflow as any)?.is_async || false;
      } else {
        // 方式2：传统方式
        workflow_id = workflowKeyOrParams.workflow_id;
        parameters = workflowKeyOrParams.parameters;
        is_async = (workflowKeyOrParams as any)?.is_async || false;
      }

      const result = (await this.apiClient.workflows.runs.create({
        workflow_id,
        parameters,
        is_async,
      })) as unknown as WorkflowRunResult<any>;

      result.dataJSON = JSON.parse(result.data || "{}");

      // 如果是异步工作流且有 executeId，触发异步任务创建回调
      if (is_async && result.execute_id && this.onAsyncTaskCreated) {
        this.onAsyncTaskCreated({
          workflowId: workflow_id,
          executeId: result.execute_id,
          workflowKey,
          result,
        });
      }

      return result;
    } catch (error) {
      console.error("[CozeClient] 工作流执行失败:", error);
      throw error;
    }
  }

  /**
   * 上传文件
   * @param file - 要上传的文件（File 或 Blob 对象）
   * @returns 文件上传结果，包含文件 ID
   *
   * @example
   * ```ts
   * const client = new CozeClient({ token: 'your_token' });
   *
   * // 上传图片文件
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const result = await client.uploadFile(file);
   * console.log(result.data.id); // 文件 ID
   * ```
   */
  async uploadFile(file: File | Blob): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<FileUploadResult>(
        `${this.baseURL}/v1/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("[CozeClient] 文件上传失败:", error);
      throw error;
    }
  }

  /**
   * 获取异步工作流执行结果（方式1：通过工作流名称）
   * @template K - 工作流名称
   * @param workflowKey - 工作流配置键名（如 "IMAGE_GENERATION"）
   * @param executeId - 执行 ID（从异步执行返回的 execute_id）
   * @returns 工作流运行历史结果（自动推断返回类型）
   */
  async getWorkflowRunHistory<K extends WorkflowKey>(
    workflowKey: K,
    executeId: string
  ): Promise<WorkflowRunHistoryResult<WorkflowOutputs<(typeof WORKFLOWS)[K]>>>;

  /**
   * 获取异步工作流执行结果（方式2：直接传 workflow_id）
   * @template T - 输出数据类型
   * @param workflowId - 工作流 ID
   * @param executeId - 执行 ID（从异步执行返回的 execute_id）
   * @returns 工作流运行历史结果
   */
  async getWorkflowRunHistory<T = any>(
    workflowId: string,
    executeId: string
  ): Promise<WorkflowRunHistoryResult<T>>;

  /**
   * 获取异步工作流执行结果（实现）
   *
   * @example
   * ```ts
   * const client = new CozeClient({ token: 'your_token' });
   *
   * // 方式1：通过工作流名称（推荐，有智能提示）
   * const runResult = await client.runWorkflow("IMAGE_GENERATION", { prompt: "画一只猫" });
   * const result = await client.getWorkflowRunHistory("IMAGE_GENERATION", runResult.execute_id!);
   *
   * // 方式2：直接传 workflow_id
   * const result2 = await client.getWorkflowRunHistory(
   *   "7565802510557544457",
   *   "7565917147110522922"
   * );
   *
   * // 轮询获取结果
   * let result;
   * while (true) {
   *   result = await client.getWorkflowRunHistory("IMAGE_GENERATION", executeId);
   *   if (result.execute_status !== 'Running') break;
   *   await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
   * }
   *
   * if (result.execute_status === 'Success') {
   *   console.log('生成的图片:', result.output);
   * }
   * ```
   */
  async getWorkflowRunHistory<K extends WorkflowKey>(
    workflowKeyOrId: K | string,
    executeId: string
  ): Promise<WorkflowRunHistoryResult<any>> {
    try {
      // 判断是 WorkflowKey 还是直接的 workflow_id
      let workflow_id: string;
      if (workflowKeyOrId in WORKFLOWS) {
        // 方式1：通过工作流名称
        workflow_id = WORKFLOWS[workflowKeyOrId as K].id;
      } else {
        // 方式2：直接传 workflow_id
        workflow_id = workflowKeyOrId;
      }

      const response = await axios.get<WorkflowRunHistoryResponse>(
        `${this.baseURL}/v1/workflows/${workflow_id}/run_histories/${executeId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`获取工作流执行结果失败: ${response.data.msg}`);
      }

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error("工作流执行结果为空");
      }

      const historyItem = response.data.data[0]!;

      // 解析 output 字段（需要两次 JSON 解析）
      let output: any;
      try {
        // 第一次解析：将 output 字符串解析为对象
        const firstParse = JSON.parse(historyItem.output);
        // 第二次解析：从 Output 字段中提取真正的输出数据
        const secondParse = JSON.parse(firstParse.Output);
        output = secondParse.output;
      } catch (error) {
        console.error("[CozeClient] 解析工作流输出数据失败:", error);
        throw new Error("解析工作流输出数据失败");
      }

      return {
        execute_status: historyItem.execute_status,
        execute_id: historyItem.execute_id,
        debug_url: historyItem.debug_url,
        error_message: historyItem.error_message,
        output,
        raw: historyItem,
      };
    } catch (error) {
      console.error("[CozeClient] 获取工作流执行结果失败:", error);
      throw error;
    }
  }

  /**
   * 获取原始 API 客户端实例
   * 用于执行其他未封装的 API 调用
   */
  getApiClient(): CozeAPI {
    return this.apiClient;
  }
}

/**
 * 创建 Coze 客户端实例的工厂函数
 * @param options - 客户端配置选项
 * @returns Coze 客户端实例
 */
export function createCozeClient(options: CozeClientOptions): CozeClient {
  return new CozeClient(options);
}
