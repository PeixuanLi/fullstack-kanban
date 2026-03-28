# shadcn/ui 使用说明

本文档说明项目中如何使用 [shadcn/ui](https://ui.shadcn.com/) 组件库。

---

## 什么是 shadcn/ui

shadcn/ui 不是传统意义上的 npm 组件库，而是一套**可复制的组件代码集合**。它的核心理念是：

- 组件代码直接复制到你的项目中，你可以完全控制和修改
- 基于 Radix UI 原语构建，保证无障碍访问
- 使用 Tailwind CSS 进行样式定制
- 不引入额外的运行时依赖（除 Radix UI）

## 项目配置

**配置文件**: `frontend/components.json`

```json
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "blue",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `style` | `base-nova` | 使用最新的基础样式系统 |
| `rsc` | `true` | 支持 React Server Components |
| `baseColor` | `blue` | 基础配色方案 |
| `cssVariables` | `true` | 使用 CSS 变量实现主题切换 |
| `iconLibrary` | `lucide` | 图标库使用 Lucide |

## 已安装的组件

所有组件位于 `frontend/src/components/ui/` 目录下：

| 组件 | 文件 | 用途 |
|------|------|------|
| **Button** | `button.tsx` | 按钮，支持多种变体（default, destructive, outline, ghost 等） |
| **Input** | `input.tsx` | 文本输入框 |
| **Label** | `label.tsx` | 表单标签 |
| **Card** | `card.tsx` | 卡片容器（Card, CardHeader, CardTitle, CardContent） |
| **Textarea** | `textarea.tsx` | 多行文本输入 |
| **Dialog** | `dialog.tsx` | 模态对话框（Dialog, DialogTrigger, DialogContent 等） |
| **Alert** | `alert.tsx` | 提示信息（Alert, AlertTitle, AlertDescription） |
| **Alert Dialog** | `alert-dialog.tsx` | 确认对话框，用于删除等危险操作 |
| **Scroll Area** | `scroll-area.tsx` | 自定义滚动区域 |
| **Separator** | `separator.tsx` | 分隔线 |
| **Skeleton** | `skeleton.tsx` | 加载占位骨架屏 |
| **Field** | `field.tsx` | 表单字段组合（Field, FieldGroup, FieldLabel） |
| **Empty** | `empty.tsx` | 空状态展示（Empty, EmptyContent, EmptyHeader 等） |

## 组件使用示例

### Button

```tsx
import { Button } from '@/components/ui/button';

// 不同变体
<Button variant="default">默认按钮</Button>
<Button variant="destructive">删除按钮</Button>
<Button variant="outline">边框按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button size="sm">小按钮</Button>
```

### Card（布局卡片，非看板卡片）

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

### Dialog

```tsx
import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>打开</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>对话框标题</DialogTitle>
    </DialogHeader>
    {/* 内容 */}
    <DialogFooter>
      <Button>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert Dialog（确认框）

```tsx
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">删除</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除？</AlertDialogTitle>
      <AlertDialogDescription>此操作不可撤销。</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction>确认</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### ScrollArea

```tsx
import { ScrollArea } from '@/components/ui/scroll-area';

<ScrollArea className="h-[calc(100vh-200px)]">
  {/* 可滚动内容 */}
</ScrollArea>
```

### Skeleton（加载状态）

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// 数据加载时显示骨架屏
{loading ? <Skeleton className="h-12 w-full" /> : <Card>...</Card>}
```

## 添加新组件

使用 shadcn CLI 添加组件：

```bash
cd frontend
npx shadcn@latest add [组件名]
```

例如：

```bash
# 添加下拉菜单组件
npx shadcn@latest add dropdown-menu

# 添加 Toast 通知组件
npx shadcn@latest add toast

# 添加多个组件
npx shadcn@latest add dropdown-menu toast tooltip
```

组件代码会被自动写入 `frontend/src/components/ui/` 目录。

## 主题定制

项目通过 CSS 变量实现主题（亮色/暗色），定义在 `frontend/src/app/globals.css` 中。修改 CSS 变量即可全局调整配色。

## 参考资源

- [shadcn/ui 官方文档](https://ui.shadcn.com/docs)
- [shadcn/ui GitHub](https://github.com/shadcn/ui)
- [Radix UI 文档](https://www.radix-ui.com/primitives)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
