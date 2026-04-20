---
name: search
description: 搜索功能模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /search — 搜索功能模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/search` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /search --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /search
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的搜索相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /search --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /search --write --run
```

## 前端修改

检测到前端代码后，会自动修改以下文件对接后端 API：

| 文件类型 | 修改内容 |
|----------|----------|
| SearchBar | 替换搜索 API URL |
| SearchResults | 替换搜索结果 API URL |
| Search Hooks | 替换 baseURL 和端点路径 |
| Search APIs | 替换 baseURL 和端点路径 |

## 前端检测逻辑

`/search` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 搜索栏 | hooks/useSearch.ts, components/SearchBar.tsx |
| 搜索结果 | hooks/useSearchResults.ts, components/SearchResults.tsx |

## 生成内容

**后端：**
- `backend/app/models/search.py` — Search 模型
- `backend/app/schemas/search.py` — Pydantic schemas
- `backend/app/cruds/search.py` — CRUD 操作
- `backend/app/api/routes/search.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/search | 全局搜索 |
| GET | /api/search/posts | 搜索帖子 |
| GET | /api/search/users | 搜索用户 |
| GET | /api/search/comments | 搜索评论 |

**数据库：**
- `search_history` 表（id, user_id, query, results_count, created_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/searchAdapter.ts` — API 适配器（如果路径不匹配）
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
你：/search
Claude：运行 npx modularity-skill /search 并展示结果

你：/search --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
