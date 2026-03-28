---
title: '前端开发上下文 — frontend-features 分支'
type: 'feature'
created: '2026-03-28'
branch: frontend-features
base: main
---

# 前端开发上下文

## 启动命令

```bash
cd /Users/lipeixuan/code/002_AiAgent/fullstack-kanban
git worktree add .claude/worktrees/frontend-features frontend-features 2>/dev/null || git checkout -b frontend-features
```

然后在 Claude Code 中执行：

```
请基于前端开发规范，在 frontend/ 目录下实现以下所有页面和组件：
1. API 客户端和认证状态管理
2. 登录/注册页面
3. 看板列表页
4. 看板详情页（含拖拽）
5. 组件测试
```

---

## 技术栈

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- @hello-pangea/dnd（拖拽库，已安装）
- 无额外 UI 框架，使用原生 Tailwind 样式

## 已完成的基础设施

- `frontend/` 项目骨架已建好，App Router + Tailwind + TypeScript
- `@hello-pangea/dnd` 已安装
- `frontend/src/app/layout.tsx` — 根布局（默认模板）
- `frontend/src/app/globals.css` — Tailwind 全局样式

## 后端 API 约定（前端对接用）

**Base URL:** `http://localhost:3001`

**认证相关：**
- `POST /auth/register` — body: `{ username, password }` → `{ access_token }`
- `POST /auth/login` — body: `{ username, password }` → `{ access_token }`

**看板相关（需 Bearer token）：**
- `GET /boards` → `[{ id, title, userId, createdAt, updatedAt, lists: [{ id, title, position, boardId, cards: [{ id, title, content, position, listId }] }] }]`
- `POST /boards` — body: `{ title }` → `{ id, title, userId, ... }`
- `GET /boards/:id` → `{ id, title, lists: [{ ..., cards: [{ ... }] }] }`
- `PATCH /boards/:id` — body: `{ title }` → `{ ... }`
- `DELETE /boards/:id` → 204

**列表相关（需 Bearer token）：**
- `POST /boards/:boardId/lists` — body: `{ title }` → `{ id, title, position, boardId }`
- `PATCH /lists/:id` — body: `{ title }` → `{ ... }`
- `DELETE /lists/:id` → 204
- `PUT /boards/:boardId/lists/reorder` — body: `[{ listId, position }]`

**卡片相关（需 Bearer token）：**
- `POST /lists/:listId/cards` — body: `{ title, content? }` → `{ id, title, content, position, listId }`
- `PATCH /cards/:id` — body: `{ title?, content? }` → `{ ... }`
- `DELETE /cards/:id` → 204
- `PUT /cards/:id/move` — body: `{ listId, position }` → `{ ... }`

## 需要实现的模块

### 1. API 客户端 (`frontend/src/lib/api.ts`)

- 封装 fetch，自动附加 `Authorization: Bearer <token>` 头
- Token 从 localStorage 读取
- 401 响应时自动清除 token 并重定向到登录页
- 导出方法：`api.get/post/put/patch/delete`

### 2. 认证状态管理 (`frontend/src/lib/auth.tsx`)

- React Context + Provider
- 状态：`{ user: { username } | null, token: string | null, isLoading }`
- 方法：`login(username, password)`, `register(username, password)`, `logout()`
- Token 持久化到 localStorage
- 页面刷新时自动恢复登录状态

### 3. 登录/注册页面 (`frontend/src/app/page.tsx`)

- 默认显示登录表单，可切换到注册表单
- 表单字段：用户名 + 密码
- 提交后调用 API，成功则跳转到 `/boards`
- 已登录用户自动重定向到 `/boards`
- 样式：居中卡片式表单，Tailwind 样式

### 4. 看板列表页 (`frontend/src/app/boards/page.tsx`)

- 显示当前用户的所有看板（卡片网格布局）
- 每个看板卡片：标题 + 点击跳转到 `/boards/:id`
- 顶部有"新建看板"按钮（弹出输入框或简单 inline 表单）
- 支持删除看板（确认弹窗）
- 未登录重定向到首页

### 5. 看板详情页 + 拖拽 (`frontend/src/app/boards/[id]/page.tsx` + 组件)

**组件清单：**
- `components/Board.tsx` — 看板容器，横向滚动排列所有列表
- `components/List.tsx` — 单个列表，包含标题、卡片列表、新增卡片按钮
- `components/Card.tsx` — 单个卡片，显示标题和内容
- `components/AddListForm.tsx` — 新增列表的 inline 表单
- `components/AddCardForm.tsx` — 新增卡片的 inline 表单

**拖拽实现（@hello-pangea/dnd）：**
- `Board` 组件为 `DragDropContext`
- 每个 `List` 为 `Droppable`（droppableId = `list-${listId}`）
- 每个 `Card` 为 `Draggable`（draggableId = `card-${cardId}`）
- `onDragEnd` 处理：
  - 同列表排序：调用 `PUT /boards/:boardId/lists/reorder` 更新 position
  - 跨列表移动：调用 `PUT /cards/:id/move` 移动卡片

**交互功能：**
- 新增列表（inline 表单，尾部 "+" 按钮）
- 新增卡片（列表底部 inline 表单）
- 编辑卡片标题/内容（点击卡片弹出编辑）
- 删除卡片、删除列表（带确认）
- 看板标题编辑

**样式设计：**
- 看板背景：深色/灰色
- 列表：白色/浅灰色圆角卡片，固定宽度（280px）
- 卡片：白色卡片，阴影，紧凑布局
- 拖拽时卡片半透明 + 阴影效果

### 6. 根布局更新 (`frontend/src/app/layout.tsx`)

- 包裹 `AuthProvider`
- 设置默认 meta 信息

### 7. 测试

- 使用 Jest + React Testing Library
- `api.test.ts` — 测试 API 客户端的请求封装和错误处理
- `LoginForm.test.tsx` — 测试登录/注册表单交互
- `Board.test.tsx` — 测试看板组件渲染
- `Card.test.tsx` — 测试卡片拖拽交互

## 注意事项

- 这是客户端渲染应用（`"use client"`），所有页面和组件使用客户端渲染
- 所有 API 调用需要处理 loading 和 error 状态
- 环境变量 `NEXT_PUBLIC_API_URL` 默认值 `http://localhost:3001`
- 拖拽库使用 `@hello-pangea/dnd`（react-beautiful-dnd 的维护分支）
- 不使用任何 UI 框架，全部用 Tailwind CSS 手写样式
