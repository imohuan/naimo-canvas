/**
 * Coze API 相关类型定义
 */

/**
 * Coze 客户端配置选项
 */
export interface CozeClientOptions {
  /** API Token */
  token: string;
  /** API 基础 URL，默认为 https://api.coze.cn */
  baseURL?: string;
}

/**
 * 工作流文件参数
 */
export interface WorkflowFileParam {
  /** 文件 ID（通过上传接口获取） */
  file_id: string;
}

/**
 * 工作流执行参数（泛型版本）
 * @template T - 工作流参数类型
 */
export interface WorkflowRunParams<T extends Record<string, any> = Record<string, any>> {
  /** 工作流 ID */
  workflow_id: string;
  /** 工作流参数 */
  parameters: T;
}

/**
 * 工作流执行结果（泛型版本）
 * @template T - 返回数据类型
 */
export interface WorkflowRunResult<T = any> {
  /** 执行 ID */
  execute_id?: string;
  /** 执行状态 */
  status?: string;
  /** 执行结果数据 */
  data?: string;
  /** 执行结果数据 JSON */
  dataJSON?: T;
  /** 错误信息 */
  error?: {
    code?: number;
    message?: string;
  };
}

/**
 * 文件上传结果
 */
export interface FileUploadResult {
  /** 响应码 */
  code: number;
  /** 文件数据 */
  data: {
    /** 文件 ID */
    id: string;
    /** 文件名 */
    file_name: string;
    /** 文件大小（字节） */
    bytes: number;
    /** 创建时间戳 */
    created_at: number;
  };
  /** 响应消息 */
  msg: string;
  /** 详细信息 */
  detail?: {
    /** 日志 ID */
    logid: string;
  };
}
