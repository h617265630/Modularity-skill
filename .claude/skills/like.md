---
name: like
description: 点赞功能模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /like — 点赞功能模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/like` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /like --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /like
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的点赞相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /like --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /like --write --run
```

## 前端检测逻辑

`/like` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 点赞按钮 | hooks/useLike.ts, components/LikeButton.tsx |
| 点赞计数 | hooks/useLikeCount.ts, components/LikeCount.tsx |

## 生成内容

**后端：**
- `backend/app/models/like.py` — Like 模型
- `backend/app/schemas/like.py` — Pydantic schemas
- `backend/app/cruds/like.py` — CRUD 操作
- `backend/app/api/routes/like.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/likes | 点赞 |
| DELETE | /api/likes/{target_id} | 取消点赞 |
| GET | /api/likes/{target_id} | 获取点赞状态 |
| GET | /api/likes/{target_id}/count | 获取点赞数量 |

**数据库：**
- `likes` 表（id, user_id, target_type, target_id, created_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/likeAdapter.ts` — API 适配器（如果路径不匹配）
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
你：/like
Claude：运行 npx modularity-skill /like 并展示结果

你：/like --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
