# Prisma ORM 工程方案详解

本文档面向没有 Prisma 经验的读者，结合项目代码逐步讲解 Prisma 在本项目中的使用方式和设计思路。

---

## 目录

1. [Prisma 是什么 & 为什么用它](#1-prisma-是什么--为什么用它)
2. [项目中的 Prisma 文件结构](#2-项目中的-prisma-文件结构)
3. [Schema：用 TypeScript 风格定义数据库表](#3-schema用-typescript-风格定义数据库表)
   - [基础字段与修饰符](#基础字段与修饰符)
   - [模型间的关系（Relation）](#模型间的关系relation)
   - [索引与唯一约束](#索引与唯一约束)
4. [Prisma 7 的配置方式：prisma.config.ts](#4-prisma-7-的配置方式prismaconfigts)
5. [数据库迁移（Migrations）](#5-数据库迁移migrations)
   - [迁移是怎么工作的](#迁移是怎么工作的)
   - [常用迁移命令](#常用迁移命令)
6. [生成 Prisma Client](#6-生成-prisma-client)
7. [PrismaService：项目中如何连接数据库](#7-prismaservice项目中如何连接数据库)
   - [Driver Adapter 模式](#driver-adapter-模式)
   - [NestJS 集成](#nestjs-集成)
8. [查询 API：增删改查实战](#8-查询-api增删改查实战)
   - [创建记录（Create）](#创建记录create)
   - [查询记录（Find）](#查询记录find)
   - [更新记录（Update）](#更新记录update)
   - [删除记录（Delete）](#删除记录delete)
   - [关联查询（Include）](#关联查询include)
   - [聚合查询（Aggregate）](#聚合查询aggregate)
   - [事务（Transaction）](#事务transaction)
9. [常见问题与排查](#9-常见问题与排查)

---

## 1. Prisma 是什么 & 为什么用它

### 一句话解释

Prisma 是一个 **ORM（Object-Relational Mapper）**——它在你的 TypeScript 代码和 PostgreSQL 数据库之间充当"翻译官"，让你用 TypeScript 对象来操作数据库，而不用手写 SQL。

### 不用 Prisma vs 用 Prisma

| 操作 | 手写 SQL | Prisma |
|------|---------|--------|
| 查询所有看板 | `db.query('SELECT * FROM "Board" WHERE "userId" = $1', [userId])` | `prisma.board.findMany({ where: { userId } })` |
| 创建卡片 | `db.query('INSERT INTO "Card" (...) VALUES (...) RETURNING *', [...])` | `prisma.card.create({ data: { title, position, listId } })` |
| 类型安全 | 需要手动定义类型 | **自动根据 schema 生成类型** |

Prisma 的核心优势：
- **类型安全**：所有查询方法和返回值都有完整的 TypeScript 类型提示
- **自动生成**：修改 schema 后，重新生成 client 即可，不需要手写任何类型
- **迁移管理**：用命令行管理数据库表结构的变更历史

---

## 2. 项目中的 Prisma 文件结构

```
backend/
├── prisma/
│   ├── schema.prisma              # 数据模型定义（核心文件）
│   └── migrations/
│       ├── migration_lock.toml    # 迁移锁，确保一致性
│       └── 20260328060904_init/
│           └── migration.sql      # 自动生成的 SQL 迁移文件
├── generated/
│   └── prisma/                    # 自动生成的 Prisma Client 代码
│       ├── client.ts              # PrismaClient 类导出
│       ├── enums.ts               # 枚举类型
│       ├── models.ts              # 模型类型汇总
│       └── models/
│           ├── User.ts            # User 模型的类型和操作
│           ├── Board.ts
│           ├── List.ts
│           └── Card.ts
├── prisma.config.ts               # Prisma 7 新增的配置文件
└── src/
    └── prisma/
        ├── prisma.service.ts      # 数据库连接服务
        └── prisma.module.ts       # NestJS 模块注册
```

> **重要**：`generated/` 目录是自动生成的，**不要手动修改**。修改 schema 后运行 `npx prisma generate` 重新生成。

---

## 3. Schema：用 TypeScript 风格定义数据库表

schema 文件是 Prisma 的核心，位于 `backend/prisma/schema.prisma`。

### 文件头部配置

```prisma
generator client {
  provider = "prisma-client"    -- Prisma 7 使用 "prisma-client"（不是旧版的 "prisma-client-js"）
  output   = "../generated/prisma"  -- 生成的 Client 代码输出到哪里
}

datasource db {
  provider = "postgresql"       -- 使用 PostgreSQL 数据库
  -- 注意：Prisma 7 中数据库连接 URL 移到了 prisma.config.ts
}
```

### 基础字段与修饰符

以 `Card` 模型为例：

```prisma
model Card {
  id        Int      @id @default(autoincrement())  -- 主键，自增
  title     String                                  -- 必填的字符串
  content   String?                                -- 可空的字符串（? 表示可选）
  position  Int                                     -- 整数，用于排序
  listId    Int                                     -- 外键，关联到 List
  createdAt DateTime @default(now())               -- 创建时间，默认当前时间
  updatedAt DateTime @updatedAt                   -- 更新时间，自动更新
}
```

| 修饰符 | 含义 | 示例 |
|--------|------|------|
| `@id` | 主键 | `id Int @id` |
| `@default(autoincrement())` | 自增默认值 | 用于 id 字段 |
| `@default(now())` | 默认当前时间 | 用于 createdAt |
| `@updatedAt` | 记录更新时自动更新时间戳 | 用于 updatedAt |
| `@unique` | 唯一约束 | `username String @unique` |
| `String?` | 可空字段 | `content String?` |

### 模型间的关系（Relation）

本项目的关系链：`User → Board → List → Card`

```
User  1──* Board  1──* List  1──* Card
```

以 Board 为例，它同时拥有"上属"和"下属"关系：

```prisma
model Board {
  id        Int      @id @default(autoincrement())
  title     String
  userId    Int                                         -- 外键字段

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)  -- 属于哪个 User
  lists List[]                                                            -- 拥有哪些 List
}
```

关键字段解释：
- `fields: [userId]` —— 本模型中哪个字段是外键
- `references: [id]` —— 指向对方模型的哪个字段
- `onDelete: Cascade` —— 删除 User 时，自动删除其所有 Board（级联删除）
- `lists List[]` —— 反向关系，表示一个 Board 拥有多个 List

### 索引与唯一约束

```prisma
model List {
  -- ...
  @@index([boardId])                    -- 普通索引，加速按 boardId 查询
  @@unique([boardId, position])         -- 联合唯一约束，同一 Board 内 position 不能重复
}
```

- `@@index` —— 加速查询，类似书本的目录
- `@@unique` —— 确保数据唯一，比如同一看板内不能有两个位置相同的列表

---

## 4. Prisma 7 的配置方式：prisma.config.ts

Prisma 7 引入了新的配置文件 `prisma.config.ts`，数据库连接 URL 从 schema 中移到了这里：

```typescript
// backend/prisma.config.ts
import 'dotenv/config';                    // 加载 .env 文件
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',          // schema 文件路径
  migrations: {
    path: 'prisma/migrations',             // 迁移文件目录
  },
  datasource: {
    url: process.env['DATABASE_URL'],      // 从环境变量读取数据库 URL
  },
});
```

为什么分离？这样 schema 文件只负责定义数据模型，配置信息（如数据库 URL、迁移路径）单独管理，更灵活。

---

## 5. 数据库迁移（Migrations）

### 迁移是怎么工作的

迁移就是把 schema 中的模型定义**翻译成 SQL 语句**，然后在数据库上执行。

```
schema.prisma  ──prisma migrate dev──>  migrations/xxx/migration.sql  ──执行──>  数据库表
```

执行 `prisma migrate dev` 后会生成 SQL 文件，比如我们的初始迁移：

```sql
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 常用迁移命令

| 命令 | 作用 | 使用场景 |
|------|------|---------|
| `npx prisma migrate dev` | 创建新迁移并应用 | 开发时修改了 schema |
| `npx prisma migrate deploy` | 只应用未执行的迁移 | 生产环境部署 |
| `npx prisma migrate status` | 查看迁移状态 | 检查数据库是否同步 |
| `npx prisma migrate reset` | 重置数据库并重新应用所有迁移 | 开发时需要重新开始 |

---

## 6. 生成 Prisma Client

每次修改 `schema.prisma` 后，需要重新生成 Prisma Client：

```bash
npx prisma generate
```

这会根据 schema 中的模型定义，在 `generated/prisma/` 目录下生成完整的 TypeScript 类型和查询 API。

生成的 `PrismaClient` 类会自动拥有和模型同名属性：

```typescript
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

// PrismaClient 自动拥有这些属性，每个对应一个数据库表
prisma.user   // 操作 User 表
prisma.board  // 操作 Board 表
prisma.list   // 操作 List 表
prisma.card   // 操作 Card 表
```

> **常见错误**：修改 schema 后忘记运行 `npx prisma generate`，导致 `Property 'xxx' does not exist on type 'PrismaClient'`。

---

## 7. PrismaService：项目中如何连接数据库

### Driver Adapter 模式

Prisma 7 使用 **Driver Adapter** 来连接数据库。本项目使用 `@prisma/adapter-pg` 驱动：

```typescript
// backend/src/prisma/prisma.service.ts
import { PrismaClient } from '../../generated/prisma/client';  // 从生成目录导入
import { PrismaPg } from '@prisma/adapter-pg';                // PostgreSQL 驱动适配器
import { Pool } from 'pg';                                     // Node.js 的 PostgreSQL 连接池

// 1. 创建连接池
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],  // 从环境变量读取连接字符串
});

// 2. 用连接池创建 Prisma 适配器
const adapter = new PrismaPg(pool);
```

流程如下：

```
应用代码 → PrismaClient → PrismaPg(Adapter) → pg.Pool → PostgreSQL
```

### NestJS 集成

`PrismaService` 继承了 `PrismaClient`，并实现了 NestJS 的生命周期接口：

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient          // 继承所有数据库操作能力
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter });         // 传入适配器
  }

  async onModuleInit() {
    await this.$connect();      // 应用启动时连接数据库
  }

  async onModuleDestroy() {
    await this.$disconnect();   // 应用关闭时断开连接
    await pool.end();           // 关闭连接池
  }
}
```

然后通过 `PrismaModule` 注册为全局服务：

```typescript
// backend/src/prisma/prisma.module.ts
@Global()                       // 标记为全局模块，其他模块不需要显式导入
@Module({
  providers: [PrismaService],   // 注册服务
  exports: [PrismaService],     // 导出，让其他模块可以注入
})
export class PrismaModule {}
```

在其他服务中直接注入即可使用：

```typescript
@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}  // 自动注入

  async create(userId: number, dto: CreateBoardDto) {
    return this.prisma.board.create({             // 直接使用 Prisma 查询 API
      data: { title: dto.title, userId },
    });
  }
}
```

---

## 8. 查询 API：增删改查实战

以下所有示例来自项目的实际业务代码。

### 创建记录（Create）

```typescript
// boards.service.ts —— 创建看板
return this.prisma.board.create({
  data: { title: dto.title, userId },
});
```

`create` 接收一个 `data` 对象，字段对应 schema 中定义的属性。

### 查询记录（Find）

```typescript
// boards.service.ts —— 查询用户的所有看板
return this.prisma.board.findMany({
  where: { userId },
});
```

```typescript
// boards.service.ts —— 查询单个看板
const board = await this.prisma.board.findUnique({
  where: { id },
});
```

| 方法 | 用途 |
|------|------|
| `findMany` | 查询多条记录，返回数组 |
| `findUnique` | 按唯一字段查询一条，返回对象或 null |
| `findFirst` | 查询第一条匹配记录 |

### 更新记录（Update）

```typescript
// boards.service.ts —— 更新看板标题
return this.prisma.board.update({
  where: { id },
  data: { title: dto.title },
});
```

`where` 指定更新哪条记录，`data` 指定更新什么字段。

### 删除记录（Delete）

```typescript
// boards.service.ts —— 删除看板
return this.prisma.board.delete({ where: { id } });
```

由于 schema 中定义了 `onDelete: Cascade`，删除 Board 时其下的所有 List 和 Card 会自动被删除。

### 关联查询（Include）

当需要同时获取关联数据时，使用 `include`：

```typescript
// boards.service.ts —— 获取看板及其所有列表和卡片
return this.prisma.board.findUnique({
  where: { id },
  include: {
    lists: {
      include: {
        cards: { orderBy: { position: 'asc' } },  // 卡片按位置升序
      },
      orderBy: { position: 'asc' },                // 列表按位置升序
    },
  },
});
```

返回结果会把关联数据嵌套在对象中：

```json
{
  "id": 1,
  "title": "我的看板",
  "lists": [
    {
      "id": 1,
      "title": "待办",
      "position": 0,
      "cards": [
        { "id": 1, "title": "写文档", "position": 0 }
      ]
    }
  ]
}
```

### 聚合查询（Aggregate）

```typescript
// lists.service.ts —— 获取当前最大的 position 值
const maxPosition = await this.prisma.list.aggregate({
  where: { boardId },
  _max: { position: true },
});

const position = (maxPosition._max.position ?? -1) + 1;  // 如果没有记录，从 0 开始
```

`aggregate` 用于统计查询，`_max` 取最大值，还有 `_min`、`_count`、`_sum` 等。

### 事务（Transaction）

当需要同时执行多个写操作、保证全部成功或全部失败时，使用事务：

```typescript
// lists.service.ts —— 批量更新列表位置
return this.prisma.$transaction(
  dto.items.map((item) =>
    this.prisma.list.update({
      where: { id: item.listId },
      data: { position: item.position },
    }),
  ),
);
```

`$transaction` 接收一个 Promise 数组，要么全部执行成功，要么全部回滚。

---

## 9. 常见问题与排查

### `Property 'xxx' does not exist on type 'PrismaClient'`

**原因**：修改了 schema 但没有重新生成 Client。

**解决**：运行 `npx prisma generate`。

### `P3015: Could not find the migration file at migration.sql`

**原因**：`migrations/` 目录下存在空的迁移文件夹（之前操作失败的残留）。

**解决**：删除空的迁移文件夹，然后重新运行 `npx prisma migrate dev`。

### `P1001: Can't reach database server`

**原因**：数据库未启动或连接 URL 配置错误。

**排查**：
1. 检查 `.env` 中的 `DATABASE_URL` 是否正确
2. 确认 PostgreSQL 服务已启动（`pg_isready` 或 `docker compose up postgres`）
3. 确认端口号是否正确（Docker 环境是 5433，本地 PostgreSQL 通常是 5432）

### 测试中的 Mock

单元测试中，Prisma Client 被 mock 替代（`backend/src/__mocks__/prisma-client.ts`）：

```typescript
export class PrismaClient {
  user: any = {};
  board: any = {};
  list: any = {};
  card: any = {};
  $connect: any = () => Promise.resolve();
  $disconnect: any = () => Promise.resolve();
  $transaction: any = (fn: any) => fn(this);
}
```

测试时每个模型的操作方法（如 `create`、`findMany`）会被替换为 mock 函数，避免真实数据库操作。

### 开发工作流总结

```
1. 修改 prisma/schema.prisma（添加/修改模型）
2. 运行 npx prisma migrate dev      → 创建迁移 + 应用到数据库
3. 运行 npx prisma generate          → 重新生成 TypeScript Client
4. 在业务代码中使用 prisma.xxx 查询   → 享受完整的类型提示
```
