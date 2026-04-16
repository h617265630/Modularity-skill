---
name: readytorun
description: 一键启动命令。假设代码已存在，直接安装依赖并启动服务（不生成代码）。
triggers:
  - ready to run
  - start project
  - run project
---

# /readytorun — 一键启动

代码已存在时，一键安装依赖并启动服务。

## 使用场景

- 代码已经存在（之前用 `--write` 生成过）
- 只是需要重新安装依赖或启动服务
- 项目代码手动修改过，需要快速启动

---

## 执行流程

1. 检测项目类型
2. 检查 FastAPI 配置是否使用 ReDoc（确保 /docs 不空白）
3. 安装依赖
4. 运行数据库迁移
5. 启动服务

---

## 项目类型检测与运行

### FastAPI 项目
```bash
# 检查是否已配置 ReDoc
if grep -q "redoc_url" backend/app/main.py; then
    echo "✓ FastAPI 配置正确"
else
    echo "⚠️ 警告：建议配置 redoc_url 修复 /docs 空白"
fi

# 安装依赖
cd backend && pip install -r requirements.txt

# 运行迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload --port 8000 &
```

### Next.js 项目
```bash
cd frontend && npm install
npm run dev &
```

### Monorepo (FastAPI + Next.js)
```bash
# 后端
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000 &

# 前端
cd ../frontend && npm install
npm run dev &
```

---

## 健康检查

### FastAPI 健康检查
```python
@app.get("/health")
def health_check():
    return {"status": "ok", "docs_available": True}
```

### 数据库连接检查
```python
@app.on_event("startup")
async def startup():
    try:
        db.execute("SELECT 1")
        logger.info("Database connected")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
```

---

## 输出示例

```
🔍 检测项目类型：Monorepo (FastAPI + Next.js)

✓ 配置检查通过：
   ✓ FastAPI 使用 ReDoc
   ✓ API 错误处理正确
   ✓ 模型关系配置正确

📦 安装依赖中...
   ✓ pip install -r backend/requirements.txt
   ✓ npm install (frontend)

🔄 运行数据库迁移...
   ✓ alembic upgrade head

🚀 启动服务中...
   ✓ 后端已启动: http://localhost:8000
   ✓ 前端已启动: http://localhost:3000
   ✓ API 文档: http://localhost:8000/docs

✨ 项目已就绪！按 Ctrl+C 停止服务
```

---

## 与 /like --run 的区别

| 命令 | 生成代码 | 写入文件 | 安装依赖 | 运行服务 |
|------|---------|---------|---------|---------|
| `/like --run` | ✅ | ✅ | ✅ | ✅ |
| `/readytorun` | ❌ | ❌ | ✅ | ✅ |

---

## 需要的权限

- `Read` — 读取项目结构和配置
- `Bash` — 安装依赖和启动服务（必须）