# Modularity-skill - Feature Compiler AI

**AI驱动的全栈模块编译器** - 将功能命令转换为完整的全栈模块实现（Backend API + Database + Frontend）

## 前置条件

使用本项目前，请确保已安装以下依赖：

### Node.js
- Node.js >= 18.0.0
- npm >= 9.0.0

### Python 依赖（用于代码验证）

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 或者单独安装
pip install pylint black mypy pytest pytest-asyncio httpx
```

### 可选工具

**TypeScript 验证：**
```bash
npm install -g eslint typescript
npx vitest  # 或 jest
```

## 核心功能

```
用户输入: /comment-m          AI 输出: 完整的评论系统
                              ├── Backend API (FastAPI + SQLAlchemy)
                              ├── Database (PostgreSQL + Alembic)
                              └── Frontend (React + TypeScript)
```

## 安装

```bash
# 克隆项目
git clone <repo-url>
cd modularity-skill

# 安装 Node.js 依赖
npm install

# 编译 TypeScript
npm run build

# 安装 Python 依赖（可选，用于验证功能）
pip install -r requirements.txt
```

## 快速开始

```bash
# 编译单个模块
npx modularity-skill /comment-m

# 编译并验证（需要 Python 依赖）
npx modularity-skill /like
```

## 代码中使用

```typescript
import { compileFeature } from 'modularity-skill';

// 基础使用
const result = await compileFeature('/comment-m');

// 启用验证流程（需要 pip install -r requirements.txt）
const result = await compileFeature('/comment-m', {
  verify: true,
  language: 'python'
});
```

## 系统架构

### 三层安全系统

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Orchestrator                      │
│              (统一编排器，整合所有子系统)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ System State │  │  Dependency   │  │     Patch     │     │
│  │    Graph     │  │    Graph      │  │   Validator   │     │
│  │              │  │              │  │               │     │
│  │ • Schema     │  │ • Feature     │  │ • Diff Check  │     │
│  │ • API Graph  │  │   Deps        │  │ • Type Check  │     │
│  │ • Feature    │  │ • Conflict    │  │ • Route Check │     │
│  │   Registry   │  │   Detection   │  │               │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Execution   │  │   Snapshot    │                        │
│  │   Sandbox    │  │     Rollback  │                        │
│  │              │  │               │                        │
│  │ • Dry-run    │  │ • System Snap │                        │
│  │ • Staged     │  │ • Full/Partial│                        │
│  │ • Production  │  │   Rollback   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. System State Graph - 系统状态图

记录全局状态，防止隐性耦合爆炸。

**功能**：
- 追踪所有已安装的 schema、API、feature
- 检测路由冲突（exact + pattern）
- 检测循环依赖
- 拓扑排序确定安装顺序

### 2. Dependency Graph - 依赖图

分析和管理 feature 之间的依赖关系。

**功能**：
- 推断直接/传递依赖
- 检测字段类型冲突
- 检测 API 路由冲突
- 生成安装计划

### 3. Patch Validator - 补丁验证层

每个 feature 必须经过三重验证。

**验证项**：
- **Diff Check**: 文件创建/修改分析
- **Type Check**: 前后端类型一致性
- **Route Conflict Check**: API 路由冲突检测
- **Schema Validation**: 表结构合法性

### 4. Execution Sandbox - 执行沙箱

防止直接污染 production codebase。

**三种模式**：
| 模式 | 行为 | 适用场景 |
|------|------|----------|
| `dry-run` | 只验证，不修改 | 开发调试 |
| `staged` | 暂存修改，等待确认 | Code Review |
| `production` | 实际执行 | 正式部署 |

**保护路径**（无法被修改）：
```
**/node_modules/**  **/.git/**  **/dist/**  **/.env*
**/secrets/**  **/password*  **/config.prod*
```

### 5. Snapshot & Rollback - 快照与回滚

记录系统状态，支持回滚。

**三种回滚策略**：
- **full**: 完全回滚到指定快照
- **feature-only**: 只回滚 feature，保留 schema
- **schema-only**: 只回滚 schema，保留 feature

## 支持的功能模块

| 命令 | 功能 | API 路由 | 数据库表 | 前端组件 |
|------|------|----------|----------|----------|
| `/user-m` | 用户系统 | 8 | 2 (users, user_profiles) | 5 |
| `/comment-m` | 多级评论系统 | 5 | 1 (comments) | 3 |
| `/like` | 点赞功能 | 4 | 1 (likes) | 2 |
| `/follow` | 关注系统 | 6 | 1 (follows) | 4 |
| `/notification` | 通知系统 | 7 | 2 (notifications, notification_settings) | 5 |

## 使用示例

### 基本使用

```typescript
import { FeatureOrchestrator } from './core/orchestrator.js';

