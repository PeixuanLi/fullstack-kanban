# NestJS 工程方案详解

本文档面向没有 NestJS 经验的读者，结合项目代码逐层讲解后端的实现思路。阅读时建议对照 `backend/src/` 目录下的源码。

---

## 目录

- [NestJS 是什么](#nestjs-是什么)
- [项目总览](#项目总览)
- [启动流程：main.ts](#启动流程maintts)
- [模块系统：如何组织代码](#模块系统如何组织代码)
  - [根模块 AppModule](#根模块-appmodule)
  - [全局模块 PrismaModule](#全局模块-prismamodule)
  - [功能模块 AuthModule / BoardsModule / ListsModule / CardsModule](#功能模块)
- [控制器：定义 API 路由](#控制器定义-api-路由)
  - [路由装饰器](#路由装饰器)
  - [参数获取](#参数获取)
  - [路由守卫](#路由守卫)
- [服务：业务逻辑层](#服务业务逻辑层)
- [DTO 与数据校验](#dto-与数据校验)
- [认证系统：JWT + Passport](#认证系统jwt--passport)
  - [注册与登录流程](#注册与登录流程)
  - [JWT 策略](#jwt-策略)
  - [路由守卫 JwtAuthGuard](#路由守卫-jwtauthguard)
- [数据库访问：Prisma 集成](#数据库访问prisma-集成)
- [环境配置与 CORS](#环境配置与-cors)
- [关键业务逻辑解析](#关键业务逻辑解析)
  - [列表排序](#列表排序)
  - [卡片移动（跨列表）](#卡片移动跨列表)
- [总结：请求生命周期](#总结请求生命周期)

---

## NestJS 是什么

NestJS 是一个基于 TypeScript 的 Node.js 服务端框架。它的核心思想来自 Angular：

| 概念 | 一句话解释 |
|------|-----------|
| **Module（模块）** | 把相关的控制器、服务等打包在一起的容器，是组织代码的基本单元 |
| **Controller（控制器）** | 处理 HTTP 请求，负责接收参数和返回响应，不写业务逻辑 |
| **Service（服务）** | 存放业务逻辑，通过依赖注入被控制器调用 |
| **Guard（守卫）** | 在请求到达控制器之前进行检查（如是否登录），类似中间件 |
| **Pipe（管道）** | 对请求参数做转换和校验 |
| **DTO（数据传输对象）** | 用类定义请求数据的形状和校验规则 |

NestJS 的依赖注入系统会自动管理类的创建和依赖关系，开发者只需用装饰器声明依赖即可。

---

## 项目总览

```
backend/src/
├── main.ts                # 入口文件：创建应用、注册全局管道、配置 CORS
├── app.module.ts          # 根模块：导入所有功能模块
├── prisma/
│   ├── prisma.module.ts   # 全局数据库模块
│   └── prisma.service.ts  # Prisma 客户端封装
├── auth/
│   ├── auth.module.ts     # 认证模块
│   ├── auth.controller.ts # 注册/登录路由
│   ├── auth.service.ts    # 密码哈希 + JWT 签发
│   ├── jwt.strategy.ts    # Passport JWT 策略
│   ├── jwt-auth.guard.ts  # JWT 认证守卫
│   └── dto/               # 请求数据校验
├── boards/                # 看板模块（CRUD）
├── lists/                 # 列表模块（CRUD + 排序）
└── cards/                 # 卡片模块（CRUD + 跨列表移动）
```

每个功能模块内部结构一致：`*.module.ts` + `*.controller.ts` + `*.service.ts` + `dto/`。

---

## 启动流程：main.ts

> 对应文件：`backend/src/main.ts`

```typescript
import 'dotenv/config';                          // 1. 加载 .env 环境变量
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);  // 2. 以 AppModule 为根创建应用

  app.useGlobalPipes(                                // 3. 注册全局校验管道
    new ValidationPipe({ whitelist: true, transform: true })
  );

  app.enableCors({                                   // 4. 配置跨域
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);        // 5. 监听端口
}
bootstrap();
```

**关键点解读：**

- **`import 'dotenv/config'`** — 必须放在最前面，确保后续所有 `process.env` 都能读到 `.env` 文件中的值
- **`ValidationPipe({ whitelist: true })`** — 自动剥离 DTO 中未定义的多余字段，防止客户端传入非预期数据；`transform: true` 则会把字符串参数自动转为 DTO 中声明的类型
- **`NestFactory.create(AppModule)`** — NestJS 应用的起点，所有模块从 `AppModule` 开始加载

---

## 模块系统：如何组织代码

NestJS 用模块（Module）来组织应用结构。每个模块是一个 `@Module()` 装饰的类，声明自己包含哪些控制器、服务，以及依赖哪些其他模块。

### 根模块 AppModule

> 对应文件：`backend/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // 全局配置模块，让 @nestjs/config 可用
    PrismaModule,    // 数据库访问
    AuthModule,      // 认证
    BoardsModule,    # 看板
    ListsModule,     // 列表
    CardsModule,     // 卡片
  ],
})
export class AppModule {}
```

**`imports` 数组**决定了根模块依赖哪些子模块。NestJS 启动时会递归加载所有导入的模块。

**`ConfigModule.forRoot({ isGlobal: true })`** — 让 `ConfigService` 在所有模块中可用，无需每个模块单独导入。`@nestjs/config` 负责读取 `.env` 文件。

### 全局模块 PrismaModule

> 对应文件：`backend/src/prisma/prisma.module.ts`

```typescript
@Global()                              // 标记为全局模块
@Module({
  providers: [PrismaService],          // 提供 PrismaService 实例
  exports: [PrismaService],            // 导出，让其他模块可以注入
})
export class PrismaModule {}
```

**`@Global()`** 装饰器表示这个模块只需要在根模块中导入一次，之后所有模块都能注入 `PrismaService`，不需要在自己的 `imports` 中再声明。

**`providers`** — 声明这个模块能提供哪些服务（NestJS 会自动创建实例）。
**`exports`** — 声明哪些 providers 对外部模块可见。没有 `exports` 的服务只能在本模块内使用。

> 对应文件：`backend/src/prisma/prisma.service.ts`

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter });    // 使用 PostgreSQL 连接池适配器
  }

  async onModuleInit() {
    await this.$connect();  // 应用启动时连接数据库
  }

  async onModuleDestroy() {
    await this.$disconnect();  // 应用关闭时断开连接
    await pool.end();          // 关闭连接池
  }
}
```

**`@Injectable()`** — 标记这个类可以被 NestJS 的依赖注入系统管理。

**`OnModuleInit` / `OnModuleDestroy`** — 生命周期钩子接口。NestJS 在模块初始化时调用 `onModuleInit()`，关闭时调用 `onModuleDestroy()`。这里用来管理数据库连接。

**`extends PrismaClient`** — 让 `PrismaService` 本身就是一个 Prisma 客户端，可以直接调用 `this.prisma.user.findMany()` 等方法。

### 功能模块

每个功能模块（AuthModule、BoardsModule、ListsModule、CardsModule）结构相同：

```typescript
@Module({
  controllers: [BoardsController],    // 本模块的控制器
  providers: [BoardsService],          // 本模块的服务
  exports: [BoardsService],            // 导出服务供其他模块使用
})
export class BoardsModule {}
```

其中 `AuthModule` 稍有不同，因为它需要配置 JWT：

```typescript
@Module({
  imports: [
    PassportModule,                    // Passport.js 基础模块
    JwtModule.register({               // JWT 模块配置
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],  // JwtStrategy 是 Passport 的策略实现
  exports: [AuthService],
})
export class AuthModule {}
```

**`JwtModule.register()`** — 这是 NestJS 的"静态模块配置"模式。`register()` 在模块导入时传入配置，之后在 `AuthService` 中就可以注入 `JwtService` 来签发 Token。

---

## 控制器：定义 API 路由

> 以 `backend/src/boards/boards.controller.ts` 为例

```typescript
@UseGuards(JwtAuthGuard)        // 1. 整个控制器所有路由都需要 JWT 认证
@Controller('boards')            // 2. 路由前缀：/boards
export class BoardsController {
  constructor(private boardsService: BoardsService) {}  // 3. 依赖注入

  @Post()                        // POST /boards
  create(@Req() req: { user: { userId: number } }, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(req.user.userId, dto);
  }

  @Get()                         // GET /boards
  findAll(@Req() req: { user: { userId: number } }) {
    return this.boardsService.findAll(req.user.userId);
  }

  @Get(':id')                    // GET /boards/:id
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.boardsService.findOne(req.user.userId, id);
  }

  @Patch(':id')                  // PATCH /boards/:id
  update(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')                 // DELETE /boards/:id
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.boardsService.remove(req.user.userId, id);
  }
}
```

### 路由装饰器

| 装饰器 | HTTP 方法 | 示例 |
|--------|----------|------|
| `@Post()` | POST | `@Post()` → POST /boards |
| `@Get()` | GET | `@Get(':id')` → GET /boards/:id |
| `@Patch()` | PATCH | `@Patch(':id')` → PATCH /boards/:id |
| `@Delete()` | DELETE | `@Delete(':id')` → DELETE /boards/:id |
| `@Put()` | PUT | `@Put('cards/:id/move')` → PUT /cards/:id/move |

路由路径由 `@Controller('boards')` 的前缀 + 方法装饰器的路径拼接而成。例如 `@Controller('boards')` + `@Get(':id')` = `GET /boards/:id`。

### 参数获取

| 装饰器 | 来源 | 示例 |
|--------|------|------|
| `@Body()` | 请求体（JSON） | `@Body() dto: CreateBoardDto` |
| `@Param('id')` | URL 路径参数 | `@Param('id', ParseIntPipe) id: number` |
| `@Req()` | 整个请求对象 | `@Req() req` → 可获取 `req.user` |
| `@Query()` | URL 查询参数 | `@Query('page') page: string` |

**`ParseIntPipe`** — 一个内置管道，将字符串参数转为整数。如果传入的不是数字会自动返回 400 错误。

### 路由守卫

`@UseGuards(JwtAuthGuard)` 放在类级别，表示该控制器下所有路由都必须通过 JWT 认证。守卫在路由处理函数之前执行：

1. 守卫从请求头 `Authorization: Bearer <token>` 提取 JWT
2. 验证 Token 的有效性和过期时间
3. 如果有效，将解码后的用户信息挂到 `req.user` 上
4. 如果无效，直接返回 401 Unauthorized

---

## 服务：业务逻辑层

> 以 `backend/src/boards/boards.service.ts` 为例

```typescript
@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}  // 注入 PrismaService

  async create(userId: number, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: { title: dto.title, userId },
    });
  }

  async findAll(userId: number) {
    return this.prisma.board.findMany({
      where: { userId },
      include: {                         // 嵌套查询：同时获取列表和卡片
        lists: {
          orderBy: { position: 'asc' },
          include: { cards: { orderBy: { position: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { lists: { ... } },
    });
    if (!board) throw new NotFoundException('Board not found');  // 404
    if (board.userId !== userId) throw new ForbiddenException(); // 403
    return board;
  }
}
```

**核心模式：**

- **所有权检查** — 每个方法接收 `userId`，先查数据再比较 `userId` 是否匹配，不匹配则抛 `ForbiddenException`（403）
- **Prisma 查询** — 通过 `this.prisma.模型名.操作()` 访问数据库，返回值是 Promise
- **异常抛出** — NestJS 内置异常类（`NotFoundException`、`ForbiddenException`、`UnauthorizedException`）会自动转换为对应的 HTTP 状态码

| 异常类 | HTTP 状态码 | 使用场景 |
|--------|------------|---------|
| `NotFoundException` | 404 | 资源不存在 |
| `ForbiddenException` | 403 | 无权访问 |
| `UnauthorizedException` | 401 | 未认证 |

---

## DTO 与数据校验

DTO（Data Transfer Object）用类定义请求数据的结构和校验规则。

> 以 `backend/src/auth/dto/register.dto.ts` 为例

```typescript
import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**工作原理：**

1. 客户端发送 `POST /auth/register`，请求体为 `{"username": "alice", "password": "123456"}`
2. `main.ts` 中的全局 `ValidationPipe` 拦截请求
3. 管道根据 `@Body() dto: RegisterDto` 找到 `RegisterDto` 类
4. 读取类属性上的装饰器，执行校验：`username` 必须是字符串且最少 3 个字符，`password` 必须是字符串且最少 6 个字符
5. 如果 `whitelist: true`，还会自动删除 DTO 中没有声明的多余字段
6. 校验失败自动返回 400 + 错误详情

**常用校验装饰器：**

| 装饰器 | 说明 |
|--------|------|
| `@IsString()` | 必须是字符串 |
| `@IsInt()` | 必须是整数 |
| `@IsOptional()` | 字段可选 |
| `@MinLength(n)` | 最少 n 个字符 |
| `@IsArray()` | 必须是数组 |
| `@ValidateNested({ each: true })` | 校验数组中每个元素的嵌套规则 |

嵌套校验的例子（`lists/dto/reorder-list.dto.ts`）：

```typescript
class ReorderItem {
  @IsInt() listId: number;
  @IsInt() position: number;
}

export class ReorderListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)       // class-transformer：指定数组元素的类型
  items: ReorderItem[];
}
```

`@Type(() => ReorderItem)` 来自 `class-transformer` 库，告诉管道将普通 JSON 对象转换为 `ReorderItem` 类实例，这样 `@ValidateNested` 才能触发其内部的校验装饰器。

---

## 认证系统：JWT + Passport

认证系统由四个文件协作完成：

```
auth.controller.ts  →  接收注册/登录请求
auth.service.ts     →  密码哈希 + JWT 签发
jwt.strategy.ts     →  定义如何验证 JWT Token
jwt-auth.guard.ts   →  守卫，在路由前拦截并验证 Token
```

### 注册与登录流程

> 对应文件：`backend/src/auth/auth.service.ts`

**注册流程：**

```
客户端 POST /auth/register { username, password }
  → AuthService.register()
    1. 检查用户名是否已存在（prisma.user.findUnique）
    2. bcrypt.hash(password, 10) 加密密码（salt rounds = 10）
    3. prisma.user.create() 存入数据库
    4. jwtService.sign({ sub: user.id, username }) 签发 Token
    5. 返回 { access_token: "eyJhbG..." }
```

**登录流程：**

```
客户端 POST /auth/login { username, password }
  → AuthService.login()
    1. 根据用户名查找用户
    2. bcrypt.compare(password, user.password) 验证密码
    3. 签发 Token 并返回
```

**JWT Payload 结构：**

```json
{
  "sub": 1,           // 用户 ID（"sub" 是 JWT 标准字段，表示主体）
  "username": "alice",
  "iat": 1743000000,  // 签发时间（自动添加）
  "exp": 1743604800   // 过期时间（7 天后，自动添加）
}
```

### JWT 策略

> 对应文件：`backend/src/auth/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ↑ 从 Authorization: Bearer <token> 提取 Token

      ignoreExpiration: false,  // 不忽略过期时间
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      // ↑ 用同一个密钥验证签名
    });
  }

  async validate(payload: { sub: number; username: string }) {
    return { userId: payload.sub, username: payload.username };
    // ↑ 返回值会被挂到 req.user 上
  }
}
```

**`PassportStrategy(Strategy)`** — 继承 Passport.js 的 JWT 策略。NestJS 通过 `@nestjs/passport` 将 Passport 集成到自己的守卫体系中。

**`validate()` 方法** — 当 Token 解码成功后调用。返回值就是后续 `@Req() req.user` 中拿到的对象。

### 路由守卫 JwtAuthGuard

> 对应文件：`backend/src/auth/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

仅一行代码。`AuthGuard('jwt')` 告诉 Passport 使用名为 `'jwt'` 的策略（即上面定义的 `JwtStrategy`）。当 `@UseGuards(JwtAuthGuard)` 出现在控制器上时，每个请求都会：

1. 提取 Bearer Token
2. 验证签名和过期时间
3. 调用 `JwtStrategy.validate()` 获取用户信息
4. 将用户信息挂到 `req.user`
5. 失败则返回 401

---

## 数据库访问：Prisma 集成

本项目使用 [Prisma](https://www.prisma.io/) 作为 ORM（对象关系映射器），而非直接写 SQL。

### Schema 定义

> 对应文件：`backend/prisma/schema.prisma`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  boards    Board[]
}

model Board {
  id        Int      @id @default(autoincrement())
  title     String
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lists     List[]
  @@index([userId])
}

model List {
  id        Int      @id @default(autoincrement())
  title     String
  position  Int
  boardId   Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards     Card[]
  @@index([boardId])
  @@unique([boardId, position])
}

model Card {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  position  Int
  listId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  list      List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  @@index([listId])
  @@unique([listId, position])
}
```

**关键 Schema 语法：**

| 语法 | 说明 |
|------|------|
| `@id @default(autoincrement())` | 主键，自增 |
| `@unique` | 唯一约束 |
| `String?` | 可空字段 |
| `@relation(fields: [fk], references: [pk], onDelete: Cascade)` | 外键关系，级联删除 |
| `@@index([column])` | 数据库索引，加速查询 |
| `@@unique([col1, col2])` | 复合唯一约束 |
| `boards Board[]` | 反向关系（一个 User 有多个 Board） |

**级联删除 (`onDelete: Cascade`)** 意味着删除 Board 时，其下所有 List 自动删除；删除 List 时，其下所有 Card 自动删除。

### Prisma 查询模式

在 Service 层中使用 Prisma 的常见操作：

```typescript
// 创建
this.prisma.board.create({
  data: { title: dto.title, userId },
})

// 查询全部（带过滤、排序、嵌套 include）
this.prisma.board.findMany({
  where: { userId },
  include: {
    lists: {
      orderBy: { position: 'asc' },
      include: { cards: { orderBy: { position: 'asc' } } },
    },
  },
  orderBy: { createdAt: 'desc' },
})

// 查询单个
this.prisma.board.findUnique({ where: { id } })

// 更新
this.prisma.board.update({ where: { id }, data: dto })

// 删除
this.prisma.board.delete({ where: { id } })

// 聚合查询（取最大 position）
this.prisma.list.aggregate({
  where: { boardId },
  _max: { position: true },
})

// 事务（多个操作原子执行）
this.prisma.$transaction([
  op1, op2, op3
])

// 交互式事务（可在回调中使用业务逻辑）
this.prisma.$transaction(async (tx) => {
  await tx.card.updateMany({ ... });
  await tx.card.updateMany({ ... });
  return tx.card.update({ ... });
})

// 批量更新
this.prisma.list.updateMany({
  where: { boardId, position: { gt: 2 } },
  data: { position: { decrement: 1 } },
})
```

### 连接池配置

> 对应文件：`backend/src/prisma/prisma.service.ts`

```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);
```

项目使用 Prisma 的 PostgreSQL 驱动适配器 (`@prisma/adapter-pg`) 配合 `pg` 连接池。`Pool` 管理 TCP 连接复用，避免每次查询都新建连接。

---

## 环境配置与 CORS

### 环境变量

通过 `@nestjs/config` 的 `ConfigModule.forRoot({ isGlobal: true })` 加载 `.env` 文件。代码中直接用 `process.env.VARIABLE` 读取。

| 变量 | 用途 | 在哪里使用 |
|------|------|-----------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `prisma.service.ts` |
| `JWT_SECRET` | JWT 签名密钥 | `auth.module.ts`、`jwt.strategy.ts` |
| `PORT` | 服务监听端口 | `main.ts` |
| `CORS_ORIGIN` | 允许的跨域来源 | `main.ts` |

### CORS 配置

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,   // 允许携带 Cookie（虽然本项目主要用 Bearer Token）
});
```

CORS（跨域资源共享）是浏览器安全机制。前端运行在 `localhost:3000`，后端在 `localhost:3001`，端口不同算跨域，必须显式允许。

---

## 关键业务逻辑解析

### 列表排序

> 对应文件：`backend/src/lists/lists.service.ts` → `reorder()` 方法

```typescript
async reorder(userId: number, boardId: number, dto: ReorderListDto) {
  // 1. 验证用户拥有该 Board
  const board = await this.prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new NotFoundException('Board not found');
  if (board.userId !== userId) throw new ForbiddenException();

  // 2. 在事务中批量更新 position
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

客户端传入完整的排序数据（每个列表的 ID 和新位置），服务端在一个事务中批量更新。`$transaction(operations[])` 确保所有更新要么全部成功，要么全部回滚。

### 卡片移动（跨列表）

> 对应文件：`backend/src/cards/cards.service.ts` → `move()` 方法

这是项目中最复杂的业务逻辑。卡片可能在同一列表内移动，也可能跨列表移动，需要正确维护 `position` 的唯一约束。

```typescript
async move(userId: number, id: number, dto: MoveCardDto) {
  // 1. 验证用户拥有源卡片和目标列表
  const card = await this.verifyCardOwnership(id, userId);
  await this.verifyListOwnership(dto.listId, userId);

  const oldListId = card.listId;
  const oldPosition = card.position;
  const newListId = dto.listId;
  const newPosition = dto.position;

  // 2. 使用交互式事务，根据移动类型执行不同的位移操作
  return this.prisma.$transaction(async (tx) => {
    if (oldListId === newListId) {
      // 同列表移动：只移动区间内的卡片
      if (oldPosition < newPosition) {
        // 向后移：中间的卡片前移一位
        await tx.card.updateMany({
          where: { listId, position: { gt: oldPosition, lte: newPosition } },
          data: { position: { decrement: 1 } },
        });
      } else if (oldPosition > newPosition) {
        // 向前移：中间的卡片后移一位
        await tx.card.updateMany({
          where: { listId, position: { gte: newPosition, lt: oldPosition } },
          data: { position: { increment: 1 } },
        });
      }
    } else {
      // 跨列表移动：源列表中高于旧位置的卡片前移，目标列表中高于等于新位置的卡片后移
      await tx.card.updateMany({
        where: { listId: oldListId, position: { gt: oldPosition } },
        data: { position: { decrement: 1 } },
      });
      await tx.card.updateMany({
        where: { listId: newListId, position: { gte: newPosition } },
        data: { position: { increment: 1 } },
      });
    }

    // 最后更新卡片本身的 listId 和 position
    return tx.card.update({
      where: { id },
      data: { listId: newListId, position: newPosition },
    });
  });
}
```

**位移逻辑示意（同列表向后移动）：**

```
移动前：[A:0] [B:1] [C:2] [D:3] [E:4]    将 B(1) 移动到位置 3
第一步：position > 1 且 <= 3 的卡片前移    C(2→1), D(3→2)
第二步：B 的 position 设为 3
结果：  [A:0] [C:1] [D:2] [B:3] [E:4]
```

---

## 总结：请求生命周期

以 `GET /boards/1` 为例，一个请求经过的完整流程：

```
1. HTTP 请求到达 Express 服务器
      ↓
2. CORS 中间件检查来源是否允许
      ↓
3. 全局 ValidationPipe（本请求无 Body，跳过校验）
      ↓
4. 路由匹配：@Controller('boards') + @Get(':id') → BoardsController.findOne()
      ↓
5. JwtAuthGuard 执行
   → 从 Authorization 头提取 Token
   → JwtStrategy.validate() 解码验证
   → 将 { userId, username } 挂到 req.user
      ↓
6. 参数处理：@Param('id', ParseIntPipe) 将 "1" 转为数字 1
      ↓
7. 控制器调用 BoardsService.findOne(userId, 1)
      ↓
8. 服务层执行业务逻辑
   → prisma.board.findUnique({ where: { id: 1 }, include: { lists: ... } })
   → 检查 board.userId === userId
   → 返回 board 数据
      ↓
9. NestJS 将返回值序列化为 JSON 响应（200 OK）
```

这就是整个后端从请求到响应的完整链路。理解了这个流程，就能对照代码理解项目中每个功能的实现方式。
