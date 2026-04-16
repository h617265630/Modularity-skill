---
name: like
description: 点赞/取消点赞功能模块
---

# /like — 点赞功能

生成点赞/取消点赞的完整代码。

## 调用方式

```
/like --选项
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
/like                 # 预览点赞模块代码
/like --write         # 生成并写入
/like --run           # 生成 + 写入 + 安装 + 运行
/like /follow --write # 批量生成
```

## 生成内容

**后端：** Like 模型、CRUD、API 路由
**前端：** LikeButton、LikeCount 组件、useLike Hook
**数据库：** likes 表迁移

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）