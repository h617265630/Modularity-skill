---
name: notification
description: 通知系统模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /notification — 通知系统模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/notification` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /notification --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /notification
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的通知相关前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /notification --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /notification --write --run
```

## 前端修改

检测到前端代码后，会自动修改以下文件对接后端 API：

| 文件类型 | 修改内容 |
|----------|----------|
| NotificationBell | 替换通知列表 API URL |
| NotificationList | 替换通知列表 API URL |
| Notification Hooks | 替换 baseURL 和端点路径 |
| Notification APIs | 替换 baseURL 和端点路径 |

## 前端检测逻辑

`/notification` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 通知铃铛 | hooks/useNotifications.ts, components/NotificationBell.tsx |
| 通知列表 | hooks/useNotificationList.ts, components/NotificationList.tsx |
| 通知设置 | hooks/useNotificationSettings.ts, components/NotificationSettings.tsx |

## 生成内容

**后端：**
- `backend/app/models/notification.py` — Notification 模型
- `backend/app/models/notification_setting.py` — NotificationSetting 模型
- `backend/app/schemas/notification.py` — Pydantic schemas
- `backend/app/cruds/notification.py` — CRUD 操作
- `backend/app/api/routes/notification.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| PUT | /api/notifications/{id}/read | 标记已读 |
| PUT | /api/notifications/read-all | 全部标记已读 |
| DELETE | /api/notifications/{id} | 删除通知 |
| GET | /api/notification-settings | 获取通知设置 |
| PUT | /api/notification-settings | 更新通知设置 |

**数据库：**
- `notifications` 表（id, user_id, type, title, content, is_read, created_at）
- `notification_settings` 表（id, user_id, email_enabled, push_enabled, types）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/notificationAdapter.ts` — API 适配器（如果路径不匹配）
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
你：/notification
Claude：运行 npx modularity-skill /notification 并展示结果

你：/notification --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
