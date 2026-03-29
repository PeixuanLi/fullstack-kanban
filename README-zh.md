# 全栈看板应用

一个**面向 TypeScript 开发者的全栈学习项目** — 通过拖拽看板这个完整案例，覆盖从 UI 组件、后端 API、数据库建模到容器化部署的全链路开发。使用与生产环境一致的现代技术栈，学到的模式可直接用于真实项目。

[English](./README.md)

## 你将学到什么

本项目旨在帮助 TypeScript 开发者理解全栈应用的各个环节如何协作：

| 阶段 | 学习主题 |
|------|---------|
| **前端 + UI** | Next.js 16 App Router、React 19 组件与 Hooks、Tailwind CSS 4 原子化样式、shadcn/ui 组件体系、拖拽交互（`@hello-pangea/dnd`） |
| **后端 + API** | NestJS 11 模块化架构、RESTful API 设计、Passport JWT 认证、请求验证管道、Jest 单元测试 |
| **数据库 + ORM** | PostgreSQL 16 关系建模、Prisma 7 Schema 与迁移、级联删除、唯一约束、客户端生成 |
| **DevOps / 部署** | Docker 多阶段构建、Docker Compose 多服务编排、环境变量管理、CORS 跨域配置 |

## 技术栈

| 层级 | 技术 | 选型理由 |
|------|------|---------|
| 前端框架 | Next.js 16 (App Router) | 学习基于文件的路由、布局系统和最新 Next.js 模式 |
| UI 库 | React 19 | 掌握组件组合、Hooks、Context 和客户端渲染 |
| 样式方案 | Tailwind CSS 4 | 原子化 CSS — 无需离开 HTML 即可快速编写样式 |
| 组件库 | shadcn/ui | 理解如何构建和使用可组合的组件系统 |
| 后端框架 | NestJS 11 | 学习装饰器、模块、依赖注入和结构化 API 设计 |
| 数据库 | PostgreSQL 16 | 生产级关系型数据库 — Schema 设计、约束、索引 |
| ORM | Prisma 7 | 类型安全的数据库访问、迁移和自动生成类型 |
| 认证 | Passport.js + JWT | 工业标准 Token 认证，配合 bcrypt 密码哈希 |
| 拖拽 | @hello-pangea/dnd | 跨列表的复杂状态更新与交互式 UI |
| 部署 | Docker Compose | 一条命令启动前端、后端和数据库 |

## 架构总览

```
浏览器 (React)
  │  HTTP + JWT
  ▼
Next.js 16 ──── CORS ──── NestJS 11
                               │
                          Prisma ORM
                               │
                          PostgreSQL 16
```

前端完全运行在客户端（`'use client'`）。所有 API 调用通过 `lib/api.ts` 统一处理，自动注入 JWT Token。后端通过 Passport 的 JWT 策略在每条受保护路由上验证 Token。

## 功能特性

- **用户认证** — 注册、登录、JWT 会话管理（有效期 7 天），401 自动登出
- **看板管理** — 创建、重命名、删除看板；用户只能查看自己的看板
- **列表管理** — 在看板中添加、重命名、删除列表；支持拖拽排序
- **卡片管理** — 创建、编辑（标题 + 描述）、删除卡片；支持列表内和跨列表拖拽
- **响应式界面** — Tailwind CSS + shadcn/ui 组件库，适配多种屏幕尺寸

## 项目结构

```
fullstack-kanban/
├── backend/                  # NestJS API 服务
│   ├── src/
│   │   ├── auth/            # 注册、登录、JWT 策略、bcrypt 加密
│   │   ├── boards/          # 看板增删改查 + 所有权限检查
│   │   ├── lists/           # 列表增删改查 + 基于位置的排序
│   │   ├── cards/           # 卡片增删改查 + 跨列表移动逻辑
│   │   └── prisma/          # PrismaService 单例
│   └── prisma/
│       └── schema.prisma    # 数据库模型与关系定义
├── frontend/                 # Next.js 客户端应用
│   └── src/
│       ├── app/             # 路由：登录、看板列表、看板详情
│       ├── components/      # 组件：看板、列表、卡片、弹窗、表单、UI 基础组件
│       └── lib/             # API 客户端、认证上下文、TypeScript 类型
└── docker-compose.yml       # PostgreSQL + 后端 + 前端
```

## 全栈学习路径

### 前端 — Next.js + React + Tailwind + shadcn/ui

前端使用 **Next.js 16 App Router** 实现基于文件的路由，**React 19** 进行组件渲染。所有页面组件均为客户端渲染（`'use client'`），降低学习时的心智负担。

建议重点阅读的文件：

| 文件 | 学习要点 |
|------|---------|
| `frontend/src/app/layout.tsx` | 根布局，Provider 包裹（`AuthProvider`） |
| `frontend/src/app/page.tsx` | 登录/注册页，表单处理，API 集成 |
| `frontend/src/app/boards/page.tsx` | 看板列表，认证状态下的数据获取 |
| `frontend/src/app/boards/[boardId]/page.tsx` | 动态路由，看板详情与拖拽功能 |
| `frontend/src/lib/auth.tsx` | React Context + `useAuth()` Hook，Token 持久化 |
| `frontend/src/lib/api.ts` | 类型化 HTTP 客户端，自动 JWT 注入，401 处理 |
| `frontend/src/components/Board.tsx` | 拖拽上下文，列表排序 |
| `frontend/src/components/Card.tsx` | 可拖拽卡片，跨列表移动 |
| `frontend/src/components/ui/` | shadcn/ui 基础组件（Button、Input、Dialog…） |

