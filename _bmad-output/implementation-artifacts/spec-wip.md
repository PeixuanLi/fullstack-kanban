---
title: 'Fullstack Kanban Application'
type: 'feature'
created: '2026-03-28'
status: 'draft'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 需要一套完整的看板任务管理应用，用于可视化管理工作流程。当前没有任何代码基础。

**Approach:** 构建一个单用户看板应用，包含 Next.js (App Router) 前端、NestJS 后端 REST API、PostgreSQL 数据库，全部通过 Docker Compose 编排部署。支持看板/列表/卡片的 CRUD 和拖拽排序，以及简单的用户注册/登录认证。

## Boundaries & Constraints

**Always:**
- 前端使用 Next.js App Router + TypeScript
- 后端使用 NestJS + TypeScript
- 数据库使用 PostgreSQL，通过 Docker 部署
- 全部服务通过 docker-compose 编排
- REST API 通信，JSON 格式
- 拖拽使用 @hello-pangea/dnd 或 dnd-kit 库
- 认证使用 JWT token
- 代码必须有单元测试和集成测试

**Ask First:**
- 更换任何核心依赖库（UI 框架、拖拽库、ORM）
- 修改数据库 schema 设计
- 添加额外功能模块

**Never:**
- 不实现多用户/多租户功能
- 不实现邮箱验证、OAuth 等复杂认证
- 不使用 GraphQL
- 不使用 Pages Router
- 不使用 Prisma 之外的 ORM（使用 Prisma）

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 用户注册 | 用户名 + 密码 | 创建账户，返回 JWT token | 用户名已存在返回 409 |
| 用户登录 | 用户名 + 密码 | 返回 JWT token | 凭据错误返回 401 |
| 未认证访问 | 无 token 或过期 token | 返回 401 | 重定向到登录页 |
| 创建看板 | 看板名称 | 创建看板并返回数据 | 未认证返回 401 |
| 创建列表 | 列表名称 + 看板 ID | 在看板末尾添加列表 | 看板不存在返回 404 |
| 创建卡片 | 卡片标题 + 列表 ID | 在列表末尾添加卡片 | 列表不存在返回 404 |
| 拖拽卡片（同列表） | 卡片 ID + 新位置 | 更新卡片排序 | 位置越界自动修正 |
| 拖拽卡片（跨列表） | 卡片 ID + 目标列表 + 新位置 | 移动卡片并更新排序 | 源/目标列表不存在返回 404 |
| 删除列表 | 列表 ID | 删除列表及其所有卡片 | 级联删除 |

</frozen-after-approval>

## Code Map

**后端 (backend/):**
- `backend/src/main.ts` -- NestJS 入口，启动 HTTP 服务
- `backend/src/app.module.ts` -- 根模块，导入各功能模块
- `backend/src/prisma/prisma.module.ts` -- Prisma 客户端全局模块
- `backend/src/prisma/prisma.service.ts` -- Prcla 数据库连接服务
- `backend/src/auth/auth.module.ts` -- 认证模块
- `backend/src/auth/auth.controller.ts` -- 注册/登录端点
- `backend/src/auth/auth.service.ts` -- JWT 签发与验证逻辑
- `backend/src/auth/jwt.strategy.ts` -- Passport JWT 策略
- `backend/src/auth/dto/register.dto.ts` -- 注册 DTO
- `backend/src/auth/dto/login.dto.ts` -- 登录 DTO
- `backend/src/boards/boards.module.ts` -- 看板模块
- `backend/src/boards/boards.controller.ts` -- 看板 CRUD 端点
- `backend/src/boards/boards.service.ts` -- 看板业务逻辑
- `backend/src/lists/lists.module.ts` -- 列表模块
- `backend/src/lists/lists.controller.ts` -- 列表 CRUD + 排序端点
- `backend/src/lists/lists.service.ts` -- 列表业务逻辑
- `backend/src/cards/cards.module.ts` -- 卡片模块
- `backend/src/cards/cards.controller.ts` -- 卡片 CRUD + 拖拽端点
- `backend/src/cards/cards.service.ts` -- 卡片业务逻辑
- `backend/prisma/schema.prisma` -- Prisma 数据模型定义
- `backend/prisma/seed.ts` -- 数据库种子数据
- `backend/test/app.e2e-spec.ts` -- 后端 E2E 测试

**前端 (frontend/):**
- `frontend/src/app/layout.tsx` -- 根布局
- `frontend/src/app/page.tsx` -- 首页/登录注册页
- `frontend/src/app/boards/page.tsx` -- 看板列表页
- `frontend/src/app/boards/[id]/page.tsx` -- 看板详情页（核心拖拽界面）
- `frontend/src/lib/api.ts` -- API 客户端封装
- `frontend/src/lib/auth.ts` -- 认证状态管理
- `frontend/src/components/Board.tsx` -- 看板组件
- `frontend/src/components/List.tsx` -- 列表组件
- `frontend/src/components/Card.tsx` -- 卡片组件
- `frontend/src/components/LoginForm.tsx` -- 登录表单
- `frontend/src/components/RegisterForm.tsx` -- 注册表单

