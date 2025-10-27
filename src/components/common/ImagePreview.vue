<template>
  <div>
    <!-- 缩略图 -->
    <div :class="['cursor-pointer', containerClass]" @click="openPreview">
      <img :src="src" :alt="alt" :class="['w-full h-full object-cover', imageClass]" />
    </div>

    <!-- 大图预览模态框 -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-9999 flex flex-col bg-black/95 backdrop-blur-sm"
        @click="closePreview"
      >
        <!-- 顶部工具栏 -->
        <div
          class="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/10"
          @click.stop
        >
          <!-- 左侧：图片信息 -->
          <div class="flex items-center gap-4 text-white/90">
            <span class="text-sm">{{ alt }}</span>
            <span class="text-xs text-white/60">{{ Math.round(scale * 100) }}%</span>
          </div>

          <!-- 中间：操作按钮 -->
          <div class="flex items-center gap-2">
            <!-- 重置 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="重置 (R)"
              @click="resetTransform"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>

            <!-- 放大 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="放大 (鼠标滚轮向上)"
              @click="zoomIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <!-- 缩小 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="缩小 (鼠标滚轮向下)"
              @click="zoomOut"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <!-- 实际大小 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="实际大小 (1:1)"
              @click="actualSize"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6" />
              </svg>
            </button>

            <div class="w-px h-6 bg-white/20"></div>

            <!-- 顺时针旋转 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="顺时针旋转 90°"
              @click="rotateRight"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>

            <!-- 逆时针旋转 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="逆时针旋转 90°"
              @click="rotateLeft"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <div class="w-px h-6 bg-white/20"></div>

            <!-- 下载 -->
            <button
              class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
              title="下载图片"
              @click="downloadImage"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>

          <!-- 右侧：关闭按钮 -->
          <button
            class="p-2 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition-all"
            title="关闭 (ESC)"
            @click="closePreview"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 图片容器 -->
        <div
          ref="imageContainerRef"
          class="flex-1 flex items-center justify-center overflow-hidden cursor-move"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @click.stop
        >
          <img
            ref="imageRef"
            :src="src"
            :alt="alt"
            class="max-w-none select-none"
            draggable="false"
            :style="{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
            }"
            @load="handleImageLoad"
          />
        </div>

        <!-- 底部提示 -->
        <div class="px-6 py-3 bg-black/50 backdrop-blur-md border-t border-white/10 text-center">
          <p class="text-xs text-white/60">滚轮缩放 · 拖拽移动 · ESC 或点击背景关闭 · R 重置</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";

interface Props {
  src: string;
  alt?: string;
  containerClass?: string;
  imageClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "图片",
  containerClass: "",
  imageClass: "",
});

// 模态框状态
const showModal = ref(false);

// 图片变换状态
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const rotation = ref(0);

// 初始缩放比例（用于适配容器）
const initialScale = ref(1);

// 拖拽状态
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartTranslateX = ref(0);
const dragStartTranslateY = ref(0);

// DOM 引用
const imageRef = ref<HTMLImageElement | null>(null);
const imageContainerRef = ref<HTMLDivElement | null>(null);

/** 计算初始缩放比例（使图片完整显示在容器中） */
const calculateInitialScale = () => {
  if (!imageRef.value || !imageContainerRef.value) return;

  const img = imageRef.value;
  const container = imageContainerRef.value;

  // 获取图片实际尺寸
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // 获取容器尺寸（减去一些 padding）
  const containerWidth = container.clientWidth - 40;
  const containerHeight = container.clientHeight - 40;

  // 计算缩放比例，使图片完整显示
  const scaleX = containerWidth / imgWidth;
  const scaleY = containerHeight / imgHeight;

  // 取较小的缩放比例，确保图片完整显示
  initialScale.value = Math.min(scaleX, scaleY, 1); // 最大不超过 1（实际大小）
};

/** 图片加载完成 */
const handleImageLoad = () => {
  calculateInitialScale();
  resetTransform();
};

/** 打开预览 */
const openPreview = () => {
  showModal.value = true;
  // 重置会在图片加载完成后自动调用
};

/** 关闭预览 */
const closePreview = () => {
  showModal.value = false;
};

/** 重置变换（居中并适配容器） */
const resetTransform = () => {
  scale.value = initialScale.value;
  translateX.value = 0;
  translateY.value = 0;
  rotation.value = 0;
};

/** 放大 */
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 5);
};

/** 缩小 */
const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.1);
};

/** 实际大小 */
const actualSize = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

/** 顺时针旋转 */
const rotateRight = () => {
  rotation.value += 90;
};

/** 逆时针旋转 */
const rotateLeft = () => {
  rotation.value -= 90;
};

/** 下载图片 */
const downloadImage = async () => {
  try {
    const response = await fetch(props.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = props.alt || "image";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("下载图片失败:", error);
  }
};

/** 鼠标滚轮缩放 */
const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale.value = Math.max(0.1, Math.min(5, scale.value * delta));
};

/** 鼠标按下开始拖拽 */
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;
  dragStartTranslateX.value = translateX.value;
  dragStartTranslateY.value = translateY.value;

  // 监听鼠标移动和释放
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

/** 鼠标移动拖拽 */
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const deltaX = e.clientX - dragStartX.value;
  const deltaY = e.clientY - dragStartY.value;

  translateX.value = dragStartTranslateX.value + deltaX;
  translateY.value = dragStartTranslateY.value + deltaY;
};

/** 鼠标释放结束拖拽 */
const handleMouseUp = () => {
  isDragging.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
};

// 监听键盘事件和管理 body 滚动
watch(showModal, (isOpen) => {
  if (isOpen) {
    // 禁止 body 滚动
    document.body.style.overflow = "hidden";

    // 监听 ESC 和 R 键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePreview();
      } else if (e.key === "r" || e.key === "R") {
        resetTransform();
      }
    };

    useEventListener(document, "keydown", handleKeyDown);
  } else {
    // 恢复 body 滚动
    document.body.style.overflow = "";
  }
});
</script>
