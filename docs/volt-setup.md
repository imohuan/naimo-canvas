# Volt UI 组件库配置

Volt 是基于 PrimeVue 的 Tailwind CSS 原生无样式组件库，本文档介绍如何在项目中配置和使用 Volt。

## 概述

Volt 是一套预构建的 Vue 组件，基于 PrimeVue + Tailwind CSS v4+，采用无样式（Unstyled）模式，提供完全的样式可定制性。

**官方文档：** https://volt.primevue.org/vite/

## 安装配置

### 1. Tailwind CSS v4+ 配置

Volt 要求 Tailwind CSS v4+ 及以上版本，确保已正确配置 Tailwind CSS（参考 [技术栈文档](./tech-stack.md)）。

### 2. 安装 tailwindcss-primeui 插件

该插件为 Tailwind 提供了新的工具类和变体：

```bash
pnpm add tailwindcss-primeui
pnpm add tailwind-merge
```

**功能说明：**

- 扩展工具类：`text-primary`、`bg-surface-500` 等
- 新增变体：`p-` 前缀（如 `p-selected`）
- `tailwind-merge`：高效处理外部类合并

### 3. 导入 tailwindcss-primeui

在 `src/style.css` 中添加：

```css
@import "tailwindcss";
@import "tailwindcss-primeui";
```

### 4. 安装 PrimeVue

```bash
pnpm add primevue
```

### 5. 配置 PrimeVue（无样式模式）

在 `src/main.ts` 中启用无样式模式：

```typescript
import { createApp } from "vue";
import PrimeVue from "primevue/config";
import App from "./App.vue";

const app = createApp(App);
app.use(PrimeVue, {
  unstyled: true, // 启用无样式模式
});
app.mount("#app");
```

### 6. 配置 Vite 路径别名

在 `vite.config.ts` 中配置 `@` 别名：

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 7. 定义 CSS 变量

在 `src/style.css` 或全局样式文件中定义 Volt 使用的 CSS 变量：

```css
/* Primary and Surface Palettes */
:root {
  --p-primary-50: #ecfdf5;
  --p-primary-100: #d1fae5;
  --p-primary-200: #a7f3d0;
  --p-primary-300: #6ee7b7;
  --p-primary-400: #34d399;
  --p-primary-500: #10b981;
  --p-primary-600: #059669;
  --p-primary-700: #047857;
  --p-primary-800: #065f46;
  --p-primary-900: #064e3b;
  --p-primary-950: #022c22;
  --p-surface-0: #ffffff;
  --p-surface-50: #fafafa;
  --p-surface-100: #f4f4f5;
  --p-surface-200: #e4e4e7;
  --p-surface-300: #d4d4d8;
  --p-surface-400: #a1a1aa;
  --p-surface-500: #71717a;
  --p-surface-600: #52525b;
  --p-surface-700: #3f3f46;
  --p-surface-800: #27272a;
  --p-surface-900: #18181b;
  --p-surface-950: #09090b;
  --p-content-border-radius: 6px;
}

/* Light Mode */
:root {
  --p-primary-color: var(--p-primary-500);
  --p-primary-contrast-color: var(--p-surface-0);
  --p-primary-hover-color: var(--p-primary-600);
  --p-primary-active-color: var(--p-primary-700);
  --p-content-border-color: var(--p-surface-200);
  --p-content-hover-background: var(--p-surface-100);
  --p-content-hover-color: var(--p-surface-800);
  --p-highlight-background: var(--p-primary-50);
  --p-highlight-color: var(--p-primary-700);
  --p-highlight-focus-background: var(--p-primary-100);
  --p-highlight-focus-color: var(--p-primary-800);
  --p-text-color: var(--p-surface-700);
  --p-text-hover-color: var(--p-surface-800);
  --p-text-muted-color: var(--p-surface-500);
  --p-text-hover-muted-color: var(--p-surface-600);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --p-primary-color: var(--p-primary-400);
    --p-primary-contrast-color: var(--p-surface-900);
    --p-primary-hover-color: var(--p-primary-300);
    --p-primary-active-color: var(--p-primary-200);
    --p-content-border-color: var(--p-surface-700);
    --p-content-hover-background: var(--p-surface-800);
    --p-content-hover-color: var(--p-surface-0);
    --p-highlight-background: color-mix(in srgb, var(--p-primary-400), transparent 84%);
    --p-highlight-color: rgba(255, 255, 255, 0.87);
    --p-highlight-focus-background: color-mix(in srgb, var(--p-primary-400), transparent 76%);
    --p-highlight-focus-color: rgba(255, 255, 255, 0.87);
    --p-text-color: var(--p-surface-0);
    --p-text-hover-color: var(--p-surface-0);
    --p-text-muted-color: var(--p-surface-400);
    --p-text-hover-muted-color: var(--p-surface-300);
  }
}
```

**说明：**

- 定义了主色调（Primary）和表面色（Surface）调色板
- 支持亮色和暗色模式
- 可根据设计需求自定义颜色值

## 下载组件

Volt 采用按需下载的方式，使用 `npx volt-vue` 命令下载组件到项目中。

### 下载命令

```bash
# 下载单个组件
npx volt-vue add Button
npx volt-vue add DataTable
npx volt-vue add Dialog
npx volt-vue add DatePicker

# 下载多个组件（一次性）
npx volt-vue add Button DataTable Dialog
```

### 组件存放位置

下载的组件会保存在 `src/volt/` 目录下：

```
src/
└── volt/
    ├── Button.vue
    ├── DataTable.vue
    ├── Dialog.vue
    └── DatePicker.vue
```

