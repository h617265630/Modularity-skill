# Modularity Skill

AI全栈模块编译器 - 将功能命令转换为完整的全栈模块实现，并自动写入项目文件。

## 核心能力

1. **项目自动检测** - 自动识别项目类型（FastAPI/Express/Next.js/Nuxt）
2. **代码生成** - 生成完整的 Backend + Frontend + Database 代码
3. **文件写入** - 自动将代码写入项目目录（干跑模式预览）
4. **代码验证** - 可选的 lint + test 验证流程

## 使用方式

```
/<module-name> [选项]
/<module-name> <module-name> <module-name>... [选项]  # 批量添加
```

## 支持的模块

| 命令 | 功能 | API数 | 数据库表 | 前端组件 |
|------|------|-------|----------|----------|
| `/comment-m` | 多级评论系统 | 5 | 1 | 3 |
| `/like` | 点赞功能 | 4 | 1 | 2 |
| `/follow` | 关注系统 | 6 | 1 | 4 |
| `/notification` | 通知系统 | 7 | 2 | 5 |
| `/user-m` | 用户系统 | 8 | 2 | 5 |
| `/post-m` | 帖子系统 | 6 | 1 | 4 |
| `/search` | 搜索功能 | 5 | 1 | 3 |
| `/message` | 私信系统 | 6 | 2 | 4 |

## 选项

- `--verify` - 启用代码验证（运行 lint + test）
- `--write` - 将代码写入项目文件（默认干跑模式）
- `--run` - 生成代码 + 写入文件 + 自动安装依赖 + 自动运行
- `--dry-run` - 预览变更，不实际写入（默认）
- `--force` - 强制写入，覆盖已存在的文件
- `--language <python|typescript>` - 指定后端语言
- `--frontend <react|vue|nextjs>` - 指定前端框架

## 使用示例

```
/comment-m                                    # 生成评论模块代码
/comment-m --write                            # 生成并写入文件
/comment-m --verify                           # 生成并验证
/comment-m --verify --write --force           # 完整流程：生成+验证+写入
/comment-m --run                              # 生成+写入+安装依赖+运行服务
/like --dry-run                               # 只预览，不写入

# 批量添加（推荐）
/like /follow /comment-m --write               # 一次性添加多个模块
/like /follow /comment-m /notification --run  # 批量添加并运行
```

## 自动检测

CLI 启动时自动检测项目类型：

| 检测到 | Backend | Frontend |
|--------|---------|----------|
| `pyproject.toml` + `fastapi` | FastAPI | - |
| `requirements.txt` + `fastapi` | FastAPI | - |
| `package.json` + `next` | - | Next.js |
| `package.json` + `express` | Express | React |
| `package.json` + `vue` | Express | Vue |
| Monorepo | 自动检测 backend/frontend 目录 | - |

## 文件写入

生成代码时自动适配项目结构：

```
检测到 FastAPI + React 项目:
├── backend/
│   └── app/
│       ├── api/          → 创建路由文件
│       ├── models/       → 创建模型文件
│       ├── services/     → 创建服务文件
│       └── cruds/        → 创建 CRUD 文件
├── frontend/
│   └── src/
│       ├── components/   → 创建组件
│       └── hooks/        → 创建 Hook
└── migrations/           → 创建数据库迁移
```

## 验证流程（--verify）

1. 生成测试代码
2. 运行 pytest/vitest
3. 运行 pylint/eslint
4. 运行 mypy/tsc 类型检查
5. AI 自动修复失败的测试（最多3次重试）

## 前置依赖

### 必须
- Node.js >= 18.0.0
- npm >= 9.0.0

### 可选（--verify 时需要）

**Python:**
```bash
pip install pylint black mypy pytest pytest-asyncio httpx
```

**TypeScript:**
```bash
npm install -g eslint typescript
npx vitest  # 或 jest
```

## 项目适配

自动适配以下技术栈：

**Backend:**
- FastAPI + SQLAlchemy + PostgreSQL
- Express + Sequelize + PostgreSQL

**Frontend:**
- React 18 + TypeScript + Zustand
- Vue 3 + TypeScript + Pinia
- Next.js 14 + TypeScript
- Nuxt 3 + TypeScript

## 保护路径

以下路径不会被修改：

```
node_modules, .git, dist, build, .env*, secrets, passwords, config.prod
```

## CLI 用法

```bash
# 基本使用
npx modularity-skill /comment-m

# 预览但不写入
npx modularity-skill /like --dry-run

# 生成并写入
npx modularity-skill /follow --write

# 生成+写入+自动安装依赖并运行
npx modularity-skill /like --run

# 批量添加多个模块（一次性完成）
npx modularity-skill /like /follow /comment-m --write
npx modularity-skill /like /follow /comment-m /notification --run

# 完整流程
npx modularity-skill /notification --verify --write --force
```

## API 用法

```typescript
import { compileFeature, detectProject, FileWriter } from 'modularity-skill';

// 检测项目
const project = await detectProject();
console.log(project.type); // 'fastapi', 'express', 'nextjs', etc.

// 编译模块
const result = await compileFeature('/comment-m', {
  verify: true,
  language: 'python'
});

// 写入文件
const writer = new FileWriter('/path/to/project', false);
await writer.writeBackend(patches);
```
