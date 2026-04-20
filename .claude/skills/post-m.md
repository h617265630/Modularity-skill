---
name: post-m
description: 帖子系统模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /post-m — 帖子系统模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/post-m` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /post-m --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /post-m
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的帖子相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /post-m --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /post-m --write --run
```

## 前端检测逻辑

`/post-m` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 帖子列表 | hooks/usePosts.ts, components/PostList.tsx |
| 帖子项 | hooks/usePost.ts, components/PostItem.tsx |
| 帖子输入 | hooks/useCreatePost.ts, components/PostInput.tsx |

## 前端修改

检测到前端代码后，会自动修改以下文件对接后端 API：

| 文件类型 | 修改内容 |
|----------|----------|
| PostList | 替换 API URL 指向 `/api/posts` |
| PostItem | 替换详情 API URL |
| PostInput | 替换创建帖子 API URL |
| Post Hooks | 替换 baseURL 和端点路径 |
| Post APIs | 替换 baseURL 和端点路径 |

## 生成内容

**后端：**
- `backend/app/models/post.py` — Post 模型
- `backend/app/schemas/post.py` — Pydantic schemas
- `backend/app/cruds/post.py` — CRUD 操作
- `backend/app/api/routes/post.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/posts | 创建帖子 |
| GET | /api/posts | 获取帖子列表 |
| GET | /api/posts/{id} | 获取单个帖子 |
| PUT | /api/posts/{id} | 更新帖子 |
| DELETE | /api/posts/{id} | 删除帖子 |

**数据库：**
- `posts` 表（id, title, content, author_id, created_at, updated_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/postAdapter.ts` — API 适配器（如果路径不匹配）
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
你：/post-m
Claude：运行 npx modularity-skill /post-m 并展示结果

你：/post-m --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