## 使用组件

### 本地注册（推荐）

在组件中按需导入 Volt 组件，使用 `@/volt` 路径别名：

```vue
<template>
  <div>
    <h1>用户列表</h1>
    <Button label="新增用户" @click="handleAdd" />
    <DataTable :value="users" />
  </div>
</template>

<script setup lang="ts">
import Button from "@/volt/Button.vue";
import DataTable from "@/volt/DataTable.vue";

const handleAdd = () => {
  console.log("新增用户");
};

const users = [
  { id: 1, name: "张三", age: 25 },
  { id: 2, name: "李四", age: 30 },
];
</script>
```

### 全局注册（可选）

如果某些组件在多处使用，可以全局注册。在 `src/main.ts` 中：

```typescript
import { createApp } from "vue";
import App from "./App.vue";
import Button from "@/volt/Button.vue";
import DataTable from "@/volt/DataTable.vue";

const app = createApp(App);
app.component("Button", Button);
app.component("DataTable", DataTable);
app.mount("#app");
```

## 常用组件列表

以下是常用的 Volt 组件及其下载命令：

| 组件名称    | 下载命令                       | 用途       |
| ----------- | ------------------------------ | ---------- |
| Button      | `npx volt-vue add Button`      | 按钮       |
| InputText   | `npx volt-vue add InputText`   | 文本输入框 |
| Checkbox    | `npx volt-vue add Checkbox`    | 复选框     |
| RadioButton | `npx volt-vue add RadioButton` | 单选按钮   |
| Select      | `npx volt-vue add Select`      | 下拉选择器 |
| Dialog      | `npx volt-vue add Dialog`      | 对话框     |
| DataTable   | `npx volt-vue add DataTable`   | 数据表格   |
| DatePicker  | `npx volt-vue add DatePicker`  | 日期选择器 |
| Toast       | `npx volt-vue add Toast`       | 消息提示   |
| Menu        | `npx volt-vue add Menu`        | 菜单       |
| Card        | `npx volt-vue add Card`        | 卡片       |
| Tabs        | `npx volt-vue add Tabs`        | 标签页     |

**完整组件列表：** https://volt.primevue.org/vite/#components

## 样式定制

### 通过 CSS 变量定制

修改全局 CSS 变量来调整整体风格：

```css
:root {
  /* 自定义主色调 */
  --p-primary-500: #3b82f6; /* 蓝色 */

  /* 自定义圆角 */
  --p-content-border-radius: 8px;
}
```

### 通过 Tailwind 类定制

Volt 组件支持通过 class 属性传递 Tailwind 类：

```vue
<Button label="确定" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg" />
```

### 覆盖组件样式

直接修改 `src/volt/` 中的组件文件来定制样式：

```vue
<!-- src/volt/Button.vue -->
<template>
  <button
    :class="[
      'px-4 py-2 rounded-md font-medium transition-colors',
      'bg-primary hover:bg-primary-hover',
      'text-white',
      props.class,
    ]"
  >
    {{ label }}
  </button>
</template>
```

## 最佳实践

### 1. 统一导入路径

始终使用 `@/volt` 导入组件，保持项目一致性：

```typescript
// ✅ 正确
import Button from "@/volt/Button.vue";

// ❌ 错误
import Button from "../volt/Button.vue";
import Button from "../../volt/Button.vue";
```

### 2. 按需下载组件

只下载项目实际使用的组件，避免不必要的文件：

```bash
# ✅ 只下载需要的
npx volt-vue add Button Dialog

# ❌ 避免一次性下载所有组件
```

### 3. 类型安全

为 Volt 组件 Props 定义类型：

```typescript
import type { ButtonProps } from "primevue/button";

const buttonProps: ButtonProps = {
  label: "提交",
  severity: "primary",
  size: "large",
};
```

### 4. 样式隔离

如果需要对特定组件应用独特样式，使用 scoped 样式或 Tailwind 类：

```vue
<style scoped>
.custom-button {
  @apply bg-gradient-to-r from-blue-500 to-purple-600;
}
</style>
```

### 5. 响应式设计

利用 Tailwind 响应式类实现不同屏幕适配：

```vue
<Button label="操作" class="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3" />
```

## 故障排查

### 问题 1: 组件样式不生效

**原因：** CSS 变量未定义或导入顺序错误

**解决方案：**

1. 确保在 `src/style.css` 中导入了 `tailwindcss-primeui`
2. 检查 CSS 变量是否正确定义
3. 确认 PrimeVue 配置了 `unstyled: true`

### 问题 2: 组件导入路径错误

**原因：** 路径别名未配置

**解决方案：**

1. 检查 `vite.config.ts` 中的 alias 配置
2. 检查 `tsconfig.json` 中的 paths 配置

### 问题 3: 类型提示缺失

**原因：** PrimeVue 类型未安装

**解决方案：**

```bash
pnpm add -D @types/primevue
```

## 参考资源

- **Volt 官方文档：** https://volt.primevue.org/vite/
- **PrimeVue 文档：** https://primevue.org/
- **Tailwind CSS v4 文档：** https://tailwindcss.com/docs
- **示例项目：** https://github.com/primefaces/primevue-examples/tree/main/volt-vite

## 总结

通过 Volt，你可以：

- 快速构建现代化 UI 界面
- 完全掌控组件样式和行为
- 享受 Tailwind CSS 的便利性
- 获得 PrimeVue 的强大功能

记住核心原则：

- 使用 `@/volt` 导入组件
- 按需下载组件
- 通过 Tailwind 类定制样式
- 保持类型安全
