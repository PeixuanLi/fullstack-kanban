# NuxtJS + Nuxt UI 工程方案详解

本文档详细解释项目中 `frontend-nuxtjs` 目录下的 NuxtJS 与 Nuxt UI 实现，面向没有 NuxtJS 经验的读者。

## 目录

1. [什么是 NuxtJS](#什么是-nuxtjs)
2. [什么是 Nuxt UI](#什么是-nuxt-ui)
3. [项目初始化与配置](#项目初始化与配置)
4. [目录结构](#目录结构)
5. [核心概念详解](#核心概念详解)
6. [组件实现分析](#组件实现分析)
7. [拖拽功能实现](#拖拽功能实现)
8. [测试方案](#测试方案)

---

## 什么是 NuxtJS

**NuxtJS** 是基于 Vue.js 的全栈框架，提供了开箱即用的功能：

- **文件系统路由** — 根据 `pages/` 目录自动生成路由
- **自动导入** — 组件、组合式函数、工具函数无需手动导入
- **服务端渲染 (SSR)** — 更好的 SEO 和首屏性能（本项目使用纯客户端渲染）
- **TypeScript 支持** — 原生类型支持

### Nuxt vs 纯 Vue.js

```javascript
// 纯 Vue.js 需要手动配置路由
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({ ... })

// Nuxt 只需创建文件
// pages/index.vue → 自动映射到 /
// pages/boards/[id].vue → 自动映射到 /boards/:id
```

---

## 什么是 Nuxt UI

**Nuxt UI v4** 是基于 Nuxt 4 的 UI 组件库，提供：

- **预构建组件** — `UButton`、`UCard`、`UInput`、`UModal` 等
- **Tailwind CSS v4 集成** — 最新版 Tailwind，无需配置文件
- **深色模式** — 开箱即用的主题切换
- **图标支持** — 基于 Iconify，数千个图标可用
- **无障碍** — 符合 ARIA 标准

---

## 项目初始化与配置

### 1. package.json — 依赖声明

```json
{
  "dependencies": {
    "nuxt": "^4.4.2",           // Nuxt 核心框架
    "@nuxt/ui": "^4.5.1",       // Nuxt UI 组件库
    "tailwindcss": "^4.2.1",    // Tailwind CSS v4
    "vue-draggable-plus": "^0.6.1"  // 拖拽库（SortableJS 包装器）
  }
}
```

### 2. nuxt.config.ts — Nuxt 主配置

```typescript
export default defineNuxtConfig({
  // 模块系统：Nuxt 通过模块扩展功能
  modules: ['@nuxt/ui'],

  // 开发工具：启用 Nuxt DevTools
  devtools: { enabled: true },

  // CSS 入口：导入主样式文件
  css: ['~/assets/css/main.css'],

  // 运行时配置：可在服务端和客户端访问
  runtimeConfig: {
    public: {
      // 公共配置：暴露给客户端（环境变量 NUXT_PUBLIC_API_BASE）
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  },

  // 自动导入目录：types/ 下的类型会被自动导入
  imports: {
    dirs: ['types']
  },

  // 兼容性日期：用于 Nuxt 内部功能检测
  compatibilityDate: '2025-01-15'
})
```

**关键点解释：**

- `modules: ['@nuxt/ui']` — 注册 Nuxt UI 模块，自动配置 Tailwind 和组件
- `runtimeConfig.public` — 公共配置可在代码中通过 `useRuntimeConfig()` 访问
- `imports.dirs` — Nuxt 会自动导入指定目录下的内容

### 3. app.config.ts — 应用级 UI 配置

```typescript
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',    // 主色调为绿色
      neutral: 'slate'     // 中性色为 slate
    }
  }
})
```

这配置了 Nuxt UI 组件的默认颜色。所有 `UButton`、`UInput` 等组件的 `color="primary"` 都会使用绿色。

### 4. .nuxtrc — Nuxt RC 配置

```
setups.@nuxt/test-utils="4.0.0"
```

这是 Nuxt 的测试工具版本固定配置，确保测试兼容性。

### 5. .env — 环境变量

```bash
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

**命名规则：** `NUXT_PUBLIC_` 前缀的变量会被暴露给客户端代码。

---

## 目录结构

```
frontend-nuxtjs/
├── app/                      # 源码目录（Nuxt 4 的 app 模式）
│   ├── app.vue               # 根组件
│   ├── app.config.ts         # 应用配置
│   ├── assets/css/main.css   # 全局样式
│   ├── components/           # 组件目录（自动导入）
│   │   ├── AddCardForm.vue
│   │   ├── AddListForm.vue
│   │   ├── BoardComponent.vue
│   │   ├── CardEditModal.vue
│   │   ├── KanbanCard.vue
│   │   └── KanbanList.vue
│   ├── composables/          # 组合式函数（自动导入）
│   │   └── useAuth.ts
│   ├── middleware/           # 路由中间件
│   │   └── auth.global.ts    # 全局中间件（所有路由生效）
│   ├── pages/                # 页面路由（文件系统路由）
│   │   ├── index.vue         # → /
│   │   └── boards/
│   │       ├── index.vue     # → /boards
│   │       └── [boardId].vue # → /boards/:id
│   ├── plugins/              # Nuxt 插件
│   │   └── api.ts            # API 客户端插件
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── nuxt.config.ts            # Nuxt 主配置
├── package.json
└── vitest.config.ts          # 测试配置
```

---

## 核心概念详解

### 1. 文件系统路由

Nuxt 根据文件结构自动生成路由：

```
pages/
├── index.vue           → /
├── boards/
│   ├── index.vue       → /boards
│   └── [boardId].vue   → /boards/:id (动态路由)
```

**动态路由参数访问：**

```vue
<!-- pages/boards/[boardId].vue -->
<script setup lang="ts">
const route = useRoute('/boards/[boardId]')
const boardId = route.params.boardId  // 获取 URL 参数
</script>
```

### 2. 自动导入 (Auto-imports)

Nuxt 自动导入以下内容，无需手动 import：

- **Vue 核心** — `ref`、`computed`、`watch`、`onMounted` 等
- **Nuxt 组合式函数** — `useRoute`、`useRouter`、`useCookie`、`useRuntimeConfig` 等
- **自己的组件** — `components/` 下的 `.vue` 文件
- **自己的组合式函数** — `composables/` 下的 `.ts` 文件
- **Nuxt UI 组件** — `UButton`、`UCard`、`UInput` 等

**示例：**

```vue
<script setup lang="ts">
// 无需导入以下任何内容
const loading = ref(false)              // Vue 的 ref
const route = useRoute()                 // Nuxt 的 useRoute
const { user, login } = useAuth()        // 自己的 composable
const config = useRuntimeConfig()        // Nuxt 的 useRuntimeConfig
</script>

<template>
  <!-- UButton 无需导入 -->
  <UButton>Click me</UButton>
</template>
```

### 3. 插件系统

插件用于扩展 Nuxt 功能。本项目的 `plugins/api.ts` 创建了全局 `$api` 方法：

```typescript
// app/plugins/api.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 创建带有拦截器的 fetch 实例
  const api = $fetch.create({
    baseURL: config.public.apiBase,

    // 请求拦截：自动添加 JWT
    onRequest({ options }) {
      const token = useCookie('token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },

    // 响应错误拦截：401 时登出
    onResponseError({ response }) {
      if (response.status === 401) {
        // 清除 cookies 并跳转登录页
        navigateTo('/', { replace: true })
      }
    }
  })

  // 提供给全局使用
  return {
    provide: {
      api
    }
  }
})
```

**使用方式：**

```vue
<script setup lang="ts">
const { $api } = useNuxtApp()

async function fetchData() {
  const data = await $api('/boards')  // 自动添加 baseURL 和 JWT
}
</script>
```

### 4. 组合式函数 (Composables)

类似 React Hooks，用于复用逻辑：

```typescript
// app/composables/useAuth.ts
export function useAuth() {
  const { $api } = useNuxtApp()
  const tokenCookie = useCookie<string | null>('token')  // Nuxt 的 cookie（SSR 友好）
  const userCookie = useCookie<User | null>('user')

  const isAuthenticated = computed(() => !!tokenCookie.value)

  async function login(username: string, password: string) {
    const data = await $api<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    tokenCookie.value = data.access_token
  }

  function logout() {
    tokenCookie.value = null
    userCookie.value = null
  }

  return { isAuthenticated, login, logout, user: userCookie }
}
```

**关键点：** `useCookie` 是 Nuxt 提供的，与服务端渲染兼容，自动处理 cookie 的读写。

### 5. 中间件 (Middleware)

路由守卫，在导航前执行：

```typescript
// app/middleware/auth.global.ts
// 文件名中的 .global 表示全局中间件
export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie<string | null>('token')
  const publicRoutes = ['/']

  if (publicRoutes.includes(to.path)) {
    // 已登录用户访问首页，跳转到看板列表
    if (tokenCookie.value) {
      return navigateTo('/boards', { replace: true })
    }
    return
  }

  // 未登录用户访问受保护路由，跳转到首页
  if (!tokenCookie.value) {
    return navigateTo('/', { replace: true })
  }
})
```

### 6. app.vue — 根组件

```vue
<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'Kanban Board',
  description: 'A fullstack Kanban board application'
})
</script>

<template>
  <UApp>  <!-- Nuxt UI 的根组件，提供主题上下文 -->
    <NuxtPage />  <!-- 渲染当前路由的页面组件 -->
  </UApp>
</template>
```

- `useHead` — 设置页面 `<head>` 元素
- `useSeoMeta` — 设置 SEO 元数据
- `<NuxtPage />` — Nuxt 的内置组件，渲染路由对应的页面

---

## 组件实现分析

### 1. 登录页面 (pages/index.vue)

```vue
<script setup lang="ts">
const { isAuthenticated, isLoading, login, register } = useAuth()

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

// 已登录用户自动跳转
watchEffect(() => {
  if (!isLoading.value && isAuthenticated.value) {
    navigateTo('/boards', { replace: true })
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    if (isRegister.value) {
      await register(username.value, password.value)
    } else {
      await login(username.value, password.value)
    }
    navigateTo('/boards')
  } catch (err: any) {
    error.value = err.data?.message || err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1>Kanban Board</h1>
      </template>

      <form @submit.prevent="handleSubmit">
        <UFormField label="Username">
          <UInput v-model="username" required />
        </UFormField>

        <UFormField label="Password">
          <UInput v-model="password" type="password" required />
        </UFormField>

        <UButton type="submit" :loading="submitting">
          {{ isRegister ? 'Register' : 'Login' }}
        </UButton>
      </form>
    </UCard>
  </div>
</template>
```

**Nuxt UI 组件说明：**

| 组件 | 用途 |
|------|------|
| `UCard` | 卡片容器，有 header、body、footer 插槽 |
| `UButton` | 按钮，支持 `loading`、`color`、`variant` 等属性 |
| `UInput` | 输入框，支持 `v-model` 双向绑定 |
| `UFormField` | 表单字段包装器，提供标签和验证状态 |

### 2. 看板列表页 (pages/boards/index.vue)

```vue
<script setup lang="ts">
const { user, logout } = useAuth()
const { $api } = useNuxtApp()

const boards = ref<Board[]>([])
const loading = ref(true)

async function fetchBoards() {
  try {
    boards.value = await $api<Board[]>('/boards')
  } catch {
    error.value = 'Failed to load boards'
  } finally {
    loading.value = false
  }
}

async function createBoard() {
  const board = await $api<Board>('/boards', {
    method: 'POST',
    body: { title: newTitle.value }
  })
  boards.value.push(board)
}

async function deleteBoard(id: number) {
  await $api(`/boards/${id}`, { method: 'DELETE' })
  boards.value = boards.value.filter(b => b.id !== id)
}

onMounted(() => {
  fetchBoards()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="flex items-center justify-between px-6 py-4 bg-elevated/50 backdrop-blur">
      <h1>My Boards</h1>
      <div class="flex items-center gap-3">
        <span>{{ user?.username }}</span>
        <UColorModeButton />  <!-- 深色模式切换按钮 -->
        <UButton icon="i-lucide-log-out" @click="logout">
          Logout
        </UButton>
      </div>
    </header>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 4" :key="i" class="h-32" />
    </div>

    <!-- 空状态 -->
    <UEmpty
      v-else-if="boards.length === 0"
      title="No boards yet"
      description="Create your first board to get started."
    />

    <!-- 看板卡片网格 -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="board in boards" :key="board.id">
        <template #header>
          <h3>{{ board.title }}</h3>
        </template>
        <template #footer>
          <UButton @click="navigateTo(`/boards/${board.id}`)">
            Open
          </UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>
```

**Nuxt UI 更多组件：**

| 组件 | 用途 |
|------|------|
| `USkeleton` | 加载骨架屏 |
| `UEmpty` | 空状态提示 |
| `UColorModeButton` | 深色/浅色模式切换 |
| `USeparator` | 分隔线 |
| `UAlert` | 警告提示框 |

---

## 拖拽功能实现

### vue-draggable-plus 简介

项目使用 `vue-draggable-plus`，它是 SortableJS 的 Vue 3 包装器。

### 列表拖拽 (KanbanList.vue)

```vue
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

const localCards = ref<Card[]>([])
const draggableKey = ref(0)

// 当 props 更新时同步本地状态
function syncFromProps() {
  localCards.value = [...props.list.cards].sort((a, b) => a.position - b.position)
  draggableKey.value++  // 强制 VueDraggable 重新挂载
}

watch(() => props.list.cards, syncFromProps, { deep: true, immediate: true })

function onDragEnd(evt: any) {
  const { item, to, newIndex } = evt
  const cardId = Number(item.dataset?.id)
  const destListId = Number(to.dataset?.listId)

  emit('cardMoved', { cardId, destListId, newIndex })
}
</script>

<template>
  <UCard>
    <ClientOnly>
      <VueDraggable
        :key="draggableKey"
        v-model="localCards"
        group="cards"
        @end="onDragEnd"
      >
        <KanbanCard
          v-for="card in localCards"
          :key="card.id"
          :card="card"
          :data-id="card.id"
        />
      </VueDraggable>
    </ClientOnly>
  </UCard>
</template>
```

**关键点：**

1. **`ClientOnly`** — 组件只在客户端渲染，避免 SSR 问题
2. **`group="cards"`** — 允许跨列表拖拽
3. **`data-id`** — 在 DOM 中存储 ID，拖拽时读取
4. **`draggableKey`** — 强制重新挂载，保持 DOM 与数据同步

### 看板拖拽 (BoardComponent.vue)

```vue
<template>
  <UScrollArea orientation="horizontal">
    <div class="flex gap-4">
      <ClientOnly>
        <VueDraggable
          :model-value="sortedLists"
          group="lists"
          class="flex gap-4"
        >
          <div v-for="list in sortedLists" :key="list.id" :data-list-id="list.id">
            <KanbanList :list="list" />
          </div>
        </VueDraggable>
      </ClientOnly>
    </div>
  </UScrollArea>
</template>
```

---

## 样式系统

### Tailwind CSS v4 集成

```css
/* app/assets/css/main.css */
@import "tailwindcss";      /* 导入 Tailwind CSS v4 */
@import "@nuxt/ui";         /* 导入 Nuxt UI 的 Tailwind 配置 */

@theme static {
  --font-sans: 'Public Sans', sans-serif;

  /* 自定义绿色主题 */
  --color-green-50: #EFFDF5;
  --color-green-100: #D9FBE8;
  /* ... 更多绿色色阶 */
}
```

**Tailwind CSS v4 的变化：**

- **不再需要 `tailwind.config.js`** — 配置直接在 CSS 中
- **使用 `@theme` 指令** — 定义自定义主题
- **`@import "tailwindcss"`** — 导入核心样式

### Nuxt UI 的设计 Token

Nuxt UI 提供了语义化的颜色类：

```html
<div class="bg-background">      <!-- 背景色（自动适配深色模式） -->
<div class="bg-elevated">        <!-- 悬浮层背景 -->
<div class="text-muted">         <!-- 次要文本 -->
<div class="border-primary/30">  <!-- 主色半透明边框 -->
```

---

## 测试方案

### vitest.config.ts

```typescript
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',    // 使用 happy-dom 模拟浏览器
    globals: true,               // 全局测试 API（describe, it, expect）
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),  // ~ 别名指向 app 目录
      '#imports': resolve(__dirname, '.nuxt/imports')
    }
  }
})
```

### tests/setup.ts — 测试环境配置

```typescript
import { vi } from 'vitest'

// 模拟 Nuxt 自动导入的全局变量
vi.stubGlobal('useCookie', vi.fn(() => {
  let value: any = null
  return {
    get value() { return value },
    set value(v: any) { value = v }
  }
}))

vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  public: { apiBase: 'http://localhost:3001' }
})))