**基础设施:**
- `docker-compose.yml` -- 编排 PostgreSQL + NestJS + Next.js
- `backend/Dockerfile` -- 后端容器构建
- `frontend/Dockerfile` -- 前端容器构建

## Tasks & Acceptance

**Execution:**

**Phase 1: 基础设施**
- [ ] `docker-compose.yml` -- 创建编排文件，定义 postgres、backend、frontend 三个服务 -- 统一开发环境
- [ ] `backend/Dockerfile` -- 创建后端多阶段构建 Dockerfile -- 容器化后端
- [ ] `frontend/Dockerfile` -- 创建前端多阶段构建 Dockerfile -- 容器化前端

**Phase 2: 后端基础**
- [ ] `backend/` -- 初始化 NestJS 项目，安装依赖（@nestjs/jwt, @nestjs/passport, passport-jwt, @prisma/client, class-validator, class-transformer） -- 建立后端骨架
- [ ] `backend/prisma/schema.prisma` -- 定义 User、Board、List、Card 数据模型及关系 -- 数据库设计
- [ ] `backend/src/prisma/prisma.service.ts` -- 实现 PrclaService 处理数据库连接 -- 数据库访问层
- [ ] `backend/prisma/seed.ts` -- 创建种子数据脚本 -- 开发测试数据

**Phase 3: 后端认证**
- [ ] `backend/src/auth/` -- 实现注册/登录 API，bcrypt 加密密码，JWT 签发 -- 用户认证
- [ ] `backend/src/auth/jwt.strategy.ts` -- 实现 Passport JWT 策略和 AuthGuard -- API 鉴权

**Phase 4: 后端业务 API**
- [ ] `backend/src/boards/` -- 实现看板 CRUD (GET /boards, POST /boards, GET /boards/:id, PATCH /boards/:id, DELETE /boards/:id) -- 看板管理
- [ ] `backend/src/lists/` -- 实现列表 CRUD + 重排序 (POST /boards/:boardId/lists, PATCH /lists/:id, DELETE /lists/:id, PUT /lists/reorder) -- 列表管理
- [ ] `backend/src/cards/` -- 实现卡片 CRUD + 跨列表拖拽 (POST /lists/:listId/cards, PATCH /cards/:id, DELETE /cards/:id, PUT /cards/move) -- 卡片管理

**Phase 5: 前端基础**
- [ ] `frontend/` -- 初始化 Next.js App Router 项目，安装依赖（@hello-pangea/dnd, tailwindcss） -- 建立前端骨架
- [ ] `frontend/src/lib/api.ts` -- 封装 fetch API 客户端，统一处理 JWT token 和错误 -- API 通信层
- [ ] `frontend/src/lib/auth.ts` -- 实现认证状态管理（localStorage + React Context） -- 前端认证

**Phase 6: 前端页面与组件**
- [ ] `frontend/src/app/page.tsx` -- 实现登录/注册页面 -- 用户入口
- [ ] `frontend/src/app/boards/page.tsx` -- 实现看板列表页，展示用户所有看板 -- 看板导航
- [ ] `frontend/src/app/boards/[id]/page.tsx` + 组件 -- 实现看板详情页，包含列表展示、卡片拖拽、新增/编辑/删除操作 -- 核心交互

**Phase 7: 测试**
- [ ] `backend/test/` -- 编写后端 E2E 测试覆盖所有 API 端点 -- 后端质量保证
- [ ] `backend/src/**/*.spec.ts` -- 编写后端单元测试 -- 服务层逻辑验证
- [ ] `frontend/src/**/*.test.tsx` -- 编写前端组件测试 -- UI 交互验证

**Acceptance Criteria:**
- Given 用户填写用户名和密码, when 点击注册, then 创建账户并跳转到看板页面
- Given 用户已注册, when 使用正确凭据登录, then 获取 JWT token 并进入看板页面
- Given 用户已登录, when 创建新看板, then 看板出现在看板列表中
- Given 看板已创建, when 添加列表和卡片, then 卡片正确显示在对应列表中
- Given 卡片存在于列表 A, when 拖拽卡片到列表 B, then 卡片移动到列表 B 并保持正确排序
- Given Docker 环境, when 执行 docker-compose up, then 三个服务全部启动并可正常访问
- Given 所有服务运行中, when 执行后端测试命令, then 所有测试通过

## Spec Change Log

## Verification

**Commands:**
- `cd backend && npm run test` -- expected: 所有单元测试通过
- `cd backend && npm run test:e2e` -- expected: 所有 E2E 测试通过
- `docker-compose up --build` -- expected: 三个服务启动成功，前端可访问 http://localhost:3000，后端 API 可访问 http://localhost:3001
- `cd backend && npx prisma migrate status` -- expected: 数据库迁移状态正常
