/**
 * 图片压缩工具
 */

import imageCompression from "browser-image-compression";
import { imageCompressionConfig } from "@/config";

/**
 * 图片压缩配置
 */
export interface CompressionOptions {
  /** 最大文件大小（MB） */
  maxSizeMB?: number;
  /** 最大宽度或高度（像素） */
  maxWidthOrHeight?: number;
  /** 使用 WebWorker */
  useWebWorker?: boolean;
}

/**
 * 默认压缩配置（从配置文件导入）
 */
const defaultOptions: CompressionOptions = imageCompressionConfig;

/**
 * 压缩单张图片
 * @param file 原始图片文件
 * @param options 压缩配置（可选）
 * @returns 压缩后的 File 对象
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const finalOptions = { ...defaultOptions, ...options };

  try {
    console.log(
      `[压缩图片] 开始压缩: ${file.name}, 原始大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    );

    const compressedFile = await imageCompression(file, finalOptions);

    console.log(
      `[压缩图片] 压缩完成: ${file.name}, 压缩后大小: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB, 压缩率: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
    );

    return compressedFile;
  } catch (error) {
    console.error(`[压缩图片] 压缩失败: ${file.name}`, error);
    // 如果压缩失败，返回原始文件
    return file;
  }
}

/**
 * 批量压缩图片
 * @param files 原始图片文件数组
 * @param options 压缩配置（可选）
 * @returns 压缩后的 File 对象数组
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  if (!files || files.length === 0) {
    return [];
  }

  console.log(`[批量压缩] 开始批量压缩，共 ${files.length} 张图片`);

  const startTime = Date.now();

  // 使用 Promise.all 并发压缩所有图片
  const compressedFiles = await Promise.all(files.map((file) => compressImage(file, options)));

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[批量压缩] 批量压缩完成，耗时 ${duration}s`);

  return compressedFiles;
}
