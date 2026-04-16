# Modularity-skill 项目说明文档

## 项目概述

Modularity-skill 是一个模块化网页功能编译器，通过声明式 JSON 模板定义功能模块，自动生成完整的前后端代码。

### 核心价值

- **声明式开发**：通过 JSON 描述功能，自动生成代码
- **模块解耦**：每个模块独立，无硬依赖，可单独部署
- **统一规范**：统一的分页、响应格式、审计字段
- **快速迭代**：新增功能只需定义模板，无需重复搭建基础设施

---

## 目录结构

```
Modularity-skill/
├── src/
│   ├── templates/          # 功能模块 JSON 模板
│   │   ├── _shared.json   # 共享约定配置
│   │   ├── user-m.json    # 用户系统
│   │   ├── post-m.json    # 文章系统
│   │   ├── comment-m.json # 评论系统
│   │   └── ...            # 其他模块 (共 30 个)
│   ├── compiler/          # 编译器逻辑
│   │   ├── generator.py   # 代码生成器
│   │   ├── parser.py      # 模板解析器
│   │   └── validator.py   # 配置校验器
│   └── output/            # 生成的代码输出
├── project_description.md  # 本文档
└── README.md
```

---

## 模块模板结构

每个模块 JSON 文件包含 6 个顶层字段：

### 1. command

模块调用命令，如 `/post-m`

```json
{
  "command": "/post-m"
}
```

### 2. feature_name

功能唯一标识符

```json
{
  "feature_name": "post_system"
}
```

### 3. backend

后端定义，包含路由、服务、数据模型

```json
{
  "backend": {
    "routes": [...],      // API 路由定义
    "services": [...],    // 业务逻辑服务
    "models": [...],      // 数据库模型
    "curds": [...]        // CRUD 操作
  }
}
```

#### 3.1 routes（API 路由）

| 字段 | 类型 | 说明 |
|-----|------|------|
| method | string | HTTP 方法 (GET/POST/PATCH/DELETE) |
| path | string | 路由路径 |
| handler_name | string | 处理函数名 |
| auth_required | boolean | 是否需要认证 |
| pagination | string | 分页类型 (`cursor`) |

#### 3.2 services（服务层）

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | 服务类名 |
| description | string | 服务描述 |
| methods | array | 方法列表 |

#### 3.3 models（数据模型）

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | 模型名 |
| table_name | string | 表名 |
| fields | array | 字段列表 |

**字段定义：**

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | 字段名 |
| type | string | 类型 (integer/string/text/boolean/datetime/json) |
| nullable | boolean | 是否可空 |
| default | string | 默认值 |
| foreign_key | string | 外键关联 (如 `users.id`) |
| index | boolean | 是否建索引 |

#### 3.4 curds（CRUD 操作）

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | CRUD 实例名 |
| model_name | string | 关联的模型名 |
| operations | array | 支持的操作 (create/read/update/delete) |

### 4. frontend

前端定义，包含组件、Hooks、页面

```json
{
  "frontend": {
    "components": [...],  // React 组件
    "hooks": [...],        // 自定义 Hooks
    "pages": [...]        // 页面路由
  }
}
```

#### 4.1 components

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | 组件名 |
| description | string | 组件描述 |
| props | array | Props 定义 |

#### 4.2 hooks

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | Hook 名 |
| description | string | Hook 描述 |
| returns | string | 返回值类型 |

#### 4.3 pages

| 字段 | 类型 | 说明 |
|-----|------|------|
| name | string | 页面组件名 |
| route | string | 路由路径 |
| description | string | 页面描述 |

### 5. database

数据库表结构定义

```json
{
  "database": {
    "tables": [...],      // 表定义
    "migrations": [...]   // 迁移脚本
  }
}
```

### 6. integration

集成说明

```json
{
  "integration": {
    "steps": [...],       // 集成步骤
    "config_needed": [...] // 需要配置项
  }
}
```

---

## 共享约定 (_shared.json)

所有模块必须遵循的统一规范：

### 分页规范

