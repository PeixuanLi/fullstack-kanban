# shadcn/ui 组件迁移分析报告

## 📊 项目状态概览

| 项目 | 当前状态 |
|------|----------|
| **框架** | Next.js 16.2.1 + React 19 |
| **样式** | Tailwind CSS v4 |
| **shadcn/ui** | 未初始化 (config: null, components: []) |
| **前端组件** | 7 个自定义组件 + 3 个页面 |
| **总代码行数** | ~946 行 |

---

## 🎯 需要安装的 shadcn/ui 组件

### 核心组件（必须）
```bash
npx shadcn@latest add button input label card dialog textarea
```

### 增强体验组件（推荐）
```bash
npx shadcn@latest add alert scroll-area separator alert-dialog skeleton empty
```

### 必需的额外依赖
```bash
npm install sonner  # Toast 通知
```

---

## 📋 详细替换方案

### 1. CardEditModal.tsx (~82 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写模态框遮罩 | `fixed inset-0 z-50 flex items-center justify-center bg-black/50` | 29-31 |
| 手写模态内容 | `w-full max-w-md rounded-lg bg-white p-6 shadow-xl` | 34 |
| 手写 Input 样式 | `rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500` | 45 |
| 手写 Textarea 样式 | `w-full rounded border border-zinc-300 px-3 py-2 resize-none` | 57 |
| 原生 Label | `mb-1 block text-sm font-medium text-zinc-700` | 39 |
| 手写 Button 变体 | `rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700` | 72 |
| **违反：使用现有组件规则** | 手写模态框而非使用 `Dialog` | 全文 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
    <form>
      <label className="mb-1 block text-sm font-medium">Title</label>
      <input className="w-full rounded border..." />
      <textarea className="w-full rounded border..." />
      <button className="rounded bg-blue-600...">Save</button>
    </form>
  </div>
</div>

// ✅ shadcn 替换后
<Dialog open onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Card</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="content">Description</FieldLabel>
          <Textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
          />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**需要的 shadcn 组件：** `dialog`, `input`, `textarea`, `label`, `button`, `field-group`, `field`, `field-label`

**预计代码减少：** ~30%

---

### 2. Card.tsx (~53 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写卡片容器 | `rounded-lg border bg-white p-3 shadow-sm` | 21-24 |
| 手写按钮样式 | `shrink-0 text-zinc-300 hover:text-red-500` | 37 |
| 原始 HTML 按钮 | `<button>` | 32-40 |
| 原生 `confirm()` | `confirm(\`Delete "${card.title}"?\`)` | 35 |
| **违反：使用现有组件规则** | 手写卡片而非使用 `Card` 组件 | 全文 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<div className="group cursor-pointer rounded-lg border bg-white p-3 shadow-sm">
  <div className="flex items-start justify-between gap-2">
    <span className="text-sm font-medium text-zinc-800">{card.title}</span>
    <button onClick={() => onDelete(card.id)}>&times;</button>
  </div>
</div>

// ✅ shadcn 替换后
<Card className="group cursor-pointer transition-shadow hover:shadow-md" onClick={() => onEdit(card)}>
  <CardContent className="p-3">
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-medium">{card.title}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          // 使用 AlertDialog 替代 confirm
        }}
      >
        <XIcon data-icon="only" />
      </Button>
    </div>
    {card.content && (
      <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
        {card.content}
      </p>
    )}
  </CardContent>
</Card>
```

**需要的 shadcn 组件：** `card`, `button`, `alert-dialog`

**预计代码减少：** ~20%

---

### 3. List.tsx (~103 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写列表容器 | `h-fit w-[280px] shrink-0 rounded-lg bg-zinc-200 p-3` | 41 |
| 手写 Input 样式 | `w-full rounded border border-blue-400 px-2 py-1 text-sm font-semibold` | 51 |
| 手写删除按钮 | `ml-1 text-zinc-400 hover:text-red-500 text-lg` | 64 |
| **违反：样式规则** | 使用原始颜色 `bg-zinc-200` 而非语义颜色 | 41 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<div className="h-fit w-[280px] shrink-0 rounded-lg bg-zinc-200 p-3">
  <div className="mb-2 flex items-center justify-between">
    <input className="w-full rounded border border-blue-400..." />
    <button className="ml-1 text-zinc-400...">&times;</button>
  </div>
</div>

// ✅ shadcn 替换后
<Card className="h-fit w-[280px] shrink-0 bg-muted">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
    {editing ? (
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleTitleSubmit}
        className="h-7 text-sm font-semibold"
        autoFocus
      />
    ) : (
      <CardTitle
        onClick={() => setEditing(true)}
        className="cursor-pointer text-sm hover:bg-muted-foreground/10 rounded px-2 py-1"
      >
        {list.title}
      </CardTitle>
    )}
    <Button variant="ghost" size="icon" onClick={() => onDeleteList(list.id, list.title)}>
      <XIcon data-icon="only" />
    </Button>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    {/* Cards */}
  </CardContent>
  <CardFooter className="p-3">
    <AddCardForm listId={list.id} onAdd={onAddCard} />
  </CardFooter>
</Card>
```

