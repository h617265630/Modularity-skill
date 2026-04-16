---
name: follow
description: 用户关注系统模块
---

# /follow — 关注系统

生成用户关注/取消关注的完整代码。

## 调用方式

```
/follow --选项
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
/follow                # 预览关注模块代码
/follow --write       # 生成并写入
/follow --run         # 生成 + 写入 + 安装 + 运行
/like /follow --write # 批量生成
```

## 生成内容

**后端：** Follow 模型、CRUD、API 路由
**前端：** FollowButton、FollowersList、FollowingList 组件、useFollow Hook
**数据库：** follows 表迁移

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）