vi.stubGlobal('useNuxtApp', vi.fn(() => ({
  $api: vi.fn()
})))
```

这确保了测试环境不需要完整的 Nuxt 运行时，使测试快速且隔离。

---

## 与 Next.js 前端对比

项目中同时存在 `frontend/` (Next.js) 和 `frontend-nuxtjs/` (NuxtJS) 两个实现：

| 方面 | Next.js | NuxtJS |
|------|---------|--------|
| 框架基础 | React | Vue |
| 路由 | `app/` 目录 (App Router) | `pages/` 目录 |
| 组件扩展名 | `.tsx` | `.vue` |
| 状态管理 | React Context + Hooks | Composables |
| API 调用 | `lib/api.ts` 手动封装 | `plugins/api.ts` 全局注入 |
| UI 库 | shadcn/ui | @nuxt/ui |
| 拖拽库 | @hello-pangea/dnd | vue-draggable-plus |

两者实现相同的功能，展示了不同技术栈的解决方案。

---

## 快速参考

### 常用 Nuxt 组合式函数

| 函数 | 用途 |
|------|------|
| `useRoute()` | 获取当前路由信息 |
| `useRouter()` | 路由跳转 (`push`, `replace`) |
| `useCookie(name)` | 读写 Cookie（SSR 友好） |
| `useRuntimeConfig()` | 获取运行时配置 |
| `useNuxtApp()` | 获取 Nuxt 应用实例 |
| `useHead()` | 设置页面 head 元素 |
| `useSeoMeta()` | 设置 SEO 元数据 |

### 常用 Nuxt UI 组件

| 组件 | 用途 |
|------|------|
| `UButton` | 按钮 |
| `UCard` | 卡片容器 |
| `UInput` | 输入框 |
| `UTextarea` | 多行输入 |
| `UFormField` | 表单字段 |
| `UModal` | 模态框 |
| `UAlert` | 警告提示 |
| `USkeleton` | 骨架屏 |
| `UEmpty` | 空状态 |
| `UScrollArea` | 滚动区域 |
| `USeparator` | 分隔线 |
| `UColorModeButton` | 主题切换 |

---

## 总结

本项目的 NuxtJS 前端展示了：

1. **文件系统路由** — 无需手动配置路由
2. **自动导入** — 减少样板代码
3. **组合式函数** — 逻辑复用与状态管理
4. **插件系统** — 全局 API 注入和拦截器
5. **Nuxt UI** — 开箱即用的组件库
6. **Tailwind CSS v4** — 无配置文件的样式系统
7. **vue-draggable-plus** — 灵活的拖拽功能

这是一个完整的、生产级的 NuxtJS + Nuxt UI 应用实现，可作为学习参考。
