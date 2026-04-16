---
name: like
description: 点赞/取消点赞功能模块。生成后端 Like 模型、CRUD、API 路由，以及前端 LikeButton、LikeCount 组件和 useLike Hook。
triggers:
  - like
  - like button
  - like functionality
---

# /like — 点赞功能

生成点赞/取消点赞的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 执行流程

1. 检测项目类型（FastAPI/Express/Next.js）
2. 生成后端代码（遵循质量策略）
3. 生成前端代码
4. 生成数据库迁移

## 后端模板规范（FastAPI）

### Like 模型
```python
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(50), nullable=False)  # 'post', 'comment'
    target_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 不定义 relationship，使用查询方法
    @classmethod
    def get_user_like(cls, db: Session, user_id: int, target_type: str, target_id: int):
        return db.query(cls).filter(
            cls.user_id == user_id,
            cls.target_type == target_type,
            cls.target_id == target_id
        ).first()
```

### API 路由
```python
@router.post("/likes")
def create_like(like_data: LikeCreate, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        existing = Like.get_user_like(db, like_data.user_id, like_data.target_type, like_data.target_id)
        if existing:
            return ResponseModel(code=400, message="Already liked")

        new_like = Like(**like_data.dict())
        db.add(new_like)
        db.commit()
        return ResponseModel(data=new_like)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

### FastAPI 配置（修复 /docs 空白）
```python
from fastapi.openapi.docs import get_redoc_html

app = FastAPI(
    title="API",
    redoc_url="/docs",  # ReDoc 不依赖 CDN
    docs_url=None,
)

@app.get("/docs", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title="API Documentation",
        redoc_js_url="/static/redoc.standalone.js",
    )
```

## 前端模板规范

### LikeButton 组件
```tsx
import { useLike } from '../hooks/useLike';

export const LikeButton = ({ targetType, targetId }: Props) => {
  const { like, toggleLike, loading } = useLike(targetType, targetId);

  return (
    <button onClick={toggleLike} disabled={loading}>
      {like?.id ? '👎' : '🤍'}
    </button>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user ON likes(user_id);
```

## 验证清单

生成代码后检查：

- [ ] Like 模型不使用 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id

## 需要的权限

- `Read` — 读取现有项目结构和 CODE_QUALITY.md
- `Write` — 创建新文件
- `Bash` — 运行服务（`--run` 时）