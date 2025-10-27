<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-x-8"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-8 scale-95"
  >
    <div
      v-if="visible"
      :class="[
        'flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm',
        'max-w-md min-w-[320px] border',
        typeClasses[type],
      ]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <!-- 图标 -->
      <div class="shrink-0 mt-0.5">
        <component :is="iconComponent" :class="['w-5 h-5', iconColorClasses[type]]" />
      </div>

      <!-- 内容 -->
      <div class="flex-1 min-w-0">
        <p v-if="title" class="font-semibold text-sm mb-1">
          {{ title }}
        </p>
        <p class="text-sm wrap-break-word whitespace-pre-wrap">
          {{ message }}
        </p>
      </div>

      <!-- 关闭按钮 -->
      <button
        class="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        @click="close"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";

/** 通知类型 */
export type NotifyType = "success" | "error" | "warning" | "info";

interface Props {
  /** 通知 ID */
  id: string;
  /** 通知消息 */
  message: string;
  /** 通知标题 */
  title?: string;
  /** 通知类型 */
  type?: NotifyType;
  /** 自动关闭时间（毫秒），0 表示不自动关闭 */
  duration?: number;
  /** 关闭回调 */
  onClose?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  type: "info",
  duration: 3000,
});

const visible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;
let remainingTime = ref(props.duration);
let pausedAt = 0;

/** 类型对应的样式类 */
const typeClasses: Record<NotifyType, string> = {
  success:
    "bg-green-50/95 border-green-200 text-green-800 dark:bg-green-500/15 dark:border-green-700/35 dark:text-green-400",
  error:
    "bg-red-50/95 border-red-200 text-red-800 dark:bg-red-500/15 dark:border-red-700/35 dark:text-red-400",
  warning:
    "bg-yellow-50/95 border-yellow-200 text-yellow-800 dark:bg-yellow-500/15 dark:border-yellow-700/35 dark:text-yellow-400",
  info: "bg-blue-50/95 border-blue-200 text-blue-800 dark:bg-blue-500/15 dark:border-blue-700/35 dark:text-blue-400",
};

/** 图标颜色类 */
const iconColorClasses: Record<NotifyType, string> = {
  success: "text-green-600 dark:text-green-500",
  error: "text-red-600 dark:text-red-500",
  warning: "text-yellow-600 dark:text-yellow-500",
  info: "text-blue-600 dark:text-blue-500",
};

/** 图标组件 */
const iconComponent = computed(() => {
  const icons = {
    success: SuccessIcon,
    error: ErrorIcon,
    warning: WarningIcon,
    info: InfoIcon,
  };
  return icons[props.type];
});

/** 开始计时器 */
const startTimer = () => {
  if (props.duration > 0 && remainingTime.value > 0) {
    pausedAt = Date.now();
    timer = setTimeout(() => {
      close();
    }, remainingTime.value);
  }
};

/** 暂停计时器 */
const pauseTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    remainingTime.value -= Date.now() - pausedAt;
  }
};

/** 恢复计时器 */
const resumeTimer = () => {
  startTimer();
};

/** 关闭通知 */
const close = () => {
  visible.value = false;
  setTimeout(() => {
    props.onClose?.();
  }, 200); // 等待动画完成
};

onMounted(() => {
  visible.value = true;
  startTimer();
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});

// 图标组件
const SuccessIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
};

const ErrorIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
};

const WarningIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  `,
};

const InfoIcon = {
  template: `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `,
};
</script>
