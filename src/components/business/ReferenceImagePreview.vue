<template>
  <div v-if="imageUrl" class="reference-image-preview">
    <ImagePreview
      :src="imageUrl"
      :alt="alt"
      :container-class="containerClass"
      :image-class="imageClass"
    />
  </div>
  <div v-else-if="isLoading" class="reference-image-preview flex items-center justify-center">
    <div
      class="loader border-2 border-gray-300 border-t-blue-500 rounded-full w-6 h-6 animate-spin"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import ImagePreview from "@/components/common/ImagePreview.vue";
import { debouncedImageUrlFetcher } from "@/services/canvas";

interface Props {
  /** 图片文件 ID */
  fileId?: string;
  /** 图片 alt 属性 */
  alt?: string;
  /** 自定义容器类名 */
  containerClass?: string;
  /** 自定义图片类名 */
  imageClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: "w-full rounded-md overflow-hidden",
});

const imageUrl = ref<string | null>(null);
const isLoading = ref(false);

/**
 * 使用 debounced fetcher 获取图片 URL
 */
const fetchImageUrl = async (fileId: string) => {
  if (!fileId) {
    imageUrl.value = null;
    return;
  }

  isLoading.value = true;
  console.log("[ReferenceImagePreview] 请求获取图片 URL, file_id:", fileId);

  try {
    const url = await debouncedImageUrlFetcher.fetch(fileId);
    imageUrl.value = url;
    console.log("[ReferenceImagePreview] 获取图片 URL 成功:", url);
  } catch (error) {
    console.error("[ReferenceImagePreview] 获取图片 URL 失败:", error);
    imageUrl.value = null;
  } finally {
    isLoading.value = false;
  }
};

// 监听 fileId 变化
watch(
  () => props.fileId,
  (newFileId) => {
    if (newFileId) {
      fetchImageUrl(newFileId);
    } else {
      imageUrl.value = null;
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.fileId) {
    fetchImageUrl(props.fileId);
  }
});
</script>

<style scoped>
.reference-image-preview {
  min-height: 60px;
}

.loader {
  border-width: 2px;
}
</style>