```json
{
  "pagination": {
    "type": "cursor",
    "query_params": ["cursor", "limit", "order_by", "order"]
  }
}
```

- 使用 cursor 分页替代 offset
- 查询参数：`cursor`, `limit`, `order_by`, `order`

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": "any",
  "meta": {},
  "error": null
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

### 审计字段

所有表都包含以下审计字段：

| 字段 | 类型 | 说明 |
|-----|------|------|
| created_by | integer | 创建人 ID |
| updated_by | integer | 更新人 ID |

---

## 使用方式

### 1. 查看可用模块

```
/user-m       - 用户系统
/post-m      - 文章系统
/comment-m    - 评论系统
/like         - 点赞系统
/follow       - 关注系统
/notification - 通知系统
/dm-m         - 私信系统
...           - 共 30 个模块
```

### 2. 编译单个模块

```bash
python -m src.compiler /post-m
```

### 3. 编译所有模块

```bash
python -m src.compiler --all
```

### 4. 生成的文件结构

```
output/
├── backend/
│   └── app/
│       ├── api/
│       │   └── routes/
│       │       └── post_routes.py
│       ├── db/
│       │   └── models/
│       │       └── post.py
│       ├── cruds/
│       │   └── post_crud.py
│       └── services/
│           └── post_service.py
├── frontend/
│   └── src/
│       ├── components/
│       │   └── PostList.tsx
│       ├── hooks/
│       │   └── usePosts.ts
│       ├── pages/
│       │   └── PostsPage.tsx
│       └── services/
│           └── posts.ts
└── migrations/
    └── 001_create_posts_table.sql
```

---

## 实现流程

### 代码生成流程

```
JSON 模板
    ↓
解析器 (parser.py) 验证模板结构
    ↓
提取 backend/frontend/database 配置
    ↓
生成器 (generator.py) 根据模板生成代码
    ↓
输出到对应目录
```

### 模块依赖关系

```
用户系统 (user-m)           ← 基础依赖，所有模块依赖用户表
├── 登录注册 (auth-m)
├── 修改密码 (password-m)
├── 修改头像 (avatar-m)      ← 依赖 media-m
└── 登录日志 (login-log-m)

内容系统
├── 文章 (post-m)            ← 依赖 user-m
├── 分类标签 (category-tag-m)
├── 富媒体 (media-m)
└── 草稿箱 (draft-m)         ← 依赖 post-m

互动系统
├── 评论 (comment-m)         ← 依赖 user-m, post-m
├── 点赞 (like)              ← 已废弃，由 interaction-m 替代
├── 收藏 (favorite-m)        ← 依赖 user-m, post-m
├── 分享 (share-m)          ← 已废弃，由 interaction-m 替代
└── 评分 (rating)            ← 由 interaction-m 统一

社交系统
├── 关注 (follow)            ← 依赖 user-m
├── 好友 (friend-m)          ← 依赖 user-m
├── 黑名单 (block-m)         ← 依赖 user-m
└── @提及 (mention-m)        ← 依赖 user-m

消息系统
├── 通知 (notification)      ← 依赖 user-m
├── 私信 (dm-m)              ← 依赖 user-m
└── 系统公告 (announcement-m) ← 依赖 user-m

权限与审核
├── 举报 (report-m)          ← 依赖 user-m
├── 审核 (moderation-m)      ← 依赖 user-m, report-m
└── RBAC (rbac-m)            ← 依赖 user-m
```

---

## 模块清单

### 第一优先级 (P1) - 社交互动

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /comment-m | 多级评论系统 | 1 | 5 | 3 |
| /follow | 关注/粉丝系统 | 1 | 6 | 4 |
| /notification | 通知系统 | 2 | 7 | 5 |

### 第二优先级 (P2) - 内容管理

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /post-m | 文章发布系统 | 2 | 6 | 4 |
| /category-tag-m | 分类标签系统 | 2 | 4 | 2 |
| /media-m | 富媒体上传 | 1 | 5 | 3 |
| /draft-m | 草稿箱 | 1 | 3 | 2 |
| /interaction-m | 统一互动(赞/藏/分享) | 1 | 5 | 3 |

