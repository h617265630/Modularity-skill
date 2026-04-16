# Modularity-Skill - AI 全栈模块编译器

**AI 驱动的命令行工具** - 将功能命令转换为完整的全栈模块实现（Backend API + Frontend 组件）。

## 一句话概括

用命令自动生成 FastAPI 后端 + React 前端组件。

## 核心功能

```
用户输入: /comment-m          AI 输出: 完整的评论系统
                              ├── Backend API (FastAPI + SQLAlchemy)
                              ├── Database (PostgreSQL + Alembic 迁移)
                              └── Frontend (React + TypeScript + shadcn/ui)
```

## 特性

- **一键生成模块**: `npx modularity-skill /comment-m`
- **全栈输出**: 后端 API + 数据库结构 + 前端组件
- **智能集成**: `/attach-um` 扫描现有前端代码并生成匹配的后端
- **项目脚手架**: `npx modularity-skill init` 创建完整项目结构
- **干跑模式**: 预览变更后再实际写入文件

## 快速开始

```bash
# 安装
npm install
npm run build

# 创建新项目
npx modularity-skill init --project-name=myapp

# 添加模块
npx modularity-skill /comment-m --write
npx modularity-skill /like /follow /post-m --write

# 扫描已有前端并生成后端
npx modularity-skill /attach-um --write
```

## 支持的模块

| 命令 | 功能 | 后端路由 | 数据库表 | 前端组件 |
|------|------|---------|---------|---------|
| `/comment-m` | 多级评论系统 | 5 | 1 | 3 |
| `/like` | 点赞功能 | 4 | 1 | 2 |
| `/follow` | 关注系统 | 6 | 1 | 4 |
| `/notification` | 通知系统 | 7 | 2 | 5 |
| `/post-m` | 帖子系统 | 6 | 1 | 4 |
| `/user-m` | 用户系统 | 8 | 2 | 5 |

## 核心命令

### `init` - 创建新项目

```bash
npx modularity-skill init --project-name=myapp --target=./myapp
```

创建完整的全栈项目，包含：
- **后端**: FastAPI + SQLAlchemy + Alembic
- **前端**: Next.js + shadcn/ui + TypeScript
- **数据库**: PostgreSQL + docker-compose
- **认证**: JWT 认证就绪

### `/<module>` - 添加模块

```bash
# 仅预览（干跑）
npx modularity-skill /comment-m

# 写入文件
npx modularity-skill /comment-m --write

# 带验证
npx modularity-skill /comment-m --verify --write

# 多个模块
npx modularity-skill /comment-m /like /follow --write
```

### `/attach-um` - 接入已有前端

扫描现有前端代码，检测 hooks 和组件，生成匹配的后端：

```bash
# 扫描并预览
npx modularity-skill /attach-um

# 扫描并写入
npx modularity-skill /attach-um --write

# 指定自定义目录
npx modularity-skill /attach-um --hooks-dir=src/store/hooks --components-dir=src/features
```

## CLI 选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览变更，不写入文件（默认） |
| `--write, -w` | 将生成的文件写入项目 |
| `--verify, -v` | 运行验证（lint + 测试） |
| `--run, -r` | 写入文件并启动服务 |
| `--force` | 强制覆盖已存在的文件 |
| `--target=<path>` | 项目路径（默认当前目录） |
| `--hooks-dir=<path>` | 自定义 hooks 目录 |
| `--components-dir=<path>` | 自定义组件目录 |
| `--api-dir=<path>` | 自定义 API 服务目录 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + SQLAlchemy + PostgreSQL |
| 前端 | React + TypeScript + shadcn/ui |
| 数据库 | PostgreSQL + Alembic |
| 认证 | JWT |

## 安装顺序

推荐安装顺序（自动计算）：

```
1. /user-m         → 提供用户表和认证
2. /post-m         → 帖子系统
3. /comment-m      → 依赖 /post-m
4. /like           → 依赖 /post-m 和 /user-m
5. /follow         → 依赖 /user-m
6. /notification    → 依赖 /user-m
```

## License

MIT
