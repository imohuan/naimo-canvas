import textSplitPrompt from "@/prompts/text_split.md?raw";

export type ImageFile = { file_id: string } | string;

/**
 * 所有工作流配置
 * 每个工作流包含 id、name、description、inputs、outputs
 */
export const WORKFLOWS = {
  /**
   * 文本转视频分镜工作流
   * 用于将长文本智能分割成多个分镜
   *
   * 注意：此工作流为异步执行（is_async: true），调用后立即返回执行信息，不会返回实际结果。
   * 返回格式：{ debug_url, execute_id, detail: { logid }, code, msg }
   * 需要通过轮询或刷新数据接口获取最终结果。
   */
  TEXT_TO_VIDEO_SHOTS: {
    /** 工作流 ID */
    id: "7565811541141454902",
    /** 工作流名称 */
    name: "文本分割",
    /** 工作流描述 */
    description: "将长文本智能分割成多个段落，支持自定义分割策略",
    /** 系统提示词 */
    system_prompt: textSplitPrompt,
    /** 是否异步运行（异步工作流不会立即返回结果数据） */
    is_async: true,
    /** 输入参数定义 */
    inputs: {
      /** 用户输入的文本提示词（必填） */
      prompt: "" as string,
      /** API 密钥（可选） */
      api_key: "" as string,
      /** API 基础地址（可选） */
      api_baseurl: "" as string,
      /** 系统提示词（可选） */
      system_prompt: "" as string,
      /** 最大 token 数量（可选，默认 2000） */
      max_token: 0 as number,
      /** 温度参数，控制输出随机性，范围 0-1（可选，默认 0.7） */
      temperature: 0 as number,
      /** 模型名称（可选） */
      model_name: "" as string,
      /** 参考图片 id（可选 上传图片后的id 逗号隔开） */
      reference_images: "" as string,
    },
    /** 必填参数列表 */
    requiredInputs: ["prompt"] as const,
    /** 输出结果定义 */
    outputs: {
      /** 分割后的文本结果 */
      output: [] as any[],
    },
  },

  /**
   * 获取列表工作流
   * 用于获取列表数据
   */
  GET_LIST: {
    id: "7565826014405558307",
    name: "获取列表",
    description: "获取列表",
    inputs: {
      /** 项目 ID，为空则获取所有项目 */
      book_id: "" as string,
      /** 是否按 book_id 分组，默认 false */
      group: false as boolean,
    },
    outputs: {
      output: [] as any[],
    },
  },

  /**
   * 生成视频工作流
   * 根据图片和文本生成视频
   *
   * 注意：此工作流为异步执行（is_async: true），调用后立即返回执行信息，不会返回实际结果。
   * 返回格式：{ debug_url, execute_id, detail: { logid }, code, msg }
   * 需要通过轮询或刷新数据接口获取最终结果。
   */
  GENERATE_VIDEO: {
    /** 工作流 ID */
    id: "7565802510557544457",
    /** 工作流名称 */
    name: "生成视频",
    /** 工作流描述 */
    description: "根据图片和文本生成视频",
    /** 是否异步运行（异步工作流不会立即返回结果数据） */
    is_async: true,
    /** 输入参数定义 */
    inputs: {
      /** 文本提示词（可选） */
      prompt: "" as string,
      /** 图片数组（必填） */
      image: [] as ImageFile[],
      /** 视频尺寸（可选） */
      size: "" as string,
      /** 书籍 ID（必填） */
      book_id: "" as string,
      /** ID（必填） */
      id: "" as string,
    },
    /** 必填参数列表 */
    requiredInputs: ["image", "book_id", "id"] as const,
    /** 输出结果定义 */
    outputs: {
      /** 输出结果数组 */
      output: [] as string[],
    },
  },

  /** 图片fileid 转 url */
  IMAGE_FILEID_TO_URL: {
    id: "7565854488088903686",
    name: "图片fileid 转 url",
    description: "图片fileid 转 url",
    inputs: {
      images: [] as ImageFile[],
    },
  },

  /** 删除数据 */
  DELETE_DATA: {
    id: "7565935669340602414",
    name: "删除数据",
    description: "删除数据",
    inputs: {
      /** 数据 ID（删除单条数据时传入，字符串类型） */
      id: "" as string,
      /** 项目 ID（删除整个项目时传入） */
      book_id: "" as string,
    },
    /** 必填参数列表（id 和 book_id 都是可选的，根据删除场景传入） */
    requiredInputs: [] as const,
    outputs: {
      output: [] as any[],
    },
  },
} as const;

// ==================== 类型工具 ====================

/**
 * 从工作流配置中提取输入参数类型
 * 自动将非必填字段标记为可选
 */
export type WorkflowInputs<T> = T extends {
  inputs: infer I;
  requiredInputs: ReadonlyArray<infer R>;
}
  ? {
      [K in keyof I as K extends R ? K : never]: I[K];
    } & {
      [K in keyof I as K extends R ? never : K]?: I[K];
    }
  : T extends { inputs: infer I }
    ? { [K in keyof I]: I[K] }
    : never;

/**
 * 从工作流配置中提取输出结果类型
 * 输出字段默认都是可选的
 */
export type WorkflowOutputs<T> = T extends { outputs: infer O } ? { [K in keyof O]?: O[K] } : never;

/**
 * 工作流键名类型
 */
export type WorkflowKey = keyof typeof WORKFLOWS;