### 第三优先级 (P3) - 用户账号

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /user-m | 用户系统 | 2 | 8 | 5 |
| /auth-m | 登录注册 | 0 | 4 | 2 |
| /password-m | 修改密码 | 0 | 2 | 1 |
| /avatar-m | 修改头像 | 0 | 2 | 1 |
| /login-log-m | 登录日志 | 1 | 2 | 1 |

### 第四优先级 (P4) - 社交关系

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /friend-m | 好友系统 | 2 | 6 | 3 |
| /block-m | 黑名单 | 1 | 3 | 2 |
| /mention-m | @提及系统 | 1 | 3 | 2 |

### 第五优先级 (P5) - 消息通知

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /dm-m | 私信系统 | 3 | 6 | 4 |
| /announcement-m | 系统公告 | 1 | 3 | 2 |

### 第六优先级 (P6) - 审核权限

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /report-m | 举报系统 | 1 | 4 | 2 |
| /moderation-m | 审核队列 | 1 | 5 | 3 |
| /rbac-m | 角色权限 | 3 | 5 | 3 |

### 第七优先级 (P7) - 搜索统计

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /search-m | 全文搜索 | 1 | 3 | 2 |
| /hot-search-m | 热搜榜 | 1 | 3 | 2 |
| /analytics-m | 数据看板 | 2 | 6 | 4 |

### 第八优先级 (P8) - 高级功能

| 命令 | 功能 | 表数量 | API 数 | 组件数 |
|------|------|--------|--------|--------|
| /checkin-m | 每日签到 | 1 | 3 | 2 |
| /task-m | 任务系统 | 2 | 5 | 3 |
| /note-m | 笔记系统 | 2 | 5 | 3 |

---

## 开发规范

### 1. 模块独立性

- 模块不硬编码其他模块的字段
- 使用外键关联而非字段复制
- 跨模块通信通过 API 而非直接查询

### 2. 命名规范

- 模型名：PascalCase (如 `Announcement`)
- 表名：snake_case 复数 (如 `announcements`)
- 字段名：snake_case (如 `created_at`)
- 组件名：PascalCase (如 `AnnouncementList`)

### 3. 审计字段

所有表必须包含：
```sql
created_by integer references users(id)
updated_by integer references users(id)
```

### 4. 分页规范

列表 API 必须支持 cursor 分页：
```
GET /items?cursor=xxx&limit=20&order_by=created_at&order=desc
```

### 5. 软删除

支持软删除的模块在表中包含 `deleted_at` 字段

---

## 配置说明

### 必需配置

1. **数据库连接**
   ```json
   {
     "database": {
       "host": "localhost",
       "port": 5432,
       "name": "modularity_db"
     }
   }
   ```

2. **文件存储** (media-m)
   ```json
   {
     "storage": {
       "type": "local|s3|cloudinary",
       "path": "/uploads"
     }
   }
   ```

### 可选配置

1. **第三方服务**
   - 邮件服务 (password-m, notification)
   - 推送服务 (notification)
   - AI 服务 (analytics-m)

2. **缓存**
   ```json
   {
     "cache": {
       "type": "redis",
       "ttl": 3600
     }
   }
   ```

---

## 常见问题

### Q: 如何新增一个模块？

1. 在 `src/templates/` 创建 `xxx-m.json`
2. 定义 backend/frontend/database 配置
3. 运行编译器生成代码
4. 执行数据库迁移

### Q: 模块间有依赖怎么办？

在模块中声明依赖关系：
```json
{
  "dependencies": ["media-m"],
  "description": "Avatar management - reuses media-m for file storage"
}
```

### Q: 如何废弃旧模块？

在模块中标记 deprecated：
```json
{
  "deprecated": true,
  "replaced_by": "interaction-m"
}
```

---

## 更新日志

- **v1.0** - 初始版本，支持 30 个常用网页模块
- **v1.1** - 添加 cursor 分页支持
- **v1.2** - 统一审计字段 (created_by, updated_by)
- **v1.3** - 解耦模块依赖，添加 deprecated 标记
