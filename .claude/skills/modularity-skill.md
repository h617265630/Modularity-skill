---
name: modularity-skill
description: Generate full-stack modules from commands like /comment-m, /like, /follow, /notification
---

# Modularity-skill — Feature Compiler AI

## 调用方式

```
/modularity-skill <command> [command2] [command3] ...
```

例如：
- `/modularity-skill /comment-m` — 添加单个模块
- `/modularity-skill /like /follow /comment-m` — 批量添加多个模块
- `/modularity-skill /like --run` — 添加并立即运行

## 支持的功能命令

| 命令 | 功能 | 主要组件 |
|------|------|---------|
| `/comment-m` | 多层评论系统 | CommentList, CommentItem, CommentInput, useComments |
| `/like` | 点赞/取消点赞 | LikeButton, LikeCount, useLike, useLikeCount |
| `/follow` | 用户关注系统 | FollowButton, FollowersList, FollowingList, useFollow |
| `/notification` | 实时通知系统 | NotificationBell, NotificationDropdown, NotificationList, useNotifications |
| `/user-m` | 用户系统 | UserProfile, UserList, useUsers |
| `/post-m` | 帖子系统 | PostList, PostItem, PostInput, usePosts |
| `/search` | 搜索功能 | SearchBar, SearchResults, useSearch |
| `/message` | 私信系统 | MessageList, MessageItem, useMessages |
| `/readytorun` | **一键启动** - 安装依赖并运行项目（代码已存在时用） | - |

---

## 运行选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览变更，不写入文件（默认） |
| `--write` | 生成代码并写入文件 |
| `--run` | 生成代码 + 写入文件 + 自动安装依赖 + 自动运行 |
| `--verify` | 生成代码 + 写入文件 + 运行测试验证 |
| `--force` | 强制覆盖已存在的文件 |
| `--language <python\|typescript>` | 指定后端语言 |
| `--frontend <react\|vue\|nextjs>` | 指定前端框架 |

---

## 执行逻辑

当用户调用此 skill 时：

### 第一步：识别命令

解析 `<command>` 确定要生成的功能：
- `/comment-m` → 生成评论系统
- `/like` → 生成点赞系统
- `/follow` → 生成关注系统
- `/notification` → 生成通知系统
- `/user-m` → 生成用户系统
- `/post-m` → 生成帖子系统
- `/search` → 生成搜索功能
- `/message` → 生成私信系统
- `/readytorun` → **一键启动**：假设代码已存在，只安装依赖并运行服务

### 第二步：批量处理命令

解析所有 `<command>` 确定要生成的功能列表：
- `/comment-m` → 评论系统
- `/like` → 点赞系统
- `/follow` → 关注系统
- `/notification` → 通知系统

**批量执行逻辑：**
1. 解析所有命令，收集要生成的模块列表
2. 检查选项（`--run`, `--write`, `--verify`）应用于所有模块
3. 按依赖顺序生成代码（基础模块先生成）
4. 所有模块代码生成完成后，统一执行后续流程

**依赖顺序（先添加基础模块）：**
1. `user-m` — 用户系统（其他模块可能依赖）
2. `post-m` — 帖子系统
3. `comment-m` — 评论系统（依赖 post）
4. `like` — 点赞系统（依赖 post/user）
5. `follow` — 关注系统（依赖 user）
6. `notification` — 通知系统（依赖 user）
7. `message` — 私信系统（依赖 user）
8. `search` — 搜索功能

### 第三步：生成并写入文件

根据功能类型，在当前工作目录创建以下文件：

#### 后端文件（创建到 `backend/app/`）

**models/<feature>.py**
- SQLAlchemy 模型定义
- 表字段、外键、索引

**cruds/<feature>_crud.py**
- CRUD 操作类
- 增删改查方法

**api/<feature>.py**
- FastAPI 路由
- API 端点定义

**schemas/<feature>.py**
- Pydantic schema
- 请求/响应模型

#### 前端文件（创建到 `frontend/src/`）