### 后端 — NestJS + Passport JWT

后端遵循 NestJS 的**模块化架构**：每个领域（auth、boards、lists、cards）都是独立的模块，拥有自己的 Controller、Service 和 DTO。

建议重点阅读的文件：

| 文件 | 学习要点 |
|------|---------|
| `backend/src/main.ts` | 应用引导，全局 `ValidationPipe`，CORS 配置 |
| `backend/src/app.module.ts` | 模块组合，依赖注入 |
| `backend/src/auth/` | 注册/登录流程，bcrypt 哈希，JWT 策略，守卫 |
| `backend/src/boards/` | CRUD 控制器，class-validator DTO，所有权限检查 |
| `backend/src/lists/` | 基于位置的排序，重排算法 |
| `backend/src/cards/` | 跨列表卡片移动，位置重算 |
| `backend/src/prisma/` | PrismaService 单例模式 |

### 数据库 — PostgreSQL + Prisma ORM

```
User  1──*  Board  1──*  List  1──*  Card
```

Schema 展示了关系建模的核心概念：
- **外键与级联删除** — 删除看板时自动移除其下所有列表和卡片
- **唯一约束** — `@@unique([boardId, position])` 确保同一看板内列表位置不重复
- **可选字段** — Card 的 `content?` 允许仅含标题的卡片
- **Prisma 7** — `prisma-client` provider，通过 `npx prisma migrate dev` 执行迁移，类型安全的查询

重点文件：`backend/prisma/schema.prisma`

### 部署 — Docker Compose

一条 `docker compose up --build` 即可启动全部三个服务：

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| `postgres` | PostgreSQL 16 | 5433（宿主机） | 通过 Docker Volume 持久化数据 |
| `backend` | Node.js（多阶段构建） | 3001 | 启动时自动运行 Prisma 迁移 |
| `frontend` | Node.js | 3000 | 通过 `NEXT_PUBLIC_API_URL` 代理到后端 |

重点文件：`docker-compose.yml` 和 `backend/Dockerfile`

## API 接口

除认证接口外，所有接口均需在请求头中携带 `Authorization: Bearer <token>`。

| 方法 | 接口路径 | 说明 |
|------|---------|------|
| POST | `/auth/register` | 注册新用户 |
| POST | `/auth/login` | 登录，返回 JWT |
| GET | `/boards` | 获取当前用户的看板列表 |
| POST | `/boards` | 创建看板 |
| GET | `/boards/:id` | 获取看板详情（含列表和卡片） |
| PATCH | `/boards/:id` | 重命名看板 |
| DELETE | `/boards/:id` | 删除看板 |
| POST | `/boards/:boardId/lists` | 添加列表 |
| PATCH | `/lists/:id` | 重命名列表 |
| DELETE | `/lists/:id` | 删除列表 |
| PUT | `/boards/:boardId/lists/reorder` | 列表排序 |
| POST | `/lists/:listId/cards` | 添加卡片 |
| PATCH | `/cards/:id` | 编辑卡片 |
| DELETE | `/cards/:id` | 删除卡片 |
| PUT | `/cards/:id/move` | 移动卡片（跨列表 / 调整位置） |

## 快速开始

### 前置条件

- Docker 及 Docker Compose

### 使用 Docker Compose 启动

```bash
docker compose up --build
```

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001
- PostgreSQL：localhost:5433

### 本地开发

**1. 启动 PostgreSQL**

```bash
docker compose up postgres
```

**2. 启动后端**

```bash
cd backend
cp .env.example .env        # 按需修改 DATABASE_URL
npm install
npx prisma migrate dev
npm run start:dev
```

**3. 启动前端**

```bash
cd frontend
npm install
npm run dev
```

## 环境变量

### 后端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/kanban` | Prisma 数据库连接字符串 |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT 签名密钥（生产环境务必修改） |
| `PORT` | `3001` | API 服务端口 |
| `CORS_ORIGIN` | `http://localhost:3000` | 允许的跨域来源 |

### 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | 后端 API 地址 |

## 深入学习文档

每个技术层的详细解析：

| 文档 | 说明 |
|------|------|
| [Next.js/React 前端工程方案详解](./docs/nextjs-guide.md) | App Router、React 基础、前端架构及实现模式详解 |
| [shadcn/ui 使用说明](./docs/shadcn-guide.md) | shadcn/ui 组件库的配置和使用方法 |
| [NestJS 工程方案详解](./docs/nestjs-guide.md) | NestJS 后端架构、模块、认证及关键实现模式 |
| [PostgreSQL 工程方案详解](./docs/postgresql-guide.md) | PostgreSQL + Prisma ORM 的使用详解 |
| [Docker 工程方案详解](./docs/docker-guide.md) | Docker 和 Docker Compose 的逐行配置解析 |
| [卡片拖动调用栈分析](./docs/card-drag-call-stack.md) | 卡片拖拽功能的完整前后端调用链分析 |

## 开源协议

[MIT](./LICENSE)