**需要的 shadcn 组件：** `card`, `input`, `button`

**预计代码减少：** ~15%

---

### 4. AddListForm.tsx (~71 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写表单容器 | `h-fit shrink-0 w-[280px] rounded-lg bg-zinc-200 p-3` | 39 |
| 手写 Input 样式 | `w-full rounded border border-zinc-300 px-3 py-2 text-sm` | 46 |
| 手写 Button 变体 | `rounded bg-blue-600 px-3 py-1 text-sm text-white` | 52 |
| 手写幽灵按钮 | `rounded px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-300` | 62 |
| **违反：样式规则** | 使用 `space-y-2` 而非 `gap-2` | 40 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<button className="h-fit shrink-0 rounded-lg bg-zinc-700 px-4 py-3 text-sm text-zinc-300">
  + Add list
</button>

<div className="h-fit shrink-0 w-[280px] rounded-lg bg-zinc-200 p-3">
  <form className="space-y-2">
    <input className="w-full rounded border..." />
    <div className="flex gap-2">
      <button className="rounded bg-blue-600...">Add</button>
      <button className="rounded px-3 py-1...">Cancel</button>
    </div>
  </form>
</div>

// ✅ shadcn 替换后
{!show ? (
  <Button
    variant="secondary"
    className="h-fit shrink-0"
    onClick={() => setShow(true)}
  >
    <PlusIcon data-icon="inline-start" />
    Add list
  </Button>
) : (
  <Card className="h-fit shrink-0 w-[280px] bg-muted">
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="List title"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>Add</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => { setShow(false); setTitle('') }}
        >
          Cancel
        </Button>
      </div>
    </form>
  </Card>
)}
```

**需要的 shadcn 组件：** `card`, `input`, `button`

**预计代码减少：** ~25%

---

### 5. AddCardForm.tsx (~70 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写幽灵按钮 | `w-full rounded-lg py-2 text-left text-sm text-zinc-400 hover:bg-zinc-100` | 31-35 |
| 手写 Input 样式 | `w-full rounded border border-zinc-300 px-3 py-2` | 46 |
| 手写 Button 变体 | `rounded bg-blue-600 px-3 py-1 text-sm text-white` | 52 |
| **违反：样式规则** | 使用 `space-y-2` 而非 `gap-2` | 40 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<button className="w-full rounded-lg py-2 text-left text-sm text-zinc-400 hover:bg-zinc-100">
  + Add card
</button>

<form className="space-y-2">
  <input className="w-full rounded border..." />
  <div className="flex gap-2">
    <button className="rounded bg-blue-600...">Add</button>
    <button className="rounded px-3 py-1...">Cancel</button>
  </div>
</form>

// ✅ shadcn 替换后
{!show ? (
  <Button
    variant="ghost"
    className="w-full justify-start"
    onClick={() => setShow(true)}
  >
    <PlusIcon data-icon="inline-start" />
    Add card
  </Button>
) : (
  <form onSubmit={handleSubmit} className="flex flex-col gap-2">
    <Input
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder="Card title"
      autoFocus
    />
    <div className="flex gap-2">
      <Button type="submit" disabled={submitting}>Add</Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => { setShow(false); setTitle('') }}
      >
        Cancel
      </Button>
    </div>
  </form>
)}
```

**需要的 shadcn 组件：** `input`, `button`

**预计代码减少：** ~20%

---

