---
name: comment-m
description: 多层评论系统模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /comment-m — 多层评论系统模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。支持最多3层嵌套回复。

## 执行步骤

**当你调用 `/comment-m` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /comment-m --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /comment-m
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的评论相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /comment-m --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /comment-m --write --run
```

## 前端检测逻辑

`/comment-m` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 评论列表 | hooks/useComments.ts, components/CommentList.tsx |
| 评论项 | hooks/useComment.ts, components/CommentItem.tsx |
| 评论输入 | hooks/useCommentInput.ts, components/CommentInput.tsx |

## 生成内容

**后端：**
- `backend/app/models/comment.py` — Comment 模型
- `backend/app/schemas/comment.py` — Pydantic schemas
- `backend/app/cruds/comment.py` — CRUD 操作
- `backend/app/api/routes/comment.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/comments | 创建评论 |
| GET | /api/comments/{target_type}/{target_id} | 获取评论列表 |
| PUT | /api/comments/{id} | 更新评论 |
| DELETE | /api/comments/{id} | 删除评论 |
| GET | /api/comments/{id}/replies | 获取回复列表 |

**数据库：**
- `comments` 表（id, content, author_id, target_type, target_id, parent_id, created_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/commentAdapter.ts` — API 适配器（如果路径不匹配）
- 修改现有的 hooks 指向新 API

## 选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览变更，不写入文件（默认） |
| `--write` | 生成代码并写入文件 |
| `--run` | 生成代码 + 写入文件 + 安装依赖 + 运行 |
| `--force` | 强制覆盖已存在的文件 |
| `--hooks-dir=<path>` | 自定义 hooks 目录 |
| `--components-dir=<path>` | 自定义组件目录 |
| `--api-dir=<path>` | 自定义 API 目录 |

## 示例对话

```
你：/comment-m
Claude：运行 npx modularity-skill /comment-m 并展示结果

你：/comment-m --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