// 创建编排器
const orchestrator = new FeatureOrchestrator({
  sandbox_mode: 'dry-run',  // 默认干跑模式
  auto_snapshot: true,
});

// 预览 Feature
const preview = await orchestrator.previewFeature('/comment-m');
console.log(preview);

// 编译 Feature
const result = await orchestrator.compileFeature('/comment-m');
console.log(result.success);

// 回滚
const rollback = orchestrator.rollbackToPrevious();
```

### 完整工作流

```typescript
// 1. 创建编排器
const orchestrator = new FeatureOrchestrator({
  sandbox_mode: 'staged',  // 暂存模式
  auto_snapshot: true,
});

// 2. 预览变更
const preview = await orchestrator.previewFeature('/comment-m');
console.log(preview.preview);

// 3. 编译并安装
const result = await orchestrator.compileFeature('/comment-m');

// 4. 检查结果
if (result.success) {
  console.log('✅ Feature installed');
  console.log('Tables:', result.state_graph.tables);
  console.log('APIs:', result.state_graph.apis);
} else {
  console.log('❌ Failed:', result.error);
  console.log('Validation errors:', result.validation.errors);
}

// 5. 如果需要回滚
if (result.rollback_available) {
  orchestrator.rollbackToPrevious();
}
```

### 系统状态查询

```typescript
// 获取完整报告
console.log(orchestrator.generateSystemReport());

// 获取特定表的信息
const table = orchestrator.getTable('comments');
console.log(table.fields);

// 获取特定 API
const api = orchestrator.getApi('POST', '/comments');
console.log(api.handler_name);

// 检测冲突
const conflicts = orchestrator.getRouteConflicts();
const cycles = orchestrator.getCircularDependencies();
const sharedTables = orchestrator.getSharedTables();
```

## 生成代码示例

### Backend API (FastAPI)

```python
# backend/app/api/comment.py
router = APIRouter(prefix="/comment", tags=["comment"])

@router.post("/comments", response_model=CommentResponse)
async def create_comment(
    obj_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new comment"""
    return Comment_crud.create(db, obj_in)

@router.get("/comments/{id}", response_model=CommentResponse)
async def get_comment(id: int, db: Session = Depends(get_db)):
    """Get comment by ID"""
    obj = Comment_crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Comment not found")
    return obj
```

### Database (PostgreSQL)

```sql
-- Migration: Create table comments
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(255) NOT NULL,
    target_id INTEGER NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reply_count INTEGER NOT NULL DEFAULT 0,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_target ON comments (target_type, target_id);
CREATE INDEX idx_comments_parent ON comments (parent_id);
```

## 安装顺序

**推荐安装顺序**（系统自动计算）：

```
1. /user-m         → 提供 users 表和用户认证
2. /comment-m      → 依赖 users 表
3. /like           → 依赖 users 表
4. /follow         → 依赖 users 表
5. /notification   → 依赖 users 表
```

**依赖关系**：
- `/user-m` 是基础模块，无依赖
- 其他所有模块都依赖 `/user-m` 提供的 `users` 表

## API

### FeatureOrchestrator

```typescript
class FeatureOrchestrator {
  compileFeature(command: string, options?): Promise<OrchestratedCompileResult>
  previewFeature(command: string): Promise<PreviewResult | null>
  rollbackTo(snapshotId: string, strategy?): RollbackResult
  rollbackToPrevious(): RollbackResult
  getSystemStatus(): SystemStatusReport
  getTable(name: string): SchemaNode | undefined
  getApi(method: string, path: string): ApiNode | undefined
  getFeature(id: string): FeatureNode | undefined
  getSharedTables(): SharedTable[]
  getRouteConflicts(): RouteConflict[]
  getCircularDependencies(): CircularDep[]
  generateSystemReport(): string
}
```

## 运行测试

```bash
# 编译
npx tsc

# 测试所有模块
node dist/test-templates.js

# 运行完整系统测试
node dist/test-full.js

# 耦合问题分析
node dist/test-coupling.js
```

## 项目结构

```
src/
├── core/
│   ├── compiler.ts      # 核心编译器
│   ├── orchestrator.ts  # 编排器
│   ├── state-graph.ts    # 系统状态图
│   ├── dependency-graph.ts # 依赖图
│   ├── patch-validator.ts # 补丁验证
│   ├── sandbox.ts        # 执行沙箱
│   ├── snapshot.ts       # 快照系统
│   └── types.ts          # 类型定义
├── generators/
│   ├── backend.ts        # 后端代码生成
│   ├── frontend.ts       # 前端代码生成
│   └── database.ts       # 数据库代码生成
└── templates/
    ├── index.ts          # 模板索引
    ├── comment-m.json    # 评论模块模板
    ├── like.json         # 点赞模块模板
    ├── follow.json       # 关注模块模板
    └── notification.json # 通知模块模板
```

## License

MIT