### 6. Board.tsx (~153 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写滚动容器 | `flex gap-4 overflow-x-auto p-6` | 127 |
| 手写滚动条样式 | 自定义 webkit-scrollbar 样式 | globals.css |
| 原生 `confirm()` | `confirm(\`Delete list "${title}" and all its cards?\`)` | 85 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<div className="flex gap-4 overflow-x-auto p-6">
  {sortedLists.map((list) => (
    <ListComponent key={list.id} list={list} {...handlers} />
  ))}
  <AddListForm onAdd={handleAddList} />
</div>

// ✅ shadcn 替换后
<ScrollArea className="p-6">
  <div className="flex gap-4">
    {sortedLists.map((list) => (
      <ListComponent key={list.id} list={list} {...handlers} />
    ))}
    <AddListForm onAdd={handleAddList} />
  </div>
</ScrollArea>
```

**需要的 shadcn 组件：** `scroll-area`, `alert-dialog`

**预计代码减少：** ~5%

---

### 7. page.tsx - 登录/注册页面 (~111 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写卡片容器 | `w-full max-w-sm rounded-lg bg-zinc-800 p-8 shadow-xl` | 52 |
| 手写 Input 样式 | `w-full rounded border border-zinc-600 bg-zinc-700 text-white` | 65, 77 |
| 手写 Label 样式 | `mb-1 block text-sm text-zinc-300` | 59, 73 |
| 手写 Button 样式 | `w-full rounded bg-blue-600 py-2 font-medium text-white` | 89 |
| **违反：样式规则** | 使用原始颜色 `bg-zinc-800`, `text-zinc-300` | 多处 |
| **违反：样式规则** | 手写暗色模式 `bg-zinc-900` | 42, 51 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<div className="flex min-h-screen items-center justify-center bg-zinc-900">
  <div className="w-full max-w-sm rounded-lg bg-zinc-800 p-8 shadow-xl">
    <h1 className="mb-6 text-center text-2xl font-bold text-white">Kanban Board</h1>
    <form className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Username</label>
        <input className="w-full rounded border border-zinc-600 bg-zinc-700 text-white..." />
      </div>
      <button className="w-full rounded bg-blue-600 py-2 font-medium text-white">Login</button>
    </form>
  </div>
</div>

// ✅ shadcn 替换后
<div className="flex min-h-screen items-center justify-center bg-background">
  <Card className="w-full max-w-sm">
    <CardHeader>
      <CardTitle className="text-center text-2xl">Kanban Board</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Enter username"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </Field>
        </FieldGroup>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </Button>
      </form>
    </CardContent>
    <CardFooter className="justify-center">
      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Button
          variant="link"
          onClick={() => { setIsRegister(!isRegister); setError('') }}
        >
          {isRegister ? 'Login' : 'Register'}
        </Button>
      </p>
    </CardFooter>
  </Card>
</div>
```

**需要的 shadcn 组件：** `card`, `input`, `label`, `button`, `field-group`, `field`, `field-label`, `alert`

**预计代码减少：** ~20%

---

### 8. boards/page.tsx - 看板列表页 (~174 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写 Header | `flex items-center justify-between border-b border-zinc-700 bg-zinc-800` | 80 |
| 手写 Input 样式 | `rounded border border-zinc-600 bg-zinc-700 px-3 py-2 text-white` | 107 |
| 手写看板卡片 | `group relative rounded-lg bg-zinc-800 p-5 shadow` | 146 |
| 手写错误提示 | `mb-4 rounded bg-red-900/50 px-4 py-2 text-red-200` | 95 |
| 手写分隔符 | `border-b border-zinc-700` | 80 |
| **违反：使用现有组件规则** | 手写分隔符而非 `Separator` | 80 |
| **违反：使用现有组件规则** | 手写空状态而非 `Empty` | 140 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<header className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-6 py-4">
  <h1 className="text-xl font-bold text-white">My Boards</h1>
  <div className="flex items-center gap-4">
    <span className="text-sm text-zinc-400">{user?.username}</span>
    <button className="rounded px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-700">Logout</button>
  </div>
</header>

{error && <p className="mb-4 rounded bg-red-900/50 px-4 py-2 text-red-200">{error}</p>}

<div className="grid grid-cols-1 gap-4">
  {boards.map((board) => (
    <div key={board.id} className="group relative rounded-lg bg-zinc-800 p-5 shadow">
      <h2 className="text-lg font-semibold text-white">{board.title}</h2>
    </div>
  ))}
