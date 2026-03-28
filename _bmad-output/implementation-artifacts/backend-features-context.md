---
title: '后端开发上下文 — backend-features 分支'
type: 'feature'
created: '2026-03-28'
branch: backend-features
base: main
---

# 后端开发上下文

## 启动命令

```bash
cd /Users/lipeixuan/code/002_AiAgent/fullstack-kanban
git worktree add .claude/worktrees/backend-features backend-features 2>/dev/null || git checkout -b backend-features
```

然后在 Claude Code 中执行：

```
请基于后端开发规范，在 backend/ 目录下实现以下所有模块：
1. Auth 模块（注册/登录/JWT）
2. Boards 模块（CRUD）
3. Lists 模块（CRUD + 排序）
4. Cards 模块（CRUD + 跨列表拖拽）
5. E2E 测试和单元测试
```

---

## 技术栈

- NestJS + TypeScript
- Prisma ORM（PostgreSQL）
- Passport + JWT 认证
- class-validator / class-transformer

## 已完成的基础设施

- `backend/` 项目骨架已建好，依赖已安装
- `backend/prisma/schema.prisma` — 数据模型已定义：

```
User: id, username(unique), password, boards[]
Board: id, title, userId, lists[]
List: id, title, position, boardId, cards[]  (boardId+position unique)
Card: id, title, content?, position, listId   (listId+position unique)
```

- `backend/src/prisma/prisma.service.ts` — 全局 PrismaService 已实现
- `backend/src/prisma/prisma.module.ts` — @Global 模块，自动注入
- `backend/src/app.module.ts` — 已导入 ConfigModule + PrismaModule
- `backend/src/main.ts` — 端口 3001，全局 ValidationPipe，CORS 已配置
- `backend/.env` — DATABASE_URL, JWT_SECRET, CORS_ORIGIN, PORT 已配置

## 需要实现的模块

### 1. Auth 模块 (`backend/src/auth/`)

**文件清单：**
- `auth.module.ts` — 导入 JwtModule, PassportModule, 注册 controller/service
- `auth.controller.ts` — POST /auth/register, POST /auth/login
- `auth.service.ts` — bcrypt 加密密码，验证密码，JWT 签发
- `auth/jwt.strategy.ts` — Passport JWT 策略，从 token 提取 userId
- `auth/jwt-auth.guard.ts` — 可选，自定义 Guard
- `auth/dto/register.dto.ts` — { username: string, password: string } + class-validator
- `auth/dto/login.dto.ts` — 同上

**API 端点：**
- `POST /auth/register` → 创建用户，返回 { access_token }
- `POST /auth/login` → 验证凭据，返回 { access_token }

**关键逻辑：**
- 密码用 bcrypt hash，salt rounds = 10
- JWT payload: { sub: user.id, username: user.username }
- JWT 过期时间: 7d

### 2. Boards 模块 (`backend/src/boards/`)

**文件清单：**
- `boards.module.ts`
- `boards.controller.ts`
- `boards.service.ts`
- `boards/dto/create-board.dto.ts` — { title: string }
- `boards/dto/update-board.dto.ts` — { title?: string }

**API 端点（需 JWT Guard）：**
- `GET /boards` → 返回当前用户的所有看板（含 lists 和 cards）
- `POST /boards` → 创建看板
- `GET /boards/:id` → 返回单个看板详情（含 lists + cards）
- `PATCH /boards/:id` → 更新看板标题
- `DELETE /boards/:id` → 删除看板（级联删除 lists 和 cards）

### 3. Lists 模块 (`backend/src/lists/`)

**文件清单：**
- `lists.module.ts`
- `lists.controller.ts`
- `lists.service.ts`
- `lists/dto/create-list.dto.ts` — { title: string }
- `lists/dto/reorder-list.dto.ts` — { listId: number, position: number }[]

**API 端点（需 JWT Guard）：**
- `POST /boards/:boardId/lists` → 在看板末尾添加列表
- `PATCH /lists/:id` → 更新列表标题
- `DELETE /lists/:id` → 删除列表（级联删除 cards）
- `PUT /boards/:boardId/lists/reorder` → 批量重排序列表

**排序逻辑：**
- 创建时 position = 当前看板最大 position + 1
- reorder 时更新所有涉及的 list 的 position，确保 boardId+position 唯一约束

### 4. Cards 模块 (`backend/src/cards/`)

**文件清单：**
- `cards.module.ts`
- `cards.controller.ts`
- `cards.service.ts`
- `cards/dto/create-card.dto.ts` — { title: string, content?: string }
- `cards/dto/update-card.dto.ts` — { title?: string, content?: string }
- `cards/dto/move-card.dto.ts` — { listId: number, position: number }

**API 端点（需 JWT Guard）：**
- `POST /lists/:listId/cards` → 在列表末尾添加卡片
- `PATCH /cards/:id` → 更新卡片标题/内容
- `DELETE /cards/:id` → 删除卡片
- `PUT /cards/:id/move` → 移动卡片到目标列表的指定位置

**移动逻辑（核心）：**
1. 获取卡片当前 listId 和 position
2. 如果同列表移动：调整同列表中其他卡片的 position
3. 如果跨列表移动：原列表中高于旧 position 的卡片 position-1，新列表中高于等于新 position 的卡片 position+1
4. 更新卡片的 listId 和 position
5. 使用 Prisma 事务保证原子性

### 5. 测试

**E2E 测试 (`backend/test/app.e2e-spec.ts`)：**
- 完整覆盖：注册 → 登录 → 创建看板 → 创建列表 → 创建卡片 → 拖拽卡片 → 删除
- 使用测试数据库（.env.test）

**单元测试：**
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/boards/boards.service.spec.ts`
- `backend/src/lists/lists.service.spec.ts`
- `backend/src/cards/cards.service.spec.ts`

## 注意事项

- 所有业务端点必须使用 `@UseGuards(AuthGuard('jwt'))`
- 从 `req.user` 获取当前用户信息
- PrismaService 已全局注入，直接在 constructor 中注入即可
- 导入 Prisma 类型：`import { PrismaService } from '../generated/prisma'` — 注意 Prisma 生成的客户端路径是 `../generated/prisma`
- 所有 DTO 必须使用 class-validator 装饰器
