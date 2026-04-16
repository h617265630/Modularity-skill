---
name: notification
description: 实时通知系统模块
---

# /notification — 通知系统

生成实时通知的完整代码。

## 调用方式

```
/notification --选项
```

## 选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览变更，不写入文件（默认） |
| `--write` | 生成代码并写入文件 |
| `--run` | 生成代码 + 写入文件 + 安装依赖 + 运行 |
| `--force` | 强制覆盖已存在的文件 |

## 示例

```bash
/notification               # 预览通知模块代码
/notification --write      # 生成并写入
/notification --run        # 生成 + 写入 + 安装 + 运行
```

## 生成内容

**后端：** Notification + NotificationSetting 模型、CRUD、API 路由
**前端：** NotificationBell、NotificationDropdown、NotificationItem 组件、useNotifications Hook
**数据库：** notifications + notification_settings 表迁移

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）