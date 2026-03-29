# Next.js/React 前端工程方案详解

本文档面向没有 React/Next.js 经验的读者，深入分析本项目的 Next.js 和 React 实现方案。

## 目录

1. [核心概念入门](#核心概念入门)
2. [Next.js App Router](#next-js-app-router)
3. [React 基础](#react-基础)
4. [项目结构](#项目结构)
5. [状态管理](#状态管理)
6. [认证系统](#认证系统)
7. [API 层](#api-层)
8. [拖拽实现](#拖拽实现)
9. [样式系统](#样式系统)
10. [组件库](#组件库)

---

## 核心概念入门

### 什么是 React？

React 是一个用于构建用户界面的 JavaScript 库。核心思想是将 UI 拆分成独立、可复用的组件。

```tsx
// 一个简单的 React 组件
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

### 什么是 Next.js？

Next.js 是基于 React 的全栈框架，提供了：
- **路由系统**：基于文件系统的自动路由
- **服务端渲染**：更好的 SEO 和首屏性能
- **API 路由**：可以编写后端接口
- **零配置**：开箱即用的 TypeScript、打包优化等

### 什么是客户端渲染？

本项目使用的是**客户端渲染**（Client-Side Rendering），即所有页面组件都在浏览器中执行。

在 Next.js 中，使用 `'use client'` 指令标记客户端组件：

```tsx
'use client';

export default function HomePage() {
  // 可以使用 useState、useEffect 等 Hooks
  return <div>Hello</div>;
}
```

---

## Next.js App Router

### App Router 是什么？

Next.js 13+ 引入的新路由系统，基于 `app/` 目录。与传统的 Pages Router 相比，App Router 提供了：
- 嵌套布局
- 并行路由
- 服务端组件优先
- 更简洁的 API

### 路由映射规则

文件系统路径自动映射到 URL 路径：

```
src/app/
├── page.tsx           → /
├── layout.tsx         → 根布局（包裹所有页面）
├── boards/
│   ├── page.tsx       → /boards
│   └── [id]/          → 动态路由
│       └── page.tsx   → /boards/123
```

### 本项目中的路由

```tsx
// src/app/page.tsx → 登录/注册页面
export default function HomePage() { /* ... */ }

// src/app/boards/page.tsx → 看板列表页
export default function BoardsPage() { /* ... */ }

// src/app/boards/[id]/page.tsx → 单个看板详情页
export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string; // 获取 URL 参数
  // ...
}
```

### 根布局

`src/app/layout.tsx` 是应用的根布局，包裹所有页面：

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**关键点**：
- `children` 代表当前页面内容
- `ThemeProvider` 和 `AuthProvider` 包裹所有页面，提供全局状态
- `html` 和 `body` 标签只在这里出现一次

### 全局样式

`src/app/globals.css` 是全局样式文件，在 `layout.tsx` 中引入：

```tsx
import "./globals.css";
```

---

## React 基础

### 函数组件

现代 React 主要使用函数组件：

```tsx
// 定义组件
interface CardProps {
  title: string;
  content: string;
  onDelete: () => void;
}

function Card({ title, content, onDelete }: CardProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{title}</h3>
      <p>{content}</p>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}
```

**关键概念**：
- **Props**：父组件传递给子组件的数据
- **TypeScript 接口**：定义 Props 类型
- **JSX**：JavaScript 的语法扩展，允许在 JS 中写类似 HTML 的代码

### 常用 Hooks

#### useState：管理组件状态

```tsx
const [count, setCount] = useState(0);
const [title, setTitle] = useState('');
const [isOpen, setIsOpen] = useState(false);
```

**示例**：

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### useEffect：处理副作用

副作用包括：数据获取、订阅、DOM 操作等。

```tsx
useEffect(() => {
  // 组件挂载后执行
  fetchData();

  // 返回清理函数
  return () => {
    cleanup();
  };
}, [dependencies]); // 依赖数组
```

**本项目中的应用**：

```tsx
// src/app/boards/page.tsx
useEffect(() => {
  if (!authLoading && !user) {
    router.replace('/'); // 未登录跳转首页
    return;
  }
  if (user) {
    fetchBoards(); // 已登录获取数据
  }
}, [user, authLoading, router, fetchBoards]);
```

#### useCallback：缓存函数

避免子组件不必要的重新渲染：

```tsx
const handleDelete = useCallback(async (id: number) => {
  await api.delete(`/cards/${id}`);
  onUpdate();
}, [onUpdate]);
```

#### useContext：共享全局状态

```tsx
const { user, login, logout } = useAuth();
```

---

## 项目结构

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # 根布局
│   │   ├── page.tsx                # 登录/注册页 (/)
│   │   ├── globals.css             # 全局样式
│   │   └── boards/                 # 看板相关页面
│   │       ├── page.tsx            # 看板列表 (/boards)
│   │       └── [id]/               # 动态路由
│   │           └── page.tsx        # 看板详情 (/boards/:id)
│   │
│   ├── components/                 # React 组件
│   │   ├── ui/                     # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...                 # 其他 UI 组件
│   │   ├── providers/              # Context Providers
│   │   │   └── theme-provider.tsx  # 主题上下文
│   │   ├── Board.tsx               # 看板组件
│   │   ├── List.tsx                # 列表组件
│   │   ├── Card.tsx                # 卡片组件
│   │   ├── AddCardForm.tsx         # 添加卡片表单
│   │   ├── AddListForm.tsx         # 添加列表表单
│   │   ├── CardEditModal.tsx       # 卡片编辑弹窗
│   │   └── theme-toggle.tsx        # 主题切换按钮
│   │
│   └── lib/                        # 工具函数和配置
│       ├── api.ts                  # API 请求封装
│       ├── auth.tsx                # 认证上下文
│       └── types.ts                # TypeScript 类型定义
│
├── package.json                    # 依赖配置
├── next.config.ts                  # Next.js 配置
├── tsconfig.json                   # TypeScript 配置
└── tailwind.config.ts              # Tailwind CSS 配置
```

---

## 状态管理

### 本项目采用的状态管理策略

本应用没有使用 Redux/Zustand 等全局状态管理库，而是采用：

1. **Context API** 管理全局状态（认证、主题）
2. **本地 useState** 管理组件状态
3. **API 层**处理服务端状态

### Context API 实现示例

**认证上下文 (`src/lib/auth.tsx`)**

```tsx
// 1. 创建 Context
interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// 2. 创建 Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const stored = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.post<{ access_token: string }>('/auth/login', {
      username,
      password,
    });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify({ username }));
    setToken(data.access_token);
    setUser({ username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. 创建自定义 Hook
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// 4. 在组件中使用
function MyComponent() {
  const { user, login, logout } = useAuth();
  // ...
}
```

### 组件内状态管理

```tsx
function BoardsPage() {
  // 组件本地状态
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  // 修改状态的典型模式
  const createBoard = async (title: string) => {
    try {
      const board = await api.post<Board>('/boards', { title });
      setBoards((prev) => [...prev, board]); // 函数式更新
    } catch {
      setError('Failed to create board');
    }
  };
}
```

---

## 认证系统

### 认证流程

```
┌─────────┐      POST /auth/login      ┌─────────┐
│  前端   │ ──────────────────────────> │  后端   │
└─────────┘                              └─────────┘
     │                                        │
     │ <────────────────────────────────────── │
     │         { access_token: "xxx" }         │
     │                                        │
     ▼                                        │
  保存到 localStorage                        │
     │                                        │
     ▼                                        │
  更新 Context State                        │
     │                                        │
     ▼                                        │
  跳转到 /boards                            │
```

### 认证上下文详解

**初始化（从 localStorage 恢复）**

```tsx
useEffect(() => {
  const stored = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (stored && storedUser) {
    setToken(stored);
    setUser(JSON.parse(storedUser));
  }
  setIsLoading(false);
}, []);
```

**登录**

```tsx
const login = useCallback(async (username: string, password: string) => {
  const data = await api.post<{ access_token: string }>('/auth/login', {
    username,
    password,
  });
  const userData = { username };
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(userData));
  setToken(data.access_token);
  setUser(userData);
}, []);
```

**登出**

```tsx
const logout = useCallback(() => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setToken(null);
  setUser(null);
}, []);
```

### 路由保护

```tsx
// src/app/boards/page.tsx
const { user, isLoading: authLoading } = useAuth();

useEffect(() => {
  if (!authLoading && !user) {
    router.replace('/'); // 未登录重定向到登录页
    return;
  }
  if (user) {
    fetchBoards(); // 已登录获取数据
  }
}, [user, authLoading, router, fetchBoards]);
```

---

## API 层

### API 封装设计

**src/lib/api.ts** 提供统一的 HTTP 请求接口：

```tsx
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 自动注入 JWT Token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // 401 自动登出
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }

  // 204 No Content 处理（如 DELETE 请求）
  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
```

### 使用示例

```tsx
// GET 请求
const boards = await api.get<Board[]>('/boards');

// POST 请求
const board = await api.post<Board>('/boards', { title: 'New Board' });

// PATCH 请求
await api.patch(`/boards/${id}`, { title: 'Updated Title' });

// DELETE 请求
await api.delete(`/boards/${id}`);
```

---

## 拖拽实现

### @hello-pangea/dnd 库

这是 react-beautiful-dnd 的社区维护版本，兼容 React 19。

### 拖拽架构

```
DragDropContext (整个看板)
    │
    ├── Droppable (列表 1)
    │       │
    │       └── Draggable (卡片)
    │       └── Draggable (卡片)
    │
    ├── Droppable (列表 2)
    │       │
    │       └── Draggable (卡片)
    │       └── Draggable (卡片)
    │
    └── Droppable (列表 3)
            │
            └── Draggable (卡片)
```

### 实现详解

**Board 组件中的 DragDropContext**

```tsx
// src/components/Board.tsx
<DragDropContext onDragEnd={onDragEnd}>
  <div className="flex gap-4">
    {sortedLists.map((list) => (
      <ListComponent key={list.id} list={list} />
    ))}
  </div>
</DragDropContext>
```

**onDragEnd 处理函数**

```tsx
const onDragEnd = useCallback(
  async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // 无效拖拽
    if (!destination) return;

    // 原位置相同，无需处理
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // 解析 ID
    const sourceListId = Number(source.droppableId.replace('list-', ''));
    const destListId = Number(destination.droppableId.replace('list-', ''));
    const cardId = Number(draggableId.replace('card-', ''));

    // ===== 乐观更新（立即更新 UI）=====
    onBoardChange((prev) => {
      if (!prev) return prev;
      const newLists = prev.lists.map((list) => {
        // 同一列表内排序
        if (sourceListId === destListId && list.id === sourceListId) {
          const sorted = list.cards.slice().sort((a, b) => a.position - b.position);
          const [moved] = sorted.splice(source.index, 1);
          sorted.splice(destination.index, 0, moved);
          return {
            ...list,
            cards: sorted.map((c, i) => ({ ...c, position: i }))
          };
        }
        // 从源列表移除
        if (list.id === sourceListId) {
          return {
            ...list,
            cards: list.cards
              .filter((c) => c.id !== cardId)
              .sort((a, b) => a.position - b.position)
              .map((c, i) => ({ ...c, position: i })),
          };
        }
        // 添加到目标列表
        if (list.id === destListId) {
          const sourceList = prev.lists.find((l) => l.id === sourceListId);
          const movedCard = sourceList?.cards.find((c) => c.id === cardId);
          if (!movedCard) return list;
          const sorted = list.cards.slice().sort((a, b) => a.position - b.position);
          sorted.splice(destination.index, 0, { ...movedCard, listId: destListId });
          return {
            ...list,
            cards: sorted.map((c, i) => ({ ...c, position: i }))
          };
        }
        return list;
      });
      return { ...prev, lists: newLists };
    });

    // ===== 持久化到服务器 =====
    try {
      await api.put(`/cards/${cardId}/move`, {
        listId: destListId,
        position: destination.index,
      });
    } catch {
      // 失败时重新获取数据
      onUpdate();
    }
  },
  [onBoardChange, onUpdate]
);
```

**List 组件中的 Droppable**

```tsx
// src/components/List.tsx
<Droppable droppableId={`list-${list.id}`}>
  {(provided) => (
    <CardContent
      ref={provided.innerRef}
      {...provided.droppableProps}
      className="p-3 flex flex-col gap-2"
    >
      {list.cards
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((card, index) => (
          <CardComponent
            key={card.id}
            card={card}
            index={index}
          />
        ))}
      {provided.placeholder}
    </CardContent>
  )}
</Droppable>
```

**Card 组件中的 Draggable**

```tsx
// src/components/Card.tsx
<Draggable draggableId={`card-${card.id}`} index={index}>
  {(provided, snapshot) => {
    const child = (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={provided.draggableProps.style}
        className={snapshot.isDragging ? 'dragging' : 'normal'}
      >
        {card.title}
      </div>
    );

    // 拖拽时使用 Portal 渲染到 body
    if (snapshot.isDragging) {
      return createPortal(child, document.body);
    }

    return child;
  }}
</Draggable>
```

### 乐观更新模式

乐观更新是一种 UI 模式：先更新界面，再发送请求。

```
用户拖拽 → 立即更新 UI → 后台发送请求
              │                    │
              │                    ├─ 成功：保持
              │                    └─ 失败：回滚
```

**优点**：用户感觉操作即时响应，无需等待网络。

---

## 样式系统

### Tailwind CSS 4

Tailwind 是一个原子化 CSS 框架，提供预定义的工具类。

**基础概念**：

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  Hello
</div>
```

- `flex`：display: flex
- `items-center`：align-items: center
- `justify-between`：justify-content: space-between
- `p-4`：padding: 1rem
- `bg-white`：background-color: white
- `rounded-lg`：border-radius: 0.5rem
- `shadow`：box-shadow

### Tailwind CSS 4 新特性

**使用 @import 替代传统配置**：

```css
/* src/app/globals.css */
@import "tailwindcss";
```

**@theme 指令定义主题**：

```css
@theme inline {
  --color-primary: oklch(0.5 0.2 250);
  --radius: 0.625rem;
}
```

### 主题系统（亮色/暗色）

**CSS 变量定义**：

```css
:root {
  --background: oklch(1 0 0);           /* 亮色背景 */
  --foreground: oklch(0.15 0.01 250);   /* 亮色文字 */
}

.dark {
  --background: oklch(0.12 0 0);        /* 暗色背景 */
  --foreground: oklch(0.95 0 0);        /* 暗色文字 */
}
```

**ThemeProvider 实现**：

```tsx
// src/components/providers/theme-provider.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 响应式设计

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* 1列 → 2列 → 3列 → 4列 */}
</div>
```

断点：
- `sm:`: 640px+
- `md:`: 768px+
- `lg:`: 1024px+
- `xl:`: 1280px+

---

## 组件库

### shadcn/ui 是什么？

shadcn/ui 不是一个 npm 包，而是一组可复制粘贴的组件。组件代码直接添加到你的项目中，完全可控。

### 安装方式

```bash
npx shadcn@latest add button
```

这会将 `button.tsx` 添加到 `src/components/ui/` 目录。

### 本项目使用的组件

| 组件 | 文件 | 用途 |
|------|------|------|
| Button | `button.tsx` | 按钮 |
| Card | `card.tsx` | 卡片容器 |
| Input | `input.tsx` | 输入框 |
| Textarea | `textarea.tsx` | 多行文本输入 |
| Dialog | `dialog.tsx` | 弹窗 |
| AlertDialog | `alert-dialog.tsx` | 确认对话框 |
| Alert | `alert.tsx` | 提示信息 |
| Separator | `separator.tsx` | 分隔线 |
| ScrollArea | `scroll-area.tsx` | 滚动区域 |
| Skeleton | `skeleton.tsx` | 加载骨架屏 |
| Empty | `empty.tsx` | 空状态 |

### 组件使用示例

**Button**

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Close</Button>
```

**Card**

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Board Title</CardTitle>
    <CardDescription>Created on Jan 1, 2026</CardDescription>
  </CardHeader>
  <CardContent>Card content</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

**Dialog**

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Card</DialogTitle>
    </DialogHeader>
    <form>...</form>
    <DialogFooter>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### CVA（Class Variance Authority）

shadcn/ui 使用 CVA 管理组件变体：

```tsx
// button.tsx 简化示例
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

## 关键代码对照

### 登录页面 (src/app/page.tsx)

```tsx
'use client'; // 标记为客户端组件

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, isLoading, login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);

  // 已登录自动跳转
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/boards');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      router.push('/boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit}>...</form>
    </div>
  );
}
```

### 看板列表页 (src/app/boards/page.tsx)

```tsx
export default function BoardsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);

  const fetchBoards = useCallback(async () => {
    const data = await api.get<Board[]>('/boards');
    setBoards(data);
  }, []);

  useEffect(() => {
    if (user) {
      fetchBoards();
    }
  }, [user, fetchBoards]);

  async function createBoard(title: string) {
    const board = await api.post<Board>('/boards', { title });
    setBoards((prev) => [...prev, board]);
  }

  async function deleteBoard(id: number) {
    await api.delete(`/boards/${id}`);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen">
      <header>
        <h1>My Boards</h1>
        <Button onClick={logout}>Logout</Button>
      </header>
      <main>
        {boards.map((board) => (
          <Card key={board.id}>
            <h3>{board.title}</h3>
            <Button onClick={() => router.push(`/boards/${board.id}`)}>
              Open
            </Button>
          </Card>
        ))}
      </main>
    </div>
  );
}
```

---

## 总结

### 项目技术栈总结

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.1 | 全栈框架 |
| React | 19.2.4 | UI 库 |
| TypeScript | 5.x | 类型系统 |
| Tailwind CSS | 4 | 样式框架 |
| shadcn/ui | 最新 | UI 组件库 |
| @hello-pangea/dnd | 18.0.1 | 拖拽功能 |
| @base-ui/react | 1.3.0 | 无样式基础组件 |

### 架构模式

1. **客户端渲染**：所有组件标记 `'use client'`
2. **Context API**：管理认证和主题状态
3. **乐观更新**：拖拽时立即更新 UI，失败回滚
4. **类型安全**：全 TypeScript，定义清晰的接口
5. **组件化**：高度模块化的组件设计

### 推荐学习路径

1. **React 基础**：组件、Props、State、Hooks
2. **Next.js App Router**：路由、布局、导航
3. **Tailwind CSS**：工具类、响应式、主题
4. **TypeScript**：类型、接口、泛型
5. **shadcn/ui**：组件使用和定制

### 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
