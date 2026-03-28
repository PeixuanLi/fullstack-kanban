# 卡片拖动更换列表 — 完整调用栈分析

## 调用链总览

```
用户拖放卡片
  → Card.tsx (Draggable) 触发拖拽
  → List.tsx (Droppable) 作为放置目标
  → Board.tsx (DragDropContext.onDragEnd) 处理拖拽结束
    → api.put() → lib/api.ts (HTTP PUT, 携带 JWT)
      → CardsController.move()  (路由: PUT /cards/:id/move)
        → CardsService.move()
          → verifyCardOwnership()   (Prisma: card.findUnique + include list.board)
          → verifyListOwnership()   (Prisma: list.findUnique + include board)
          → prisma.$transaction()
            → card.updateMany()     (调整源列表/目标列表中其他卡片的 position)
            → card.update()         (更新目标卡片的 listId + position)
```

---

## 1. 前端组件层

### 1.1 Card.tsx — 可拖拽单元
**文件**: `frontend/src/components/Card.tsx`

```tsx
<Draggable draggableId={`card-${card.id}`} index={index}>
```
- 每张卡片用 `@hello-pangea/dnd` 的 `<Draggable>` 包裹
- `draggableId` 格式为 `card-{id}`，用于在 `onDragEnd` 中解析卡片 ID
- `index` 由父组件 List 传入，基于卡片排序后的位置

### 1.2 List.tsx — 放置区域
**文件**: `frontend/src/components/List.tsx`

```tsx
<Droppable droppableId={`list-${list.id}`}>
```
- 每个列表用 `<Droppable>` 包裹，作为卡片的放置目标
- `droppableId` 格式为 `list-{id}`，用于在 `onDragEnd` 中解析源/目标列表 ID
- 内部卡片按 `position` 排序后渲染

### 1.3 Board.tsx — 拖拽协调器 (核心)
**文件**: `frontend/src/components/Board.tsx`

```tsx
<DragDropContext onDragEnd={onDragEnd}>
```

`onDragEnd` 回调 (第 23-71 行):
1. **守卫条件**: 无目标位置 或 原地不动 → 直接 return
2. **解析 ID**: 从 `droppableId`/`draggableId` 中提取数字 ID
3. **统一调用**: 无论同列表排序还是跨列表移动，都调用:
   ```ts
   api.put(`/cards/${cardId}/move`, {
     listId: destListId,    // 目标列表 ID
     position: destination.index,  // 目标位置索引
   });
   ```
4. **回调刷新**: `onUpdate()` 重新获取看板数据
5. **错误恢复**: catch 块中也调用 `onUpdate()` 回滚 UI

### 1.4 api.ts — HTTP 请求层
**文件**: `frontend/src/lib/api.ts`

```ts
api.put(`/cards/${cardId}/move`, { listId, position })
```
- 实际调用 `fetch(PUT, ${API_BASE}/cards/${id}/move)`
- 自动附加 `Authorization: Bearer <JWT>` 头 (从 localStorage 取 token)
- 401 响应自动清除 token 并跳转登录页

---

## 2. API 接口层

### 请求
```
PUT /cards/:id/move
Headers: Authorization: Bearer <JWT>
Body: { "listId": number, "position": number }
```

### DTO 校验
**文件**: `backend/src/cards/dto/move-card.dto.ts`
```ts
export class MoveCardDto {
  @IsInt() listId: number;
  @IsInt() position: number;
}
```

---

## 3. 后端 Controller 层

**文件**: `backend/src/cards/cards.controller.ts` (第 47-54 行)

```ts
@UseGuards(JwtAuthGuard)    // 全局 JWT 认证守卫
@Put('cards/:id/move')
move(
  @Req() req: { user: { userId: number } },
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: MoveCardDto,
) {
  return this.cardsService.move(req.user.userId, id, dto);
}
```
- `JwtAuthGuard` 验证 JWT 并将 `userId` 注入 `req.user`
- `ParseIntPipe` 将路径参数 `:id` 转为数字
- 将 `userId`、卡片 `id`、`MoveCardDto` 传给 Service

---

## 4. 后端 Service 层

