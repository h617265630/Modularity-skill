---
name: user-m
description: 用户系统模块
---

# /user-m — 用户系统

生成用户管理的完整代码。

## 调用方式

```
/user-m --选项
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
/user-m                 # 预览用户模块代码
/user-m --write        # 生成并写入
/user-m --run          # 生成 + 写入 + 安装 + 运行
```

## 生成内容

**后端：** User 模型、CRUD、API 路由（注册/登录/资料）
**前端：** UserProfile、UserList 组件、useUsers Hook
**数据库：** users 表迁移

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）