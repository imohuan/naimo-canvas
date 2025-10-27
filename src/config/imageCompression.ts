/**
 * 图片压缩配置
 */

import type { CompressionOptions } from "@/utils/imageCompression";

/**
 * 图片压缩配置
 *
 * 用于在上传图片之前进行压缩处理，减少文件大小和上传时间
 */
export const imageCompressionConfig: CompressionOptions = {
  /**
   * 压缩后最大文件大小（MB）
   * 图片将被压缩到不超过此大小
   * @default 1
   */
  maxSizeMB: 1,

  /**
   * 压缩后最大宽度或高度（像素）
   * 图片尺寸将被限制在此范围内，保持原始宽高比
   * @default 1920
   */
  maxWidthOrHeight: 1920,

  /**
   * 使用 WebWorker 提升性能
   * 启用后压缩操作将在后台线程执行，避免阻塞主线程
   * @default true
   */
  useWebWorker: true,
} as const;
