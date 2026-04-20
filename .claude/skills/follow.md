---
name: follow
description: 关注系统模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /follow — 关注系统模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/follow` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /follow --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /follow
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的关注相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /follow --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /follow --write --run
```

## 前端检测逻辑

`/follow` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 关注按钮 | hooks/useFollow.ts, components/FollowButton.tsx |
| 粉丝列表 | hooks/useFollowers.ts, components/FollowersList.tsx |
| 关注列表 | hooks/useFollowing.ts, components/FollowingList.tsx |

## 生成内容

**后端：**
- `backend/app/models/follow.py` — Follow 模型
- `backend/app/schemas/follow.py` — Pydantic schemas
- `backend/app/cruds/follow.py` — CRUD 操作
- `backend/app/api/routes/follow.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/follows | 关注用户 |
| DELETE | /api/follows/{user_id} | 取消关注 |
| GET | /api/follows/{user_id}/followers | 获取粉丝列表 |
| GET | /api/follows/{user_id}/following | 获取关注列表 |
| GET | /api/follows/check/{user_id} | 检查是否已关注 |

**数据库：**
- `follows` 表（id, follower_id, following_id, created_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/followAdapter.ts` — API 适配器（如果路径不匹配）
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
你：/follow
Claude：运行 npx modularity-skill /follow 并展示结果

你：/follow --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
