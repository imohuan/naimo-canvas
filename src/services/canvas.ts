/**
 * 画布相关服务
 */

import { createCozeClient } from "@/core";
import { WORKFLOWS, type WorkflowInputs } from "@/config/cozeWorkflow";
import type { ProjectInfo } from "@/typings/canvas";

// 创建 Coze 客户端实例（全局单例）
export const cozeClient = createCozeClient({
  token:
    import.meta.env.VITE_COZE_TOKEN ||
    "pat_mIdvTJu7T46eSEmnm3DZNeC9Scb08cYFb90zeMNgFHpW954v74XPYDn5js80otKA",
});

/**
 * 调用文本转分镜工作流
 * 将长文本智能分割成多个段落
 */
export async function textToVideoShots(
  prompt: string,
  options?: Partial<WorkflowInputs<typeof WORKFLOWS.TEXT_TO_VIDEO_SHOTS>>
): Promise<any> {
  const result = await cozeClient.runWorkflow("TEXT_TO_VIDEO_SHOTS", {
    prompt,
    system_prompt: WORKFLOWS.TEXT_TO_VIDEO_SHOTS.system_prompt,
    ...options,
  });

  return result;
}

/**
 * 图片 file_id 转 URL
 * 批量将 Coze 文件 ID 转换为可访问的图片 URL
 */
export async function imageFileIdToUrl(fileIds: string[]) {
  console.log("[imageFileIdToUrl] 请求转换图片 URL，file_ids:", fileIds);

  const images = fileIds.map((id) => ({ file_id: id }));

  const result = await cozeClient.runWorkflow("IMAGE_FILEID_TO_URL", {
    images,
  });

  console.log("[imageFileIdToUrl] 转换结果:", result);

  return result;
}

/**
 * Debounced 批量获取图片 URL
 * 使用防抖机制累积多个请求，300ms 内的调用会合并为一次批量请求
 */
class DebouncedImageUrlFetcher {
  private pendingIds: Set<string> = new Set();
  private resolvers: Map<string, ((url: string | null) => void)[]> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly delay = 300;

  /**
   * 添加 file_id 到待获取队列
   * @param fileId 文件 ID
   * @returns Promise<string | null> 返回图片 URL
   */
  async fetch(fileId: string): Promise<string | null> {
    console.log("[DebouncedImageUrlFetcher] 添加 file_id 到队列:", fileId);

    return new Promise((resolve) => {
      // 添加到待获取列表
      this.pendingIds.add(fileId);

      // 保存 resolver
      if (!this.resolvers.has(fileId)) {
        this.resolvers.set(fileId, []);
      }
      this.resolvers.get(fileId)!.push(resolve);

      // 取消之前的定时器
      if (this.timer) {
        clearTimeout(this.timer);
        console.log("[DebouncedImageUrlFetcher] 取消之前的请求，继续累积");
      }

      // 设置新的定时器
      this.timer = setTimeout(() => {
        this.executeBatch();
      }, this.delay);

      console.log("[DebouncedImageUrlFetcher] 当前待获取队列:", Array.from(this.pendingIds));
    });
  }

  /**
   * 执行批量请求
   */
  private async executeBatch() {
    const idsToFetch = Array.from(this.pendingIds);
    console.log("[DebouncedImageUrlFetcher] 执行批量请求，共", idsToFetch.length, "个 file_id");

    // 清空队列
    this.pendingIds.clear();
    this.timer = null;

    if (idsToFetch.length === 0) {
      return;
    }

    try {
      const result = await imageFileIdToUrl(idsToFetch);
      const urls = (result?.dataJSON as any)?.output || [];

      console.log("[DebouncedImageUrlFetcher] 批量请求成功，返回 URLs:", urls);

      // 解析结果并调用对应的 resolver
      idsToFetch.forEach((fileId, index) => {
        const url = urls[index] || null;
        const resolvers = this.resolvers.get(fileId) || [];

        console.log(`[DebouncedImageUrlFetcher] file_id: ${fileId} => url: ${url}`);

        resolvers.forEach((resolve) => resolve(url));
        this.resolvers.delete(fileId);
      });
    } catch (error) {
      console.error("[DebouncedImageUrlFetcher] 批量请求失败:", error);

      // 错误时返回 null
      idsToFetch.forEach((fileId) => {
        const resolvers = this.resolvers.get(fileId) || [];
        resolvers.forEach((resolve) => resolve(null));
        this.resolvers.delete(fileId);
      });
    }
  }
}

