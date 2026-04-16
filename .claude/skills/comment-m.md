---
name: comment-m
description: 多层评论系统模块
---

# /comment-m — 评论系统

生成多层嵌套评论的完整代码。

## 调用方式

```
/comment-m --选项
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
/comment-m               # 预览评论模块代码
/comment-m --write      # 生成并写入
/comment-m --run        # 生成 + 写入 + 安装 + 运行
/like /follow /comment-m --write # 批量生成
```

## 生成内容

**后端：** Comment 模型、CRUD、API 路由
**前端：** CommentList、CommentItem、CommentInput 组件、useComments Hook
**数据库：** comments 表迁移

## 详细规格

- 支持嵌套回复，最大深度 3 层
- 字段：id, content, user_id, target_type, target_id, parent_id, reply_count, is_edited

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）