</div>

{boards.length === 0 && <p className="text-zinc-500">No boards yet. Create your first board!</p>}

// ✅ shadcn 替换后
<header className="flex items-center justify-between px-6 py-4">
  <h1 className="text-xl font-bold">My Boards</h1>
  <div className="flex items-center gap-4">
    <span className="text-sm text-muted-foreground">{user?.username}</span>
    <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
  </div>
</header>

<Separator />

<main className="p-6">
  {error && (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}

  <div className="mb-6">
    {/* 新建看板表单 */}
  </div>

  {loading ? (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  ) : boards.length === 0 ? (
    <Empty>
      <EmptyHeader>
        <EmptyIcon><FolderIcon /></EmptyIcon>
        <EmptyTitle>No boards yet</EmptyTitle>
        <EmptyDescription>Create your first board to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => setShowForm(true)}>Create Board</Button>
      </EmptyContent>
    </Empty>
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((board) => (
        <Card key={board.id} className="group transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{board.title}</CardTitle>
            <CardDescription>
              Created {new Date(board.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-between">
            <Button
              variant="ghost"
              className="flex-1 justify-start"
              onClick={() => router.push(`/boards/${board.id}`)}
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteBoard(board.id, board.title)}
            >
              <TrashIcon data-icon="only" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )}
</main>
```

**需要的 shadcn 组件：** `button`, `input`, `card`, `separator`, `alert`, `skeleton`, `empty`

**预计代码减少：** ~15%

---

### 9. boards/[id]/page.tsx - 看板详情页 (~130 行)

**当前问题分析：**

| 违反规则 | 当前代码 | 行号 |
|----------|----------|------|
| 手写 Header | `flex items-center justify-between bg-zinc-800 px-6 py-3` | 80 |
| 手写 Input 样式 | `rounded border border-blue-400 bg-zinc-700 px-2 py-1 text-lg font-bold` | 96 |
| 手写分隔符 | Header 与内容之间缺少视觉分隔 | - |
| 手写错误提示 | `mx-6 mt-4 rounded bg-red-900/50 px-4 py-2 text-red-200` | 120 |
| **违反：样式规则** | 使用 `&larr;` HTML 实体 | 86 |

**shadcn 替换方案：**

```tsx
// ❌ 当前手写代码
<header className="flex items-center justify-between bg-zinc-800 px-6 py-3">
  <div className="flex items-center gap-3">
    <button className="text-zinc-400 hover:text-white">&larr; Boards</button>
    <span className="text-zinc-600">|</span>
    <h1 className="text-lg font-bold text-white">{board?.title}</h1>
  </div>
  <button className="rounded px-3 py-1 text-sm text-red-400 hover:bg-zinc-700">Delete Board</button>
</header>

{error && <p className="mx-6 mt-4 rounded bg-red-900/50 px-4 py-2 text-red-200">{error}</p>}

// ✅ shadcn 替换后
<header className="flex items-center justify-between border-b px-6 py-3">
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={() => router.push('/boards')}>
      <ArrowLeftIcon data-icon="only" />
    </Button>
    <Separator orientation="vertical" className="h-6" />
    {editingTitle && board ? (
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleTitleSave}
        className="h-7 text-lg font-bold"
        autoFocus
      />
    ) : (
      <h1
        onClick={() => board && setEditingTitle(true)}
        className="cursor-pointer text-lg font-bold hover:text-primary"
      >
        {board?.title || 'Board'}
      </h1>
    )}
  </div>
  <Button variant="destructive" size="sm" onClick={handleDeleteBoard}>
    <TrashIcon data-icon="inline-start" />
    Delete Board
  </Button>
</header>

<main className="flex-1">
  {error && (
    <Alert variant="destructive" className="mx-6 mt-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )}
  {board && <BoardComponent board={board} onUpdate={fetchBoard} />}
</main>
```

**需要的 shadcn 组件：** `button`, `input`, `separator`, `alert`

**预计代码减少：** ~10%

---

## 🔧 全局样式修改

### globals.css 需要添加的 shadcn CSS 变量

由于项目使用 **Tailwind CSS v4**，需要使用 `@theme inline` 语法：

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* 删除自定义滚动条样式，改用 ScrollArea 组件 */
```

---

## 📊 违规规则统计

| 违规类型 | 出现次数 | 影响文件 |
|----------|----------|----------|
| **手写组件样式** | 35+ | 所有文件 |
| **使用原始颜色值** | 28+ | 所有文件 |
| **手写 Button 变体** | 15 | 所有表单 |
| **使用 space-y-* 而非 gap-*** | 8 | page.tsx, boards/page.tsx, AddListForm.tsx, AddCardForm.tsx |
| **手写分隔符** | 3 | boards/page.tsx, boards/[id]/page.tsx |
| **手写空状态** | 2 | boards/page.tsx, boards/[id]/page.tsx |
| **手写 Loading 占位符** | 3 | 所有页面 |
| **原生 confirm()** | 4 | Card.tsx, List.tsx, Board.tsx, boards/page.tsx |
| **缺少 Dialog Title** | 1 | CardEditModal.tsx (无 Dialog) |

---

## 📦 需要安装的所有组件总结

### 必须安装
```bash
npx shadcn@latest add button input label card dialog textarea
```

### 推荐安装
```bash
npx shadcn@latest add alert separator scroll-area skeleton alert-dialog empty field-group field field-label field-description dialog-header dialog-footer dialog-title dialog-description card-header card-title card-description card-content card-footer
```

### 额外依赖
```bash
npm install sonner
```

### 图标导入
当前项目未使用图标库，shadcn 使用 `lucide-react`，需要安装：
```bash
npm install lucide-react
```

---

## 🚀 实施顺序建议

### 阶段 0：环境准备
1. 初始化 shadcn/ui：`npx shadcn@latest init --defaults`
2. 安装核心依赖和组件

### 阶段 1：基础组件（优先级高）
1. `CardEditModal.tsx` - 收益最大，结构清晰
2. `Card.tsx` - 简单直接
3. `AddCardForm.tsx` + `AddListForm.tsx` - 表单模式统一

### 阶段 2：复杂组件
4. `List.tsx` - 包含子组件
5. `Board.tsx` - 滚动区域优化

### 阶段 3：页面组件
6. `page.tsx` - 登录页
7. `boards/page.tsx` - 列表页
8. `boards/[id]/page.tsx` - 详情页

### 阶段 4：增强体验（可选）
9. 添加 `sonner` Toast 替代 alert
10. 添加 `AlertDialog` 替代 confirm
11. 支持暗色模式切换

---

## ⚠️ 注意事项

### Tailwind CSS v4 兼容性
项目使用 Tailwind CSS v4，配置方式与 v3 不同：
- **不需要** `tailwind.config.js`
- **使用** `@theme inline` 块在 `globals.css` 中定义变量
- shadcn CLI 可能需要手动调整生成的代码

### 拖拽功能保留
`@hello-pangea/dnd` 的拖拽功能需要保留，shadcn 组件需要与 `Draggable`/`Droppable` 配合使用：

```tsx
<Draggable draggableId={`card-${card.id}`} index={index}>
  {(provided) => (
    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
      <Card>{/* Card 内容 */}</Card>
    </div>
  )}
</Draggable>
```

### 图标处理
当前项目未使用图标库，需要：
1. 安装 `lucide-react`
2. 在需要的地方导入图标：
```tsx
import { XIcon, PlusIcon, TrashIcon, ArrowLeftIcon, FolderIcon } from 'lucide-react'
```

---

## 📈 预计收益

| 指标 | 当前 | 迁移后 | 改善 |
|------|------|--------|------|
| **总代码行数** | ~946 行 | ~750 行 | ↓ 21% |
| **样式一致性** | 中等 | 高 | ↑ |
| **可维护性** | 中等 | 高 | ↑ |
| **用户体验** | 基础 | 增强 | ↑ |
| **暗色模式** | 无 | 支持（可选） | ✅ |
| **可访问性** | 无语义 | 完整语义 | ✅ |
| **shadcn 规则违规** | 90+ 处 | 0 处 | ✅ |

---

## ✅ 确认清单

在开始实施前，请确认：

- [ ] 同意上述组件映射方案
- [ ] 同意安装推荐的 shadcn 组件
- [ ] 同意使用 `lucide-react` 图标库
- [ ] 同意实施顺序
- [ ] 了解 Tailwind CSS v4 的兼容性注意事项

确认后，我将开始按阶段逐个替换组件。