// 创建全局 debounced fetcher 实例
export const debouncedImageUrlFetcher = new DebouncedImageUrlFetcher();

/**
 * 获取项目列表或分镜列表
 * @param bookId 如果不传，则查询所有数据；如果传了，则查询对应的分镜列表
 * @param group 是否按 book_id 分组，默认 false
 */
export async function getList(bookId?: string, group = false) {
  const result = await cozeClient.runWorkflow("GET_LIST", {
    book_id: bookId || "",
    group,
  });

  return result;
}

/**
 * 生成视频
 * @param params 生成视频参数
 */
export async function generateVideo(
  params: WorkflowInputs<typeof WORKFLOWS.GENERATE_VIDEO>
): Promise<any> {
  const result = await cozeClient.runWorkflow("GENERATE_VIDEO", params);

  return result;
}

/**
 * 获取所有数据并按 book_id 分组
 */
export async function getAllDataGroupedByBookId(): Promise<Record<string, any[]>> {
  try {
    const result = await getList("", false); // 获取全部数据，不分组
    const output = result?.dataJSON?.output;

    if (!output || !Array.isArray(output)) {
      return {};
    }

    // 按 book_id 分组
    const grouped: Record<string, any[]> = {};
    output.forEach((item: any) => {
      const bookId = item.book_id || item.bookId || "default";
      if (!grouped[bookId]) {
        grouped[bookId] = [];
      }
      grouped[bookId].push(item);
    });

    // 对每一个 bookId 的 items 按 order_index（字符串数字）升序排序（0,1,2...）
    Object.keys(grouped).forEach((bookId) => {
      grouped[bookId]!.sort((a, b) => {
        // order_index 可能为字符串类型，需转为数字比较；未定义时默认为 Infinity
        const getOrder = (item: any) => {
          const v = item.order_index ?? item.orderIndex;
          if (v === undefined || v === null || isNaN(Number(v))) return Infinity;
          return Number(v);
        };
        return getOrder(a) - getOrder(b);
      });
    });

    return grouped;
  } catch (error) {
    console.error("获取数据失败:", error);
    return {};
  }
}

/**
 * 获取所有项目列表
 */
export async function getAllProjects(): Promise<ProjectInfo[]> {
  try {
    const result = await getList("", true); // 获取分组数据
    // 假设返回的是聚合后的项目列表
    const output = result?.dataJSON?.output;
    if (output && Array.isArray(output)) {
      return output.map((item: any) => ({
        bookId: item.book_id || item.bookId || "",
        title: item.title || item.book_id || "未命名项目",
        count: item.count || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error("获取项目列表失败:", error);
    return [];
  }
}

/**
 * 获取指定项目的分镜列表
 */
export async function getProjectShots(bookId: string): Promise<any[]> {
  try {
    const result = await getList(bookId);
    const output = result?.dataJSON?.output;
    if (output && Array.isArray(output)) {
      return output;
    }
    return [];
  } catch (error) {
    console.error("获取分镜列表失败:", error);
    return [];
  }
}

/**
 * 上传图片为 base64（工具函数）
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 裁剪图片为 16:9
 */
export function cropImageTo16x9(imageUrl: string): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法获取 canvas context"));
        return;
      }

      const targetAspectRatio = 16 / 9;
      let sourceX: number, sourceY: number, sourceWidth: number, sourceHeight: number;

      const originalAspectRatio = img.width / img.height;

      if (originalAspectRatio > targetAspectRatio) {
        sourceHeight = img.height;
        sourceWidth = img.height * targetAspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
        sourceY = 0;
      } else {
        sourceWidth = img.width;
        sourceHeight = img.width / targetAspectRatio;
        sourceX = 0;
        sourceY = (img.height - sourceHeight) / 2;
      }

      canvas.width = 1920;
      canvas.height = 1080;

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
