import { CozeAPI } from "@coze/api";
import type {
  CozeClientOptions,
  WorkflowRunParams,
  WorkflowRunResult,
  FileUploadResult,
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

  /**
   * 创建 Coze 客户端实例
   * @param options - 客户端配置选项
   */
  constructor(options: CozeClientOptions) {
    this.token = options.token;
    this.baseURL = options.baseURL || "https://api.coze.cn";
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

      // 判断调用方式
      if (typeof workflowKeyOrParams === "string") {
        // 方式1：通过工作流名称
        const workflow = WORKFLOWS[workflowKeyOrParams];
        workflow_id = workflow.id;
        parameters = params;
        if ((workflow as any)?.system_prompt) {
          parameters.system_prompt = (workflow as any).system_prompt;
        }
      } else {
        // 方式2：传统方式
        workflow_id = workflowKeyOrParams.workflow_id;
        parameters = workflowKeyOrParams.parameters;
      }

      const result = (await this.apiClient.workflows.runs.create({
        workflow_id,
        parameters,
      })) as unknown as WorkflowRunResult<any>;

      result.dataJSON = JSON.parse(result.data || "{}");

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
