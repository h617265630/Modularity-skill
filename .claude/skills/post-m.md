---
name: post-m
description: 帖子系统模块
---

# /post-m — 帖子系统

生成帖子 CRUD 的完整代码。

## 调用方式

```
/post-m --选项
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
/post-m                 # 预览帖子模块代码
/post-m --write        # 生成并写入
/post-m --run          # 生成 + 写入 + 安装 + 运行
```

## 生成内容

**后端：** Post 模型、CRUD、API 路由
**前端：** PostList、PostItem、PostInput 组件、usePosts Hook
**数据库：** posts 表迁移

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）