import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import("@/views/ChatView.vue"),
  },
  {
    path: "/canvas",
    name: "Canvas",
    component: () => import("@/views/CanvasView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
