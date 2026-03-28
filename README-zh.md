# 全栈看板应用

基于 NestJS 和 Next.js 构建的现代化看板应用，支持拖拽排序。

[English](./README.md)

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui |
| 后端 | NestJS 11 + TypeScript |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 认证 | Passport.js + JWT |
| 拖拽 | @hello-pangea/dnd |
| 部署 | Docker Compose |

## 功能特性

- **用户认证** — 注册、登录、JWT 会话管理（有效期 7 天）
- **看板管理** — 创建、重命名、删除看板；用户只能查看自己的看板
- **列表管理** — 在看板中添加、重命名、删除列表；支持拖拽排序
- **卡片管理** — 创建、编辑（标题 + 描述）、删除卡片；支持列表内和跨列表拖拽
- **响应式界面** — Tailwind CSS + shadcn/ui 组件库，适配多种屏幕尺寸

## 项目结构

```
fullstack-kanban/
├── backend/                  # NestJS 后端 API
│   ├── src/
│   │   ├── auth/            # 注册、登录、JWT 策略
│   │   ├── boards/          # 看板增删改查
│   │   ├── lists/           # 列表增删改查 + 排序
│   │   ├── cards/           # 卡片增删改查 + 移动
│   │   └── prisma/          # Prisma 数据库服务
│   └── prisma/
│       └── schema.prisma    # 数据库模型定义
├── frontend/                 # Next.js 前端应用
│   └── src/
│       ├── app/             # 页面（登录、看板列表、看板详情）
│       ├── components/      # 组件（看板、列表、卡片、弹窗、表单）
│       └── lib/             # API 客户端、认证上下文、类型定义
└── docker-compose.yml       # PostgreSQL + 后端 + 前端
```

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
- PostgreSQL：localhost:5432

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
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/kanban` | Prisma 数据库连接字符串 |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT 签名密钥（生产环境务必修改） |
| `PORT` | `3001` | API 服务端口 |
| `CORS_ORIGIN` | `http://localhost:3000` | 允许的跨域来源 |

### 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | 后端 API 地址 |

## 数据库模型

```
User  1──*  Board  1──*  List  1──*  Card
```

- **User（用户）**：id, username, password（bcrypt 加密）
- **Board（看板）**：id, title, userId
- **List（列表）**：id, title, position, boardId（唯一约束：boardId + position）
- **Card（卡片）**：id, title, content?, position, listId（唯一约束：listId + position）

删除时级联：Board → List → Card。

## 文档

| 文档 | 说明 |
|------|------|
| [Docker 工程方案详解](./docs/docker-guide.md) | Docker 和 Docker Compose 的逐行配置解析 |
| [PostgreSQL 工程方案详解](./docs/postgresql-guide.md) | PostgreSQL + Prisma ORM 的使用详解 |
| [卡片拖动调用栈分析](./docs/card-drag-call-stack.md) | 卡片拖拽功能的完整前后端调用链分析 |
| [shadcn/ui 使用说明](./docs/shadcn-guide.md) | shadcn/ui 组件库的配置和使用方法 |

## 开源协议

[MIT](./LICENSE)
