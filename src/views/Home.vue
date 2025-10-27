<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useBoolean } from "@/composables";
import { createCozeClient } from "@/core";

const router = useRouter();
const textSplitLoading = useBoolean();
const getListLoading = useBoolean();
const uploadLoading = useBoolean();

const uploadedFileId = ref<string>("");
const uploadedFileName = ref<string>("");
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string>("");

const cozeClient = createCozeClient({
  token: "pat_mIdvTJu7T46eSEmnm3DZNeC9Scb08cYFb90zeMNgFHpW954v74XPYDn5js80otKA",
});

function goToChat() {
  router.push("/chat");
}

function goToCanvas() {
  router.push("/canvas");
}

async function handleTextSplit() {
  await textSplitLoading.run(async () => {
    const result = await cozeClient.runWorkflow("TEXT_TO_VIDEO_SHOTS", {
      prompt: "一个小女孩在雨夜行走，3个分镜",
    });
    console.log("文本分割结果:", result);
  });
}

async function handleGetList() {
  await getListLoading.run(async () => {
    const result = await cozeClient.runWorkflow("GET_LIST", {
      book_id: "66daae37-6e94-44f3-924a-d856ff1e6227",
      group: false,
    });
    console.log("列表数据:", result);
  });
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    selectedFile.value = file;

    // 创建预览 URL
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = URL.createObjectURL(file);

    // 清空之前的上传结果
    uploadedFileId.value = "";
    uploadedFileName.value = "";
  }
}

async function handleUploadFile() {
  if (!selectedFile.value) {
    alert("请先选择图片");
    return;
  }

  await uploadLoading.run(async () => {
    const result = await cozeClient.uploadFile(selectedFile.value!);
    console.log("上传结果:", result);

    uploadedFileId.value = result.data.id;
    uploadedFileName.value = result.data.file_name;
  });
}

function clearFile() {
  selectedFile.value = null;
  uploadedFileId.value = "";
  uploadedFileName.value = "";

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = "";
  }
}

async function handleTransformImageFileIdToUrl() {
  const result = await cozeClient.runWorkflow("IMAGE_FILEID_TO_URL", {
    images: [{ file_id: uploadedFileId.value }],
  });
  console.log("图片ID转URL结果:", result);
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
      <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Coze API 功能演示</h1>

      <div class="space-y-6">
        <!-- 工作流执行 -->
        <div class="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h2 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            工作流执行
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="handleTextSplit"
              :disabled="textSplitLoading.value.value"
              class="py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {{ textSplitLoading.value.value ? "执行中..." : "文本分割" }}
            </button>
            <button
              @click="handleGetList"
              :disabled="getListLoading.value.value"
              class="py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {{ getListLoading.value.value ? "获取中..." : "获取列表" }}
            </button>
          </div>
        </div>

        <!-- 图片上传 -->
        <div class="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h2 class="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            图片上传
          </h2>

          <!-- 文件选择 -->
          <div class="mb-4">
            <label
              for="file-upload"
              class="block w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mx-auto text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span class="text-gray-600">{{
                selectedFile ? selectedFile.name : "点击选择图片"
              }}</span>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
            </label>
          </div>

          <!-- 预览图片 -->
          <div v-if="previewUrl" class="mb-4">
            <img
              :src="previewUrl"
              alt="预览"
              class="w-full max-h-64 object-contain rounded-lg border border-gray-200"
            />
          </div>

          <!-- 上传按钮 -->
          <div class="flex gap-3">
            <button
              @click="handleUploadFile"
              :disabled="!selectedFile || uploadLoading.value.value"
              class="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {{ uploadLoading.value.value ? "上传中..." : "上传图片" }}
            </button>
            <button
              v-if="selectedFile"
              @click="clearFile"
              class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              清除
            </button>
          </div>

          <!-- 上传结果 -->
          <div
            v-if="uploadedFileId"
            class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p class="text-sm text-green-800 font-medium mb-1">上传成功！</p>
            <p class="text-xs text-gray-600">文件名: {{ uploadedFileName }}</p>
            <p class="text-xs text-gray-600 break-all">文件 ID: {{ uploadedFileId }}</p>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="grid grid-cols-3 gap-4">
          <!-- 测试图片预览 -->
          <button
            v-if="uploadedFileId"
            @click="handleTransformImageFileIdToUrl"
            class="py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition flex items-center justify-center space-x-2 font-medium shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m4 4h-1V8m4 8V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2z"
              />
            </svg>
            <span>图片ID转URL</span>
          </button>

          <button
            @click="goToChat"
            class="py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition flex items-center justify-center space-x-2 font-medium shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>AI 聊天</span>
          </button>
          <button
            @click="goToCanvas"
            class="py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition flex items-center justify-center space-x-2 font-medium shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            <span>无限画布</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
