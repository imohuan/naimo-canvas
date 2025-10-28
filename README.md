# Naimo Canvas

> **⚠️ 项目已弃用**  
> 本项目已不再维护。由于费用原因，不再推荐使用此方案。

## 弃用说明

本项目是一个基于 **Coze 工作流** 的文本转视频分镜可视化工具。然而，在实际使用中发现：

- **即梦 API 费用过高**：通过 Coze 工作流调用即梦 API 的成本远超预期
- **更好的替代方案**：直接使用即梦的 Agent 功能更加经济实惠且灵活
- **依赖过重**：项目强依赖 Coze 工作流，增加了系统复杂度

**建议替代方案**：直接使用 [即梦 Agent](https://jimeng.jianying.com/) 进行故事分镜生成和视频制作。

---

## 项目简介

Naimo Canvas 是一个实验性的 AI 辅助视频创作工具，主要功能包括：

- **文本智能分割**：将长文本自动分割成多个视频分镜
- **故事可视化**：通过拖拽式画布管理故事板和分镜卡片
- **AI 内容生成**：
  - 文本生成图片
  - 图片生成视频
  - 音频生成（实验性功能）
- **参考图管理**：支持角色参考图和场景参考图
- **可视化连接**：分镜之间可建立逻辑连接关系

## 技术栈

- **框架**：Vue 3 + TypeScript + Vite
- **UI**：Tailwind CSS + PrimeVue (Volt 无样式组件)
- **状态管理**：Pinia (Setup Store)
- **路由**：Vue Router
- **AI 服务**：Coze API + 工作流
- **工具库**：VueUse、lodash-es、mitt、axios

## 项目结构

```
src/
├── components/
│   ├── business/           # 业务组件
│   │   ├── CanvasCard.vue           # 分镜卡片
│   │   ├── CanvasStoryboard.vue     # 故事板
│   │   ├── ImageGenerationMode.vue  # 图片生成模式
│   │   ├── VideoGenerationMode.vue  # 视频生成模式
│   │   └── AudioGenerationMode.vue  # 音频生成模式
│   └── common/             # 通用组件
├── composables/            # 组合式函数
│   └── business/
│       ├── useCanvas.ts    # 画布逻辑
│       └── useCozeClient.ts # Coze 客户端
├── config/
│   ├── cozeWorkflow.ts     # Coze 工作流配置
│   └── canvas.ts           # 画布配置
├── core/
│   └── cozeClient.ts       # Coze API 封装
├── services/
│   └── canvas.ts           # 画布业务服务
├── stores/                 # Pinia Store
├── views/
│   └── CanvasView.vue      # 画布主视图
└── volt/                   # UI 组件库
```

## 本地运行

虽然项目已弃用，但仍可用于学习和参考：

```bash
# 安装依赖
pnpm install

# 配置环境变量
# 复制 .env.example 为 .env，填入 Coze API 密钥

# 运行开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 核心功能实现

### Coze 工作流

项目使用了以下 Coze 工作流（配置在 `src/config/cozeWorkflow.ts`）：

1. **TEXT_TO_VIDEO_SHOTS**：文本分割成分镜
2. **GENERATE_VIDEO**：根据图片生成视频
3. **GET_LIST**：获取项目列表
4. **DELETE_DATA**：删除数据
5. **IMAGE_FILEID_TO_URL**：图片 ID 转 URL

### 画布系统

- 无限画布：支持拖拽、缩放、平移
- 故事板管理：多个故事板可独立布局
- 卡片连接：支持分镜之间的逻辑连接
- 响应式布局：自适应容器大小

### AI 生成流程

1. 用户输入文本 → 调用文本分割工作流
2. 生成分镜卡片 → 每个卡片独立生成图片
3. 图片完成后 → 可选生成视频
4. 支持参考图 → 保持角色/场景一致性

## 开发规范

本项目严格遵循以下规范：

- **代码风格**：Prettier + Oxlint
- **类型安全**：完整的 TypeScript 类型定义
- **组件设计**：单一职责 + Composables 逻辑复用
- **状态管理**：Pinia Setup Store
- **工具函数**：VueUse + lodash-es（按需导入）

详细开发规范请参考 `docs/` 目录。

## 经验总结

### 值得参考的部分

- **画布系统实现**：拖拽、缩放、连接线等交互
- **Composables 设计**：`useCanvas.ts` 展示了复杂状态逻辑的封装
- **类型系统**：完整的 TypeScript 类型定义和类型推导
- **工作流封装**：Coze API 的 TypeScript 封装方式

### 踩过的坑

- **成本控制**：API 调用费用需要提前评估
- **异步工作流**：需要实现轮询机制获取结果
- **图片处理**：大图需要压缩后再上传
- **连接线绘制**：需要考虑缩放和滚动的坐标转换

## 替代方案建议

如果你需要实现类似功能，建议：

1. **直接使用即梦 Agent**：成本更低，功能更完善
2. **使用开源 AI 模型**：如 Stable Diffusion、ComfyUI
3. **自建工作流**：使用 Langchain、Dify 等框架
4. **云服务**：阿里云、腾讯云的 AI 创作服务

## 许可证

MIT License

## 致谢

感谢在项目开发过程中提供帮助的所有开源项目和社区成员。
