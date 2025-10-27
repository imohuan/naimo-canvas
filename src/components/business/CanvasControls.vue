<template>
  <div class="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20">
    <!-- 思考指示器 -->
    <div v-if="isThinking" class="text-center mb-2">
      <p class="text-lg font-semibold breathing-gradient">思考中...</p>
    </div>

    <!-- 底部控制条 -->
    <div
      :class="[
        'backdrop-blur-lg rounded-full shadow-2xl flex items-center h-16 overflow-hidden border',
        theme.cardBg,
        theme.cardBorder,
        isThinking && 'opacity-50 pointer-events-none',
      ]"
    >
      <!-- 角色参考上传（支持多张） -->
      <input
        ref="characterInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleCharacterUpload"
      />
      <div
        :class="[
          'ref-capsule h-full w-32 shrink-0 flex items-center justify-center relative cursor-pointer bg-center bg-no-repeat bg-contain',
          theme.textTertiary,
          theme.buttonHover,
        ]"
        :style="characterImageStyle"
        @click="characterInputRef?.click()"
      >
        <div
          :class="[
            'flex items-center space-x-2 pointer-events-none',
            characterReferenceImages.length > 0 && 'hidden',
          ]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
          <span class="text-xs font-semibold">角色</span>
        </div>
        <!-- 图片数量标签 -->
        <div
          v-if="characterReferenceImages.length > 1"
          class="absolute top-1 left-1 bg-blue-600/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 pointer-events-none"
        >
          {{ characterReferenceImages.length }}
        </div>
        <button
          v-if="characterReferenceImages.length > 0"
          class="clear-btn absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs z-10 opacity-0 hover:opacity-100"
          @click.stop="clearCharacterImage"
        >
          &times;
        </button>
      </div>

      <div :class="['w-px h-8', theme.cardBorder]"></div>

      <!-- 场景参考上传 -->
      <input
        ref="sceneInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleSceneUpload"
      />
      <div
        :class="[
          'ref-capsule h-full w-32 shrink-0 flex items-center justify-center relative cursor-pointer bg-center bg-no-repeat bg-contain',
          theme.textTertiary,
          theme.buttonHover,
        ]"
        :style="sceneImageStyle"
        @click="sceneInputRef?.click()"
      >
        <div
          :class="[
            'flex items-center space-x-2 pointer-events-none',
            sceneReferenceImage && 'hidden',
          ]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            <path
              d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2zM15 5a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5z"
            />
          </svg>
          <span class="text-xs font-semibold">场景</span>
        </div>
        <button
          v-if="sceneReferenceImage"
          class="clear-btn absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs z-10 opacity-0 hover:opacity-100"
          @click.stop="clearSceneImage"
        >
          &times;
        </button>
      </div>

      <div :class="['w-px h-8', theme.cardBorder]"></div>

      <!-- 输入框 -->
      <input
        v-model="promptText"
        type="text"
        placeholder="输入剧本主题，例如'一个侦探故事，分6个镜头'"
        :class="[
          'bg-transparent text-base px-6 h-full w-full focus:ring-0 focus:outline-none',
          theme.inputText,
          theme.inputPlaceholder,
        ]"
        @keydown.enter="handleGenerate"
      />

      <!-- 生成按钮 -->
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold h-full px-6 shrink-0 flex items-center whitespace-nowrap"
        @click="handleGenerate"
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
          class="mr-2"
        >
          <path d="M12 2a10 10 0 1 1-7.07 17.07" />
          <path d="M12 2a10 10 0 0 0-7.07 17.07" />
          <path d="m12 2 4 4" />
          <path d="m22 12-4-4" />
          <path d="M12 22 8 18" />
          <path d="m2 12 4 4" />
        </svg>
        <span>生成</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { imageToBase64 } from "@/services/canvas";
import { useTheme } from "@/composables";

const { theme } = useTheme();

interface Props {
  isThinking?: boolean;
  characterReferenceImages?: string[];
  sceneReferenceImage?: string | null;
}

interface Emits {
  (e: "generate", prompt: string, charFiles: File[], sceneFile: File | null): void;
  (e: "update:characterReferenceImages", value: string[]): void;
  (e: "update:sceneReferenceImage", value: string | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  isThinking: false,
  characterReferenceImages: () => [],
  sceneReferenceImage: null,
});

const emit = defineEmits<Emits>();

const promptText = ref("");
const characterInputRef = ref<HTMLInputElement>();
const sceneInputRef = ref<HTMLInputElement>();
const characterFiles = ref<File[]>([]);
const sceneFile = ref<File | null>(null);

const characterImageStyle = computed(() => {
  if (props.characterReferenceImages.length > 0) {
    return { backgroundImage: `url('${props.characterReferenceImages[0]}')` };
  }
  return {};
});

const sceneImageStyle = computed(() => {
  if (props.sceneReferenceImage) {
    return { backgroundImage: `url('${props.sceneReferenceImage}')` };
  }
  return {};
});

const handleCharacterUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    characterFiles.value = Array.from(files); // 保存所有原始文件
    const base64Promises = Array.from(files).map((file) => imageToBase64(file));
    const base64Images = await Promise.all(base64Promises);
    emit("update:characterReferenceImages", base64Images);
  }
};

const handleSceneUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    sceneFile.value = file; // 保存原始文件
    const base64 = await imageToBase64(file);
    emit("update:sceneReferenceImage", base64);
  }
};

const clearCharacterImage = () => {
  characterFiles.value = []; // 清除所有文件
  emit("update:characterReferenceImages", []);
  if (characterInputRef.value) {
    characterInputRef.value.value = "";
  }
};

const clearSceneImage = () => {
  sceneFile.value = null; // 清除文件
  emit("update:sceneReferenceImage", null);
  if (sceneInputRef.value) {
    sceneInputRef.value.value = "";
  }
};

const handleGenerate = () => {
  if (!promptText.value.trim()) return;
  emit("generate", promptText.value, characterFiles.value, sceneFile.value);
  promptText.value = "";
};
</script>

<style scoped>
.breathing-gradient {
  background: linear-gradient(90deg, #3b82f6, #a855f7, #3b82f6);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: breathing-gradient-animation 4s ease infinite;
}

@keyframes breathing-gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.ref-capsule:hover .clear-btn {
  opacity: 1;
}
</style>
