---
name: readytorun
description: 一键安装项目依赖并启动服务（代码已存在时使用）
---

# /readytorun — 一键启动

假设项目代码已存在，直接安装依赖并启动服务。

## 使用场景

- 代码已经存在（之前用 `--write` 生成过）
- 只是需要重新安装依赖或启动服务
- 项目代码手动修改过，需要快速启动

## 调用方式

```
/readytorun
```

## 执行流程

1. **检测项目类型** — 扫描 `package.json`、`requirements.txt`、`pyproject.toml` 等
2. **安装依赖** — 根据项目类型执行对应安装命令
3. **运行数据库迁移** — 如果有 `alembic`，执行 `alembic upgrade head`
4. **启动服务** — 后台运行服务

## 检测与运行

### 项目类型判断

| 检测到 | 安装命令 | 启动命令 |
|--------|---------|---------|
| `requirements.txt` | `pip install -r requirements.txt` | `uvicorn app.main:app --reload` |
| `pyproject.toml` | `pip install -e .` | `uvicorn app.main:app --reload` |
| `package.json` | `npm install` | `npm run dev` |
| `backend/` + `frontend/` | 先 backend 后 frontend | 两者都启动 |

### 检测逻辑

```
扫描项目目录 → 确定项目类型 → 选择安装命令 → 选择启动命令
```

1. 检查 `pyproject.toml` → FastAPI 项目
2. 检查 `requirements.txt` → Python 项目
3. 检查 `package.json` → Node.js 项目
4. 检查 `backend/` + `frontend/` 目录 → Monorepo

### 目录结构处理

**Monorepo (backend/ + frontend/)：**
```bash
# 1. 安装后端依赖
cd backend
pip install -r requirements.txt  # 或 npm install

# 2. 安装前端依赖
cd ../frontend
npm install

# 3. 启动服务
cd ../backend && uvicorn app.main:app --reload --port 8000 &
cd ../frontend && npm run dev &
```

**FastAPI only：**
```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &
```

**Next.js/Express only：**
```bash
npm install
npm run dev &
```

## 输出格式

```
🔍 检测项目类型：Monorepo (FastAPI + Next.js)

📦 安装依赖中...
   ✓ pip install -r backend/requirements.txt
   ✓ npm install (frontend)
   ✓ alembic upgrade head

🚀 启动服务中...
   ✓ 后端已启动: http://localhost:8000
   ✓ 前端已启动: http://localhost:3000
   ✓ API 文档: http://localhost:8000/docs

✨ 项目已就绪！按 Ctrl+C 停止服务
```

## 错误处理

- **安装失败** → 输出具体错误信息，提示手动安装
- **端口被占用** → 自动尝试下一个端口（8001, 3001）
- **缺少依赖** → 提示安装必要工具（如 Node.js, Python）

## 与其他命令的区别

| 命令 | 生成代码 | 写入文件 | 安装依赖 | 运行服务 |
|------|---------|---------|---------|---------|
| `/like --run` | ✅ | ✅ | ✅ | ✅ |
| `/modularity-skill /like` | ✅ | ❌ | ❌ | ❌ |
| `/readytorun` | ❌ | ❌ | ✅ | ✅ |

## 需要的权限

- `Bash` — 安装依赖和启动服务（必须）
