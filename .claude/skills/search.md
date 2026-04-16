---
name: search
description: 搜索功能模块
---

# /search — 搜索功能

生成搜索功能的完整代码。

## 调用方式

```
/search --选项
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
/search                 # 预览搜索模块代码
/search --write        # 生成并写入
/search --run          # 生成 + 写入 + 安装 + 运行
```

## 生成内容

**后端：** Search API 路由（支持多表搜索）
**前端：** SearchBar、SearchResults 组件、useSearch Hook
**数据库：** 全文搜索索引

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建新文件
- `Edit` — 修改文件
- `Bash` — 运行服务（`--run` 时）