**components/**
- `<Feature>List.tsx` — 列表组件
- `<Feature>Item.tsx` — 单项组件
- `<Feature>Input.tsx` — 输入组件（如适用）

**hooks/use<Feature>.ts**
- 自定义 React Hook
- 数据获取和状态管理

**services/<feature>.ts**
- API 调用封装
- 接口定义

**types/<feature>.ts**
- TypeScript 类型定义

#### 数据库文件（创建到 `database/`）

**migrations/xxx_create_<features>.sql**
- 表创建语句
- 索引创建语句

### 第四步：输出摘要

完成后，输出：

1. 创建的文件列表
2. 集成步骤说明
3. 需要手动调整的地方

**批量模式输出差异：**
- 汇总所有模块创建的文件
- 按模块分组列出
- 统一集成步骤（合并重复步骤）

---

## `--run` 自动安装运行流程

当用户使用 `--run` 选项时，完成代码生成后执行以下流程：

### 检测项目类型

根据项目结构判断运行方式：

**FastAPI 项目（检测到 `backend/` + `pyproject.toml` 或 `requirements.txt`）：**
```bash
# 1. 安装后端依赖
cd backend && pip install -e .  # 或 pip install -r requirements.txt

# 2. 运行数据库迁移
alembic upgrade head

# 3. 启动后端服务
uvicorn app.main:app --reload --port 8000 &
```

**Express/Next.js 项目（检测到 `package.json`）：**
```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖（如果 backend/ 目录存在）
cd backend && npm install && cd ..

# 3. 启动开发服务器
npm run dev &
```

**Monorepo 项目（检测到 `backend/` 和 `frontend/` 目录）：**
```bash
# 1. 安装根目录依赖（如果存在）
npm install 2>/dev/null || true

# 2. 安装后端依赖
cd backend && npm install && cd ..
# 或如果是 FastAPI
cd backend && pip install -e .

# 3. 安装前端依赖
cd frontend && npm install && cd ..

# 4. 启动服务（后台运行）
cd backend && uvicorn app.main:app --reload --port 8000 &  # 或 npm run dev
cd frontend && npm run dev &
```

### 批量模式（推荐）

**一次性添加多个模块，最后统一运行：**
```
/like /follow /comment-m /notification --write --run
```

**执行流程：**
1. 按依赖顺序生成所有模块代码
2. 写入所有文件（只写一次）
3. 安装一次依赖（合并所有需要）
4. 启动一次服务

### 输出运行状态

启动后输出：
```
✅ 依赖安装完成
🚀 服务启动成功：
   - 后端 API: http://localhost:8000
   - 前端: http://localhost:3000
   - API 文档: http://localhost:8000/docs

📦 已添加模块：like, follow, comment-m, notification

按 Ctrl+C 停止服务
```

### 错误处理

- 如果安装失败，输出具体错误信息并提示手动安装
- 如果端口被占用，自动尝试下一个端口（8001, 3001）
- 记录启动的进程 PID，方便清理

---

## `/readytorun` 一键启动

当用户输入 `/readytorun` 时，**跳过代码生成**，直接检测项目并安装依赖、运行服务。

### 使用场景

- 代码已经存在（之前用 `--write` 生成过）
- 只是需要重新安装依赖或启动服务
- 项目代码手动修改过，需要快速启动

### 执行流程

```
/readytorun
```

1. **检测项目类型**（与 `--run` 相同）
2. **安装依赖**（检测 `package.json`、`requirements.txt` 等）
3. **运行数据库迁移**（如果有 `alembic`）
4. **启动服务**（后台运行）

### 检测逻辑

扫描项目目录，确定运行方式：

| 检测到 | 动作 |
|--------|------|
| `requirements.txt` | `pip install -r requirements.txt` |
| `pyproject.toml` | `pip install -e .` |
| `package.json` | `npm install` |
| `backend/` 目录 | 尝试安装后端依赖 |
| `frontend/` 目录 | 尝试安装前端依赖 |
| `alembic.ini` | `alembic upgrade head` |

### 启动命令

| 项目类型 | 启动命令 |
|---------|---------|
| FastAPI | `uvicorn app.main:app --reload --port 8000` |
| Express | `node src/index.js` |
| Next.js | `npm run dev` |
| Nuxt | `npm run dev` |

### 输出示例

```
🔍 检测项目类型：Monorepo (FastAPI + Next.js)

📦 安装依赖中...
   ✓ pip install -r backend/requirements.txt
   ✓ npm install (frontend)
   ✓ alembic upgrade head

🚀 启动服务中...
   ✓ 后端已启动: http://localhost:8000
   ✓ 前端已启动: http://localhost:3000
   ✓ API 文档: http://localhost:8000/docs

✨ 项目已就绪！按 Ctrl+C 停止服务
```

### 与 `--run` 的区别

| 特性 | `--run` | `/readytorun` |
|------|---------|---------------|
| 生成代码 | ✅ | ❌ |
| 写入文件 | ✅ | ❌ |
| 安装依赖 | ✅ | ✅ |
| 运行服务 | ✅ | ✅ |
| 适用场景 | 首次添加模块 | 代码已存在，只需启动 |

### /comment-m 评论系统

**后端：**
- Comment 模型：id, content, user_id, target_type, target_id, parent_id, reply_count, is_edited, created_at, updated_at
- API：POST /comments, GET /comments/{id}, GET /comments/{target_type}/{target_id}, PATCH /comments/{id}, DELETE /comments/{id}
- 支持嵌套回复，最大深度 3 层

**前端：**
- CommentList：显示评论列表，递归渲染子评论
- CommentItem：单个评论，显示回复按钮
- CommentInput：输入框，支持 @ 提及
- useComments：获取、创建、更新、删除评论

### /like 点赞系统

**后端：**
- Like 模型：id, user_id, target_type, target_id, created_at
- 唯一索引：(user_id, target_type, target_id)
- API：POST /likes, DELETE /likes/{id}, GET /likes/check/{target_type}/{target_id}, GET /likes/{target_type}/{target_id}/count

**前端：**
- LikeButton：点赞按钮，点击切换状态
- LikeCount：显示点赞数量
- useLike：检查点赞状态、切换点赞
- useLikeCount：获取点赞数量

### /follow 关注系统

**后端：**
- Follow 模型：id, follower_id, following_id, created_at
- 唯一索引：(follower_id, following_id)
- API：POST /follows, DELETE /follows/{id}, GET /follows/following/{user_id}, GET /follows/followers/{user_id}, GET /follows/check/{target_user_id}

**前端：**
- FollowButton：关注/取消关注按钮
- FollowersList：粉丝列表
- FollowingList：关注列表
- FollowStats：显示粉丝/关注数量
- useFollow：检查关注状态、切换关注

### /notification 通知系统

**后端：**
- Notification 模型：id, user_id, type, title, content, data(JSON), is_read, read_at, action_url, actor_id, created_at
- NotificationSetting 模型：user_id, email_enabled, push_enabled, 各类型通知开关
- API：GET /notifications, GET /notifications/unread-count, PATCH /notifications/{id}/read, PATCH /notifications/read-all, DELETE /notifications/{id}

**前端：**
- NotificationBell：通知铃铛，显示未读数量徽章
- NotificationDropdown：下拉通知列表
- NotificationItem：单个通知项
- useNotifications：获取通知、标记已读
- useUnreadCount：获取未读数量

---

## 代码风格规范

### Python (FastAPI)
```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..db.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    # ... 字段定义
```

### TypeScript (React)
```tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Props {
  targetType: string;
  targetId: string;
}

export const ComponentName: React.FC<Props> = ({ targetType, targetId }) => {
  const [data, setData] = useState<DataType | null>(null);

  return <div>...</div>;
};
```

### SQL
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- ... 其他字段
);

CREATE INDEX idx_name ON table_name (column);
```

---

## 集成流程

生成文件后，告诉用户：

1. **数据库迁移**
   ```bash
   cd backend && alembic upgrade head
   ```

2. **注册路由**（在 `backend/app/api/router.py`）
   ```python
   from .comment import router as comment_router
   router.include_router(comment_router)
   ```

3. **使用组件**（在 React 页面中）
   ```tsx
   import { CommentList } from '../components/CommentList';
   // 使用组件
   ```

4. **测试功能**
   - 验证 API 端点
   - 测试前端交互

---

## 错误处理

如果当前目录缺少必要结构：
- 缺少 `backend/` 目录 → 提示用户并创建基础结构
- 缺少 `frontend/src/` 目录 → 提示用户并创建基础结构
- 询问用户是否要创建缺失的目录

---

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件（如注册路由）
- `Bash` — **必须**，用于安装依赖和启动服务（`--run` 选项）