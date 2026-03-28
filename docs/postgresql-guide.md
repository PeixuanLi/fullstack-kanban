# PostgreSQL 工程方案详解

本文档面向没有 PostgreSQL 经验的读者，结合本项目的实际代码，逐行解释 PostgreSQL 的使用方式和背后的设计思路。

---

## 目录

1. [PostgreSQL 是什么 & 为什么用它](#1-postgresql-是什么--为什么用它)
2. [项目整体数据架构](#2-项目整体数据架构)
3. [Docker 数据库配置](#3-docker-数据库配置)
4. [Prisma ORM：数据库的翻译官](#4-prisma-orm数据库的翻译官)
5. [数据模型设计详解](#5-数据模型设计详解)
6. [数据库迁移（Migrations）](#6-数据库迁移migrations)
7. [连接池：性能的关键](#7-连接池性能的关键)
8. [业务代码中的数据库操作](#8-业务代码中的数据库操作)
9. [常用命令速查](#9-常用命令速查)

---

## 1. PostgreSQL 是什么 & 为什么用它

### 核心概念

| 概念 | 类比 | 说明 |
|------|------|------|
| **数据库（Database）** | 文件柜 | 存储所有数据的容器，本项目中叫 `kanban` |
| **表（Table）** | 文件夹中的一张表 | 组织数据的结构，比如 User 表存用户信息 |
| **行（Row）** | 表中的一行记录 | 一条具体的数据，比如一个用户的信息 |
| **列（Column）** | 表格的列 | 数据的字段，比如 username、password |
| **主键（Primary Key）** | 身份证号 | 唯一标识一行数据的字段，通常是自增 ID |
| **外键（Foreign Key）** | 引用另一张表的身份证号 | 建立表与表之间关联的字段 |
| **索引（Index）** | 书本的目录 | 加速查询的数据结构 |

### 为什么本项目用 PostgreSQL

1. **关系型数据库**：数据之间有明确关联（用户→看板→列表→卡片），PostgreSQL 天生支持
2. **ACID 事务**：确保数据一致性，比如移动卡片时需要同时更新多个位置
3. **开源成熟**：社区活跃，文档丰富，问题容易解决
4. **JSON 支持**：虽然本项目没用，但为未来扩展留有空间

---

## 2. 项目整体数据架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│  │  Frontend   │─────▶│   Backend   │─────▶│  PostgreSQL │  │
│  │  (Next.js)  │      │   (NestJS)  │      │   :5432     │  │
│  │  Port:3000  │      │  Port:3001  │      │  Port:5433  │  │
│  └─────────────┘      └─────────────┘      └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Prisma ORM     │  ← 将 TypeScript 代码
                    │  (翻译中间层)     │     转换为 SQL
                    └──────────────────┘
```

**数据流向**：
1. Frontend 发送 HTTP 请求到 Backend
2. Backend 调用 Prisma Service 执行数据库操作
3. Prisma 将 TypeScript 方法调用转换为 SQL 语句
4. PostgreSQL 执行 SQL 并返回结果
5. 结果逆向传递回 Frontend

---

## 3. Docker 数据库配置

### 3.1 docker-compose.yml 配置

**文件位置**：`docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine        # 使用轻量级 Alpine 镜像
    container_name: kanban-postgres
    environment:
      POSTGRES_USER: postgres        # 数据库用户名
      POSTGRES_PASSWORD: postgres    # 数据库密码（开发环境）
      POSTGRES_DB: kanban           # 默认创建的数据库名
    ports:
      - "5433:5432"                  # 主机5433映射到容器5432
    volumes:
      - postgres-data:/var/lib/postgresql/data  # 数据持久化
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

**逐行解释**：

| 配置项 | 说明 |
|--------|------|
| `image: postgres:16-alpine` | Alpine 版本体积小（约200MB），标准版约400MB |
| `POSTGRES_USER/PASSWORD/DB` | PostgreSQL 官方镜像支持的环境变量，自动创建用户和数据库 |
| `"5433:5432"` | **端口映射**：左边是主机端口，右边是容器端口。用 5433 是为了避免与本地已有的 PostgreSQL 冲突 |
| `postgres-data` | **命名卷**：即使容器删除，数据也会保留在 Docker 卷中 |
| `healthcheck` | 健康检查，确保数据库就绪后再启动依赖服务 |

### 3.2 环境变量配置

**文件位置**：`backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/kanban"
```

**连接字符串格式**（重要）：

```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]
            └─────┬─────┘ └──┬──┘ └──┬──┘ └─┬─┘ └───┬───┘
                  │         │      │     │      │
            postgres  postgres  localhost 5433  kanban
              用户       密码      主机   端口   数据库
```

> **注意**：在 Docker Compose 环境中，`DATABASE_URL` 使用 `postgres:5432`（容器内部），因为 backend 和 postgres 在同一 Docker 网络中。

---

## 4. Prisma ORM：数据库的翻译官

### 4.1 什么是 ORM？

**ORM（Object-Relational Mapping）** = 对象关系映射

**不用 ORM**（原生 SQL）：
```typescript
// 需要手写 SQL，容易出错
const result = await db.query(
  "SELECT * FROM users WHERE username = $1",
  [username]
);
```

**用 Prisma ORM**：
```typescript
// TypeScript 风格，类型安全
const user = await prisma.user.findUnique({
  where: { username }
});
```

### 4.2 Prisma 配置文件

**文件位置**：`backend/prisma/schema.prisma`

```prisma
// 生成 Prisma Client 的配置
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"    // 输出路径
}

// 数据源配置
datasource db {
  provider = "postgresql"             // 使用 PostgreSQL
  url      = env("DATABASE_URL")      // 从环境变量读取
}
```

### 4.3 Prisma Client 生成

每次修改 `schema.prisma` 后，需要运行：

```bash
# 生成 Prisma Client（类型定义）
npx prisma generate

# 创建迁移文件并同步数据库
npx prisma migrate dev

# 仅部署时使用（不创建新迁移）
npx prisma migrate deploy
```

---

## 5. 数据模型设计详解

### 5.1 完整数据模型

**文件位置**：`backend/prisma/schema.prisma`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  boards Board[]         // 一个用户有多个看板
}

model Board {
  id        Int      @id @default(autoincrement())
  title     String
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lists List[]        // 一个看板有多个列表

  @@index([userId])    // 为 userId 创建索引
}

model List {
  id        Int      @id @default(autoincrement())
  title     String
  position  Int
  boardId   Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  board Board  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards Card[]        // 一个列表有多个卡片

  @@index([boardId])
  @@unique([boardId, position])  // 同一看板内，position 不能重复
}

model Card {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?  // ? 表示可选字段
  position  Int
  listId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  list List @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@index([listId])
  @@unique([listId, position])
}
```

### 5.2 Prisma 语法详解

| 语法 | 说明 | 示例 |
|------|------|------|
| `@id` | 标记主键 | `id Int @id` |
| `@default(autoincrement())` | 自增默认值 | 自动生成 1, 2, 3... |
| `@unique` | 唯一约束 | `username String @unique` |
| `@default(now())` | 默认当前时间 | `createdAt DateTime @default(now())` |
| `@updatedAt` | 自动更新时间戳 | 每次更新记录时自动更新 |
| `String?` | 可选字段（nullable） | `content String?` |
| `Model[]` | 一对多关系 | `boards Board[]` |
| `@relation` | 定义关系字段 | 见下文详解 |
| `@@index` | 创建索引 | `@@index([userId])` |
| `@@unique` | 组合唯一约束 | `@@unique([boardId, position])` |

### 5.3 关系定义详解

```prisma
// Board 模型中
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
//      │          │                                                │
//      │          │                                                └─ 级联删除：删除用户时，同时删除其所有看板
//      │          └─ 关系配置：用 userId 字段引用 User 的 id
//      └─ 关联的模型
```

**关系类型说明**：

1. **一对一**：很少用，比如用户档案
2. **一对多**：本项目主要模式（User→Boards→Lists→Cards）
3. **多对多**：比如标签系统（一个卡片可以有多个标签）

### 5.4 级联删除（CASCADE）

```prisma
onDelete: Cascade  // 删除父记录时，自动删除所有子记录
```

**效果**：
```
删除 User(id=1) → 自动删除该用户的所有 Board → 自动删除所有 List → 自动删除所有 Card
```

这保证了数据一致性，避免"孤儿记录"（比如引用了不存在用户的看板）。

---

## 6. 数据库迁移（Migrations）

### 6.1 什么是迁移？

迁移 = 数据库的版本控制，记录每次数据库结构的变化。

```
migrations/
├── 20260328060904_init/           # 时间戳_描述
│   └── migration.sql              # 实际的 SQL
```

### 6.2 迁移文件解析

**文件位置**：`backend/prisma/migrations/20260328060904_init/migration.sql`

```sql
-- CreateTable: 创建 User 表
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,              -- SERIAL = 自增整数
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: 唯一索引（防止重复用户名）
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey: 添加外键约束
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
```

### 6.3 迁移工作流

```bash
# 1. 开发阶段：创建迁移并应用
npx prisma migrate dev --name add_card_color

# 2. 这会做两件事：
#    - 创建新的迁移文件
#    - 在数据库中执行迁移

# 3. 生产环境：只应用已有迁移
npx prisma migrate deploy

# 4. 查看迁移状态
npx prisma migrate status
```

### 6.4 迁移与代码同步

```mermaid
graph LR
    A[修改 schema.prisma] --> B[prisma migrate dev]
    B --> C[生成 SQL 文件]
    B --> D[更新数据库]
    B --> E[重新生成 Prisma Client]
```

---

## 7. 连接池：性能的关键

### 7.1 为什么需要连接池？

**不使用连接池**：
```
每次查询 → 建立连接 → 执行查询 → 关闭连接
            ↑ 很慢（约 50-100ms）
```

**使用连接池**：
```
启动时创建 10 个连接 → 复用这些连接 → 程序结束时关闭
              ↑ 很快（约 1-2ms）
```

### 7.2 项目中的连接池实现

**文件位置**：`backend/src/prisma/prisma.service.ts`

```typescript
import { Pool } from 'pg';                     // PostgreSQL 驱动
import { PrismaPg } from '@prisma/adapter-pg'; // Prisma 适配器

// 创建连接池
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

// 创建 Prisma 适配器
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({ adapter });  // 将适配器传给 Prisma
  }
  // ...
}
```

**连接池参数**（使用默认值）：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `max` | 10 | 最大连接数 |
| `min` | 2 | 最小连接数 |
| `idleTimeoutMillis` | 10000 | 空闲连接超时时间 |

### 7.3 NestJS 生命周期管理

```typescript
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy  // 实现生命周期接口
{
  async onModuleInit() {
    await this.$connect();  // 模块初始化时连接数据库
  }

  async onModuleDestroy() {
    await this.$disconnect();  // 模块销毁时断开连接
    await pool.end();          // 关闭连接池
  }
}
```

这确保了：
- 应用启动时建立连接
- 应用关闭时优雅地释放资源

---

## 8. 业务代码中的数据库操作

### 8.1 认证服务（Auth）

**文件位置**：`backend/src/auth/auth.service.ts`

#### 用户注册

```typescript
async register(dto: RegisterDto) {
  // 1️⃣ 检查用户名是否已存在
  const existing = await this.prisma.user.findUnique({
    where: { username: dto.username },
  });
  if (existing) {
    throw new UnauthorizedException('Username already exists');
  }

  // 2️⃣ 密码哈希处理
  const password = await bcrypt.hash(dto.password, 10);

  // 3️⃣ 创建新用户
  const user = await this.prisma.user.create({
    data: { username: dto.username, password },
  });

  // 4️⃣ 生成 JWT Token
  return { access_token: this.jwtService.sign({ sub: user.id, username: user.username }) };
}
```

**Prisma 方法解析**：

| 方法 | SQL 等价 | 说明 |
|------|----------|------|
| `findUnique({ where })` | `WHERE ... LIMIT 1` | 根据唯一字段查找 |
| `create({ data })` | `INSERT INTO ...` | 插入新记录 |

#### 用户登录

```typescript
async login(dto: LoginDto) {
  // 1️⃣ 查找用户
  const user = await this.prisma.user.findUnique({
    where: { username: dto.username },
  });
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 2️⃣ 验证密码
  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 3️⃣ 生成 Token
  return { access_token: this.jwtService.sign({ sub: user.id, username: user.username }) };
}
```

### 8.2 看板服务（Boards）

**文件位置**：`backend/src/boards/boards.service.ts`

#### 创建看板

```typescript
async create(userId: number, dto: CreateBoardDto) {
  return this.prisma.board.create({
    data: { title: dto.title, userId },
  });
}
```

#### 查询所有看板（含关联数据）

```typescript
async findAll(userId: number) {
  return this.prisma.board.findMany({
    where: { userId },                              // 只查当前用户的看板
    include: {                                      // 关联查询（JOIN）
      lists: {
        orderBy: { position: 'asc' },
        include: { cards: { orderBy: { position: 'asc' } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**`include` 的作用**：自动执行 JOIN 查询，一次请求获取所有数据。

等价 SQL（简化）：
```sql
SELECT * FROM Board
LEFT JOIN List ON Board.id = List.boardId
LEFT JOIN Card ON List.id = Card.listId
WHERE Board.userId = $1
```

#### 权限验证

```typescript
async findOne(userId: number, id: number) {
  const board = await this.prisma.board.findUnique({
    where: { id },
    include: { lists: { include: { cards: true } } },
  });
  if (!board) throw new NotFoundException('Board not found');
  if (board.userId !== userId) throw new ForbiddenException(); // ← 所有权检查
  return board;
}
```

### 8.3 列表服务（Lists）

**文件位置**：`backend/src/lists/lists.service.ts`

#### 创建列表（自动计算位置）

```typescript
async create(userId: number, boardId: number, dto: CreateListDto) {
  // 1️⃣ 验证看板存在且属于当前用户
  const board = await this.prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new NotFoundException('Board not found');
  if (board.userId !== userId) throw new ForbiddenException();

  // 2️⃣ 获取最大 position 值
  const maxPosition = await this.prisma.list.aggregate({
    where: { boardId },
    _max: { position: true },
  });

  // 3️⃣ 新列表位置 = 最大值 + 1
  const position = (maxPosition._max.position ?? -1) + 1;

  // 4️⃣ 创建列表
  return this.prisma.list.create({
    data: { title: dto.title, position, boardId },
  });
}
```

**`aggregate` 方法**：用于聚合计算（MAX、MIN、SUM、COUNT 等）。

#### 批量更新位置（事务）

```typescript
async reorder(userId: number, boardId: number, dto: ReorderListDto) {
  // 权限验证（省略）...

  // 使用事务批量更新
  return this.prisma.$transaction(
    dto.items.map((item) =>
      this.prisma.list.update({
        where: { id: item.listId },
        data: { position: item.position },
      }),
    ),
  );
}
```

**`$transaction`**：确保所有更新要么全部成功，要么全部失败。

### 8.4 卡片服务（Cards）

**文件位置**：`backend/src/cards/cards.service.ts`

#### 移动卡片（复杂事务）

```typescript
async move(userId: number, id: number, dto: MoveCardDto) {
  // 1️⃣ 验证权限
  const card = await this.verifyCardOwnership(id, userId);
  await this.verifyListOwnership(dto.listId, userId);

  const oldListId = card.listId;
  const oldPosition = card.position;
  const newListId = dto.listId;
  const newPosition = dto.position;

  // 2️⃣ 在事务中执行位置调整
  return this.prisma.$transaction(async (tx) => {
    if (oldListId === newListId) {
      // 同列表内移动：调整中间项的位置
      if (oldPosition < newPosition) {
        // 向下移动：中间项位置 -1
        await tx.card.updateMany({
          where: { listId: oldListId, position: { gt: oldPosition, lte: newPosition } },
          data: { position: { decrement: 1 } },
        });
      } else if (oldPosition > newPosition) {
        // 向上移动：中间项位置 +1
        await tx.card.updateMany({
          where: { listId: oldListId, position: { gte: newPosition, lt: oldPosition } },
          data: { position: { increment: 1 } },
        });
      }
    } else {
      // 跨列表移动
      await tx.card.updateMany({
        where: { listId: oldListId, position: { gt: oldPosition } },
        data: { position: { decrement: 1 } },  // 原列表：上方项 -1
      });
      await tx.card.updateMany({
        where: { listId: newListId, position: { gte: newPosition } },
        data: { position: { increment: 1 } },  // 目标列表：目标位及以下 +1
      });
    }

    // 3️⃣ 更新卡片位置
    return tx.card.update({
      where: { id },
      data: { listId: newListId, position: newPosition },
    });
  });
}
```

**位置调整逻辑**：
```
原始状态：[A:0, B:1, C:2, D:3, E:4]
移动 C 到位置 1：

步骤1：位置 1-2 的项（B、C）向后移
        → [A:0, B:2, C:3, D:3, E:4]

步骤2：将 C 放到位置 1
        → [A:0, C:1, B:2, D:3, E:4]
```

### 8.5 Prisma 方法速查

| 方法 | 说明 | 示例 |
|------|------|------|
| `findUnique` | 根据唯一字段查找 | `where: { id: 1 }` |
| `findMany` | 查找多条记录 | `where: { userId: 1 }` |
| `findFirst` | 查找第一条 | `where: { title: { contains: 'test' } }` |
| `create` | 创建单条记录 | `data: { title: 'New' }` |
| `createMany` | 批量创建 | `data: [{...}, {...}]` |
| `update` | 更新单条记录 | `where: { id: 1 }, data: {...}` |
| `updateMany` | 批量更新 | `where: {...}, data: {...}` |
| `delete` | 删除单条记录 | `where: { id: 1 }` |
| `deleteMany` | 批量删除 | `where: { userId: 1 }` |
| `count` | 计数 | `where: { userId: 1 }` |
| `aggregate` | 聚合计算 | `_max: { position: true }` |
| `$transaction` | 执行事务 | `[update1, update2]` |
| `$queryRaw` | 执行原始 SQL | `SELECT * FROM ...` |

---

## 9. 常用命令速查

### 9.1 Docker 相关

```bash
# 启动数据库
docker-compose up -d postgres

# 停止数据库
docker-compose stop postgres

# 查看日志
docker-compose logs postgres

# 进入数据库容器
docker-compose exec postgres psql -U postgres -d kanban

# 删除所有数据（危险！）
docker-compose down -v
```

### 9.2 Prisma 相关

```bash
# 生成 Prisma Client
npx prisma generate

# 创建迁移
npx prisma migrate dev --name 描述

# 部署迁移（生产环境）
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 重置数据库（开发环境）
npx prisma migrate reset

# 打开 Prisma Studio（可视化界面）
npx prisma studio

# 格式化 Schema 文件
npx prisma format
```

### 9.3 psql 交互式命令

```bash
# 连接数据库
psql postgresql://postgres:postgres@localhost:5433/kanban

# 常用 SQL 命令
\dt          # 列出所有表
\d User      # 查看 User 表结构
SELECT * FROM "User";  # 查询数据
\q           # 退出
```

### 9.4 完整开发工作流

```bash
# 1. 启动数据库
docker-compose up -d postgres

# 2. 应用迁移
cd backend && npx prisma migrate dev

# 3. 启动后端
npm run start:dev

# 4. 查看数据（可选）
npx prisma studio
```

---

## 附录：常见问题

### Q1: 为什么 Card 的 content 字段是可选的？

A: 有些卡片可能只需要标题，不需要详细内容。

```prisma
content String?  // ? 表示 nullable
```

### Q2: `@@unique([boardId, position])` 的作用？

A: 确保同一个看板内，每个列表的位置是唯一的。

```
Board 1: List A(position:0), List B(position:1)  ✓
Board 1: List A(position:0), List B(position:0)  ✗ 违反唯一约束
Board 2: List X(position:0)  ✓ (不同看板，可以有相同 position)
```

### Q3: 为什么要用 `SERIAL` 而不是 `UUID`？

A: 本项目选择简单递增 ID。如需分布式系统，可以考虑 UUID。

```prisma
// 当前方案
id Int @id @default(autoincrement())  // 1, 2, 3...

// UUID 方案
id String @id @default(uuid())  // "550e8400-e29b-41d4-a716-446655440000"
```

### Q4: 如何调试 Prisma 生成的 SQL？

```bash
# 开启日志
DEBUG="prisma:query" npm run start:dev
```

---

## 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs)
- [NestJS 数据库最佳实践](https://docs.nestjs.com/techniques/database)
