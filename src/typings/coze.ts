/**
 * Coze API 相关类型定义
 */

/**
 * 异步任务创建回调参数
 */
export interface AsyncTaskCreatedParams {
  /** 工作流 ID */
  workflowId: string;
  /** 执行 ID */
  executeId: string;
  /** 工作流键名（如果通过 WorkflowKey 调用） */
  workflowKey?: string;
  /** 完整的执行结果 */
  result: WorkflowRunResult<any>;
}

/**
 * Coze 客户端配置选项
 */
export interface CozeClientOptions {
  /** API Token */
  token: string;
  /** API 基础 URL，默认为 https://api.coze.cn */
  baseURL?: string;
  /** 异步任务创建回调（当执行异步工作流时触发） */
  onAsyncTaskCreated?: (params: AsyncTaskCreatedParams) => void;
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
  /** 异步工作流：响应码（0 表示成功） */
  code?: number;
  /** 异步工作流：响应消息 */
  msg?: string;
  /** 异步工作流：调试 URL */
  debug_url?: string;
  /** 异步工作流：详细信息 */
  detail?: {
    /** 日志 ID */
    logid?: string;
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

/**
 * 工作流运行历史记录项
 */
export interface WorkflowRunHistoryItem {
  /** Bot ID */
  bot_id: string;
  /** 错误码 */
  error_code: string;
  /** 日志 ID */
  logid: string;
  /** 执行输出（JSON 字符串） */
  output: string;
  /** 节点执行状态 */
  node_execute_status: Record<string, any>;
  /** 连接器 ID */
  connector_id: string;
  /** 执行状态（Success / Failed / Running） */
  execute_status: "Success" | "Failed" | "Running";
  /** 执行 ID */
  execute_id: string;
  /** 创建时间戳（秒） */
  create_time: number;
  /** 调试 URL */
  debug_url: string;
  /** 错误消息 */
  error_message: string;
  /** 运行模式 */
  run_mode: number;
  /** 使用量统计 */
  usage: {
    /** Token 数量 */
    token_count: number;
    /** 输出数量 */
    output_count: number;
    /** 输入数量 */
    input_count: number;
  };
  /** 更新时间戳（秒） */
  update_time: number;
  /** 输出是否被截断 */
  is_output_trimmed: boolean;
  /** Token */
  token: string;
  /** 连接器 UID */
  connector_uid: string;
}

/**
 * 工作流运行历史响应
 */
export interface WorkflowRunHistoryResponse {
  /** 响应码（0 表示成功） */
  code: number;
  /** 响应消息 */
  msg: string;
  /** 历史记录数据 */
  data: WorkflowRunHistoryItem[];
  /** 详细信息 */
  detail: {
    /** 日志 ID */
    logid: string;
  };
}

/**
 * 工作流运行历史结果（解析后）
 * @template T - 输出数据类型
 */
export interface WorkflowRunHistoryResult<T = any> {
  /** 执行状态 */
  execute_status: "Success" | "Failed" | "Running";
  /** 执行 ID */
  execute_id: string;
  /** 调试 URL */
  debug_url: string;
  /** 错误消息 */
  error_message: string;
  /** 解析后的输出数据 */
  output: T;
  /** 原始数据 */
  raw: WorkflowRunHistoryItem;
}