**文件**: `backend/src/cards/cards.service.ts` (第 59-100 行)

### 步骤 1: 权限验证
```ts
const card = await this.verifyCardOwnership(id, userId);   // 卡片归属校验
await this.verifyListOwnership(dto.listId, userId);         // 目标列表归属校验
```
- `verifyCardOwnership`: `prisma.card.findUnique({ include: { list: { include: { board } } } })` — 三级关联查询确认卡片属于当前用户
- `verifyListOwnership`: `prisma.list.findUnique({ include: { board } })` — 确认目标列表属于当前用户

### 步骤 2: 事务中执行位置调整
```ts
return this.prisma.$transaction(async (tx) => { ... });
```

**同列表内排序** (oldListId === newListId):
| 方向 | 操作 | SQL 等效 |
|------|------|---------|
| 往下移 (old < new) | 位置在 (old, new] 的卡片 position - 1 | `UPDATE cards SET position = position - 1 WHERE listId = ? AND position > ? AND position <= ?` |
| 往上移 (old > new) | 位置在 [new, old) 的卡片 position + 1 | `UPDATE cards SET position = position + 1 WHERE listId = ? AND position >= ? AND position < ?` |

**跨列表移动**:
| 步骤 | 操作 | SQL 等效 |
|------|------|---------|
| 1 | 源列表: position > oldPosition 的卡片 position - 1 | `UPDATE cards SET position = position - 1 WHERE listId = ? AND position > ?` |
| 2 | 目标列表: position >= newPosition 的卡片 position + 1 | `UPDATE cards SET position = position + 1 WHERE listId = ? AND position >= ?` |
| 3 | 更新卡片本身: listId + position | `UPDATE cards SET listId = ?, position = ? WHERE id = ?` |

---

## 5. 数据库层

**数据库**: PostgreSQL (通过 Prisma ORM)

### Schema 关键约束
**文件**: `backend/prisma/schema.prisma`
```prisma
model Card {
  position  Int
  listId    Int
  list List @relation(fields: [listId], references: [id], onDelete: Cascade)
  @@unique([listId, position])   // 同一列表内位置唯一
}
```

### 一次跨列表拖动执行的 SQL (示例: 卡片从列表A位置2移到列表B位置1)

```sql
BEGIN TRANSACTION;

-- 1. 查询卡片 + 验证归属 (隐式 JOIN lists → boards → users)
SELECT c.*, l."boardId", b."userId"
FROM "Card" c
JOIN "List" l ON c."listId" = l.id
JOIN "Board" b ON l."boardId" = b.id
WHERE c.id = $1;

-- 2. 验证目标列表归属
SELECT l.*, b."userId"
FROM "List" l
JOIN "Board" b ON l."boardId" = b.id
WHERE l.id = $2;

-- 3. 源列表: 位置 > 2 的卡片下移
UPDATE "Card" SET position = position - 1
WHERE "listId" = $3 AND position > 2;

-- 4. 目标列表: 位置 >= 1 的卡片下移腾位
UPDATE "Card" SET position = position + 1
WHERE "listId" = $4 AND position >= 1;

-- 5. 更新目标卡片
UPDATE "Card" SET "listId" = $5, position = 1
WHERE id = $6;

COMMIT;
```

---

## 6. 数据流总结

```mermaid
[用户拖放]
  → onDragEnd(source: {droppableId, index}, destination: {droppableId, index}, draggableId)
  → 解析: cardId=3, sourceListId=1, destListId=2, newIndex=1
  → PUT /cards/3/move { listId: 2, position: 1 }
  → JwtAuthGuard 解析 token → userId
  → CardsController.move(userId, 3, {listId:2, position:1})
  → CardsService.move()
      → prisma.card.findUnique()  ← 验证卡片归属
      → prisma.list.findUnique()  ← 验证列表归属
      → prisma.$transaction([
            card.updateMany(),   ← 源列表位置调整
            card.updateMany(),   ← 目标列表位置调整
            card.update()        ← 更新卡片
          ])
  → 返回更新后的卡片数据
  → 前端 onUpdate() 重新 GET /boards/:id 获取最新数据
```
