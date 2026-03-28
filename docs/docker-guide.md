# Docker 工程方案详解

本文档面向没有 Docker 经验的读者，结合本项目的实际代码，逐行解释 Docker 的使用方式和背后的设计思路。

---

## 目录

1. [Docker 是什么 & 为什么用它](#1-docker-是什么--为什么用它)
2. [项目整体架构](#2-项目整体架构)
3. [docker-compose.yml 逐段解析](#3-docker-composeyml-逐段解析)
4. [Backend Dockerfile 逐行解析](#4-backend-dockerfile-逐行解析)
5. [Frontend Dockerfile 逐行解析](#5-frontend-dockerfile-逐行解析)
6. [本地开发 vs 容器化的环境差异](#6-本地开发-vs-容器化的环境差异)
7. [常用命令速查](#7-常用命令速查)

---

## 1. Docker 是什么 & 为什么用它

### 核心概念

| 概念 | 类比 | 说明 |
|------|------|------|
| **镜像 (Image)** | 安装光盘 | 一个只读的模板，包含了运行应用所需的所有文件（代码、运行时、系统工具）。镜像本身不会运行，只是"蓝图"。 |
| **容器 (Container)** | 运行中的虚拟机（但更轻量） | 从镜像启动的一个运行实例。每个容器是隔离的，有自己的文件系统、网络。启动只需毫秒级。 |
| **Dockerfile** | 安装光盘的制作脚本 | 一系列指令，告诉 Docker 如何一步步构建出一个镜像。 |
| **docker-compose.yml** | 一键启动多台电脑的遥控器 | 编排多个容器的配置文件——定义谁先启动、网络怎么连、环境变量怎么传。 |

### 为什么本项目用 Docker

本项目是一个全栈应用，包含三个部分：

- **PostgreSQL 数据库** — 需要安装和配置
- **NestJS 后端** — Node.js 环境 + Prisma ORM
- **Next.js 前端** — Node.js 环境

不用 Docker 的话，每个开发者都需要在本地安装 PostgreSQL、配置 Node.js 版本、手动设置环境变量。用 Docker 后，只需一条命令 `docker compose up`，三个服务全部自动启动。

---

## 2. 项目整体架构

```
你的电脑 (宿主机)
│
├── docker-compose.yml          ← 编排文件，定义三个服务
│
├── frontend/Dockerfile         ← 前端镜像构建脚本
├── backend/Dockerfile          ← 后端镜像构建脚本
├── backend/.env                ← 本地开发用的环境变量
│
└── Docker 创建的虚拟网络
    ├── kanban-postgres   (PostgreSQL 数据库)
    ├── kanban-backend    (NestJS API 服务)
    └── kanban-frontend   (Next.js Web 服务)
```

**端口映射关系：**

| 服务 | 容器内部端口 | 你的电脑访问端口 | 你在浏览器中访问的地址 |
|------|------------|---------------|---------------------|
| Frontend | 3000 | 3000 | http://localhost:3000 |
| Backend | 3001 | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | **5433** | localhost:5433 |

> 为什么 PostgreSQL 映射到 5433 而不是 5432？因为你的电脑上可能已经装了 PostgreSQL 占用了 5432 端口。用 5433 可以避免冲突。

---

## 3. docker-compose.yml 逐段解析

文件路径：`docker-compose.yml`

### 3.1 PostgreSQL 服务

```yaml
services:
  postgres:
    image: postgres:16-alpine
```

- `services:` — docker-compose 的顶层关键字，下面定义各个服务（容器）。
- `postgres:` — 我们给这个服务取的名字，叫 `postgres`。其他服务可以通过这个名字连接它。
- `image: postgres:16-alpine` — 直接使用 Docker Hub 上的官方 PostgreSQL 16 镜像。`alpine` 是一个超小型的 Linux 发行版（约 5MB），相比完整版镜像体积小很多。

```yaml
    container_name: kanban-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: kanban
```

- `container_name` — 给容器一个固定的名字，方便查看日志（`docker logs kanban-postgres`）。
- `environment` — 传入环境变量。PostgreSQL 官方镜像会读取这些变量来初始化数据库：
  - 创建用户 `postgres`，密码 `postgres`
  - 创建数据库 `kanban`

```yaml
    ports:
      - "5433:5432"
```

- **端口映射格式**：`"宿主机端口:容器端口"`
- 容器内部 PostgreSQL 监听 5432（默认端口）
- 映射到宿主机（你的电脑）的 5433 端口
- 效果：你用数据库工具连接 `localhost:5433` 就能连到容器里的 PostgreSQL

```yaml
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

- **数据卷 (Volume)**：Docker 容器是临时的——删掉容器，里面的数据就没了。
- `postgres-data` 是一个命名卷（在文件底部定义），Docker 会把它存在宿主机上某个位置。
- `/var/lib/postgresql/data` 是容器内 PostgreSQL 存数据的目录。
- 这行的作用：把数据库文件持久化到宿主机，容器删除重建后数据还在。

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

- **健康检查**：Docker 会定期执行 `test` 中的命令来判断服务是否正常。
- `pg_isready -U postgres` — PostgreSQL 自带的检查工具，检查 postgres 用户是否可以连接。
- `interval: 5s` — 每 5 秒检查一次。
- `timeout: 5s` — 单次检查超过 5 秒算失败。
- `retries: 5` — 连续失败 5 次才标记为 unhealthy。
- 健康检查很重要：其他服务（backend）会等待 postgres 变为 healthy 才启动，确保数据库就绪。

### 3.2 Backend 服务

```yaml
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
```

- `build` — 与 postgres 不同，backend 不是直接用现成镜像，而是**自己构建**。
- `context: ./backend` — 构建上下文目录，Docker 会把这个目录下的文件发送给构建引擎。Dockerfile 中的 `COPY` 命令都是相对于这个目录的。
- `dockerfile: Dockerfile` — 指定构建脚本的文件名。

```yaml
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/kanban
      JWT_SECRET: dev-secret-change-in-production
      CORS_ORIGIN: http://localhost:3000
      PORT: 3001
```

- `DATABASE_URL` — 数据库连接字符串。注意这里的 **`@postgres:5432`**：
  - `postgres` 不是 localhost，而是 docker-compose 中定义的服务名。
  - Docker 会自动创建一个内部网络，服务之间通过服务名互相访问。
  - 端口是 5432（容器内部端口），不是 5433（宿主机映射端口）。
- `JWT_SECRET` — JWT 令牌的签名密钥，生产环境必须更换。
- `CORS_ORIGIN` — 允许跨域请求的来源地址。

```yaml
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
```

- `depends_on` — 声明依赖关系。
- `condition: service_healthy` — 等 postgres 健康检查通过后才启动 backend。这比简单等容器启动更可靠。

```yaml
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 15s
```

- `wget -qO- http://localhost:3001/` — 用 wget 请求后端的根路径，能访问说明服务已启动。
- `start_period: 15s` — 容器启动后 15 秒内不计入失败次数，给应用足够的启动时间。

```yaml
    command: >
      sh -c "npx prisma migrate deploy && node dist/src/main.js"
```

- **启动命令覆盖**：不使用 Dockerfile 中的 `CMD`，而是执行这里的命令。
- `npx prisma migrate deploy` — 执行数据库迁移，确保表结构是最新的。
- `&&` — 前一个命令成功后才执行后一个。
- `node dist/src/main.js` — 启动 NestJS 应用。
- 这意味着每次容器启动都会先检查并执行数据库迁移。

### 3.3 Frontend 服务

```yaml
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: kanban-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
```

- 结构与 backend 类似。
- `NEXT_PUBLIC_API_URL` — Next.js 的环境变量，前缀 `NEXT_PUBLIC_` 表示这个变量会暴露到浏览器端。浏览器（在用户电脑上运行）通过 `http://localhost:3001` 访问后端。
- 依赖 backend 健康后才启动。

### 3.4 数据卷声明

```yaml
volumes:
  postgres-data:
```

- 声明命名卷 `postgres-data`。上面 postgres 服务中引用的就是这个卷。
- Docker 会自动管理这个卷的存储位置（通常在 `/var/lib/docker/volumes/` 下）。

---

## 4. Backend Dockerfile 逐行解析

文件路径：`backend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
```

- `FROM` — 指定基础镜像，所有后续操作都基于这个镜像。
- `node:22-alpine` — 包含 Node.js 22 的 Alpine Linux 镜像。
- `AS builder` — 给这个阶段命名为 `builder`，后面可以从这个阶段复制文件。

```dockerfile
WORKDIR /app
```

- 设置工作目录。后续所有命令（RUN、COPY 等）都在 `/app` 下执行。如果目录不存在会自动创建。

```dockerfile
COPY package*.json ./
RUN npm ci
```

- `COPY package*.json ./` — 把 `package.json` 和 `package-lock.json` 复制到容器内。
- `npm ci` — 根据 `package-lock.json` 严格安装依赖（比 `npm install` 更可靠、更快）。

> **为什么先只复制 package.json？** Docker 构建有缓存机制。如果先 `COPY . .` 再 `npm ci`，每次代码改动都会导致依赖重新安装。先复制 package.json 安装依赖，后续代码改动只会重新执行 `COPY . .`，依赖层可以使用缓存，大幅加快构建速度。

```dockerfile
COPY . .
RUN npx prisma generate
RUN npm run build
```

- `COPY . .` — 把所有源代码复制进来。
- `npx prisma generate` — 生成 Prisma 客户端代码（数据库操作的类型安全代码）。
- `npm run build` — 编译 TypeScript 为 JavaScript，输出到 `dist/` 目录。

```dockerfile
# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm install dotenv
```

- **第二阶段开始了！** 这是一个全新的、干净的镜像。
- `npm ci --omit=dev` — 只安装生产依赖，跳过开发依赖（如 TypeScript、ESLint 等）。
- `npm install dotenv` — 额外安装 dotenv（用于读取 .env 文件）。

```dockerfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
```

- `COPY --from=builder` — 从第一阶段（builder）中复制文件，而不是从宿主机。
- 只复制运行所需的产物：
  - `dist/` — 编译后的 JavaScript 代码
  - `generated/` — Prisma 生成的客户端代码
  - `prisma/` — 数据库 Schema 定义
  - `prisma.config.ts` — Prisma 配置文件

> **多阶段构建的好处**：最终镜像不包含源代码、开发依赖、构建工具，只有运行必需的文件。镜像体积大幅缩小。

```dockerfile
EXPOSE 3001

CMD ["node", "dist/src/main.js"]
```

- `EXPOSE 3001` — 声明容器监听 3001 端口（仅文档作用，不会实际开放端口，端口开放靠 docker-compose 的 `ports`）。
- `CMD` — 容器启动时执行的命令。这里启动 NestJS 应用。

---

## 5. Frontend Dockerfile 逐行解析

文件路径：`frontend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_PUBLIC_API_URL=http://localhost:3001
RUN npm run build
```

- 构建流程与 backend 类似，区别在于：
- `ENV NEXT_PUBLIC_API_URL` — 在构建时设置环境变量。Next.js 的 `NEXT_PUBLIC_*` 变量在 **构建时** 就会被内嵌到 JavaScript 中，所以必须在 `npm run build` 之前设置。

```dockerfile
# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
```

- `addgroup` + `adduser` — 创建一个非 root 用户 `nextjs`。以非 root 运行是安全最佳实践。

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

- `--chown=nextjs:nodejs` — 把文件的所有者设为 nextjs 用户。
- `.next/standalone` — Next.js 的独立输出模式生成的最小化服务器，自带一个精简的 `node_modules`。
- `.next/static` — 静态资源文件（JS、CSS、图片等）。

> **Next.js standalone 模式**：Next.js 默认输出需要完整的 `node_modules` 才能运行。standalone 模式只打包运行所需的最少文件，镜像体积从几百 MB 降到几十 MB。需要在 `next.config.ts` 中配置 `output: 'standalone'`。

```dockerfile
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- `USER nextjs` — 切换到非 root 用户，后续命令都以这个用户身份运行。
- `HOSTNAME="0.0.0.0"` — 监听所有网络接口（默认只监听 localhost，在容器中无法被外部访问）。
- `CMD ["node", "server.js"]` — standalone 模式生成的入口文件就是 `server.js`。

---

## 6. 本地开发 vs 容器化的环境差异

### 数据库连接地址

| 场景 | DATABASE_URL | 原因 |
|------|-------------|------|
| 本地开发（不用 Docker） | `postgresql://postgres:postgres@localhost:5433/kanban` | 通过宿主机端口 5433 连接 |
| 容器中运行 | `postgresql://postgres:postgres@postgres:5432/kanban` | 通过 Docker 内部网络的服务名 `postgres` 连接 |

`backend/.env` 文件存的是本地开发的配置：

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/kanban"
```

而在 `docker-compose.yml` 中，`environment` 覆盖了这个值：

```yaml
environment:
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/kanban
```

**关键区别**：`@localhost:5433` vs `@postgres:5432`。容器之间不用 localhost，用服务名通信。

### 启动顺序

**本地开发**需要手动按顺序启动：
1. 先确保 PostgreSQL 在运行
2. 执行 `npx prisma migrate deploy`
3. 启动 backend（`npm run start:dev`）
4. 启动 frontend（`npm run dev`）

**Docker 方式**只需要：
```bash
docker compose up
```
启动顺序由 `depends_on` + `healthcheck` 自动保证。

---

## 7. 常用命令速查

### 启动与停止

```bash
# 启动所有服务（前台运行，能看到日志输出）
docker compose up

# 后台启动（守护进程模式）
docker compose up -d

# 停止所有服务
docker compose down

# 停止并删除数据卷（数据库数据会丢失！）
docker compose down -v
```

### 查看状态

```bash
# 查看运行中的容器
docker compose ps

# 查看 postgres 日志
docker logs kanban-postgres

# 查看 backend 日志
docker logs kanban-backend

# 实时跟踪日志（类似 tail -f）
docker logs -f kanban-backend
```

### 重新构建

```bash
# 代码改了之后，重新构建并启动
docker compose up --build

# 只重新构建 backend
docker compose build backend

# 强制不使用缓存，从头构建
docker compose build --no-cache backend
```

### 进入容器调试

```bash
# 进入 backend 容器的 shell
docker exec -it kanban-backend sh

# 进入 postgres 容器执行 SQL
docker exec -it kanban-postgres psql -U postgres -d kanban
```

### 数据库相关

```bash
# 手动执行数据库迁移
docker exec -it kanban-backend npx prisma migrate deploy

# 打开 Prisma Studio（可视化管理数据库）
docker exec -it kanban-backend npx prisma studio
```
