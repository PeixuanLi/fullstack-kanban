# 🔥 Prisma 7 重大变更：`datasource.url` 已移出 `schema.prisma`

您遇到的是 **Prisma ORM v7 的破坏性变更**（Breaking Change）。从 v7 开始，数据库连接配置**不再支持**写在 `schema.prisma` 文件中，必须迁移到新的 `prisma.config.ts` 配置文件。

> 错误关键信息：
> ```
> Error code: P1012
> The datasource property `url` is no longer supported in schema files.
> Move connection URLs for Migrate to `prisma.config.ts`
> ```
> [[2]][[7]]

---

## 📋 迁移步骤（4 步完成）

### ✅ 第 1 步：修改 `schema.prisma`

**删除 `datasource` 块中的 `url` 属性**，只保留 `provider`：

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client"  // 注意：v7 使用 "prisma-client" 而非 "prisma-client-js"
  output   = "../generated/prisma/client"  // output 现在是必填项
}

datasource db {
  provider = "postgresql"
  // ❌ 删除这一行：url = env("DATABASE_URL")
}
```

> ⚠️ 注意：
> - `provider` 应改为 `"prisma-client"`（移除 `-js` 后缀）[[3]]
> - `output` 字段现在是**必填**的，不再默认生成到 `node_modules`

---

### ✅ 第 2 步：创建 `prisma.config.ts`

在项目根目录（与 `package.json` 同级）创建配置文件：

```typescript
// prisma.config.ts
import "dotenv/config";  // 加载 .env 文件
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // schema 文件路径（相对本配置文件）
  schema: "prisma/schema.prisma",
  
  // 迁移配置
  migrations: {
    path: "prisma/migrations",      // 迁移文件目录
    seed: "tsx prisma/seed.ts",     // 可选：种子脚本命令
  },
  
  // 🎯 数据库连接（关键！）
  datasource: {
    url: env("DATABASE_URL"),              // 主数据库连接
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"), // 可选：影子数据库（用于 migrate diff）
  },
});
```

> 🔹 使用 `env()`  helper 可提供类型安全，但如果变量可能不存在（如仅运行 `prisma generate`），建议改用 `process.env.DATABASE_URL!` [[1]]

---

### ✅ 第 3 步：更新 `PrismaClient` 初始化代码

Prisma 7 要求使用 **Driver Adapter** 或 **Accelerate** 连接数据库：

#### 方案 A：直接数据库连接（推荐开发/自建部署）

```typescript
// lib/prisma.ts 或 src/db.ts
import { PrismaClient } from "../generated/prisma/client";  // 注意：使用 output 指定的路径
import { PrismaPg } from "@prisma/adapter-pg";  // PostgreSQL 适配器
import { Pool } from "pg";

// 创建连接池
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // 如有 SSL 问题，可添加：
  // ssl: { rejectUnauthorized: false } 
});

// 创建适配器
const adapter = new PrismaPg(pool);

// 导出单例 PrismaClient
export const prisma = new PrismaClient({ adapter });
```

安装依赖：
```bash
npm install @prisma/adapter-pg pg
# 或
pnpm add @prisma/adapter-pg pg
```

#### 方案 B：使用 Prisma Accelerate（云托管/边缘部署）

```typescript
import { PrismaClient } from "../generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

export const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,  // 使用 prisma:// 或 prisma+postgres:// 开头的 URL
}).$extends(withAccelerate());
```

> ⚠️ 注意：**不要**将 Accelerate URL 传给 `PrismaPg` 等驱动适配器，它们需要直连数据库的 URL [[3]]

---

### ✅ 第 4 步：更新 `package.json` 为 ESM 模块

Prisma 7 默认使用 ES Modules，需配置 `package.json`：

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "@prisma/adapter-pg": "^7.0.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "prisma": "^7.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

同时确保 `tsconfig.json` 支持 ESM：
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "esModuleInterop": true,
    "strict": true
  }
}
```

---

## 🔄 完整迁移前后对比

| 配置项 | Prisma v6 及之前 | Prisma v7 |
|--------|-----------------|-----------|
| **数据库连接位置** | `schema.prisma` 的 `datasource.url` | `prisma.config.ts` 的 `datasource.url` |
| **Client Provider** | `"prisma-client-js"` | `"prisma-client"` |
| **Client 输出路径** | 默认 `node_modules/.prisma/client` | 必须显式指定 `output` |
| **连接方式** | 内置引擎自动连接 | 必须使用 Driver Adapter 或 Accelerate |
| **模块系统** | CommonJS / ESM 可选 | 默认 ESM（需 `"type": "module"`） |
| **自动 seeding** | `migrate dev` 后自动执行 | 需手动运行 `prisma db seed` |

---

## 🛠️ 快速验证迁移是否成功

```bash
# 1. 安装依赖
npm install @prisma/adapter-pg pg dotenv

# 2. 生成客户端（注意新路径）
npx prisma generate

# 3. 验证配置
npx prisma validate

# 4. 执行迁移测试
npx prisma migrate dev --name test_migration

# 5. 运行应用测试连接
npm run dev
```

---

## ⚠️ 常见坑点排查

| 问题 | 解决方案 |
|------|----------|
| `Cannot find module 'prisma/config'` | 确保 `@prisma/client@7` 和 `prisma@7` 已正确安装 |
| `env() throws Missing required environment variable` | 如果变量可选，改用 `process.env.DATABASE_URL!` |
| `SSL certificate error` | 添加 `ssl: { rejectUnauthorized: false }` 到 adapter 配置，或正确配置 CA 证书 [[3]] |
| `PrismaClient is not a constructor` | 检查 import 路径是否指向 `output` 指定的生成目录 |
| `migrate dev` 不执行 seed | v7 需手动运行 `npx prisma db seed` [[3]] |

---

## 📦 不同数据库的 Adapter 选择

```bash
# PostgreSQL
npm install @prisma/adapter-pg pg

# MySQL / MariaDB  
npm install @prisma/adapter-mysql mysql2

# SQLite
npm install @prisma/adapter-better-sqlite3 better-sqlite3

# Cloudflare D1
npm install @prisma/adapter-d1

# Neon (Serverless Postgres)
npm install @prisma/adapter-neon @neondatabase/serverless
```

对应初始化代码请参考 [Prisma 官方 Driver Adapters 文档](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/driver-adapters)。

---

## 🔗 官方参考链接

- [Prisma 7 升级指南](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) [[3]]
- [prisma.config.ts 配置参考](https://www.prisma.io/docs/orm/reference/prisma-config-reference) [[1]]
- [Driver Adapters 使用说明](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/driver-adapters)

---

按照以上步骤迁移后，`P1012` 错误即可解决。如果仍有问题，请提供：
1. 您的 `prisma.config.ts` 内容
2. `PrismaClient` 初始化代码
3. 完整的报错堆栈

我可以帮您进一步定位问题！🔧