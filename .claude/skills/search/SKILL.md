---
name: search
description: 搜索功能模块。生成搜索 API 和前端 SearchBar、SearchResults 组件。
triggers:
  - search
  - search module
  - search functionality
---

# /search — 搜索功能

生成搜索功能的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **API 错误处理** - 返回标准响应格式
2. **Swagger 文档** - 使用 ReDoc 或本地静态文件
3. **搜索性能** - 使用全文搜索索引

---

## 后端模板规范

### 搜索 Service
```python
from sqlalchemy import or_
from sqlalchemy.sql.expression import text

class SearchService:
    @staticmethod
    def search_posts(db: Session, query: str, limit: int = 20):
        """搜索帖子（全文搜索）"""
        return db.query(Post).filter(
            or_(
                Post.title.ilike(f"%{query}%"),
                Post.content.ilike(f"%{query}%")
            )
        ).limit(limit).all()

    @staticmethod
    def search_users(db: Session, query: str, limit: int = 10):
        """搜索用户"""
        return db.query(User).filter(
            User.username.ilike(f"%{query}%")
        ).limit(limit).all()

    @staticmethod
    def search_all(db: Session, query: str, type: str = "all"):
        """综合搜索"""
        results = {
            "posts": [],
            "users": [],
            "comments": []
        }

        if type in ["all", "posts"]:
            results["posts"] = SearchService.search_posts(db, query)

        if type in ["all", "users"]:
            results["users"] = SearchService.search_users(db, query)

        return results
```

### API 路由
```python
@router.get("/search")
def search(q: str, type: str = "all", db: Session = Depends(get_db)) -> ResponseModel:
    if not q or len(q) < 2:
        return ResponseModel(code=400, message="Query too short")

    try:
        results = SearchService.search_all(db, q, type)
        return ResponseModel(data=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### SearchBar 组件
```tsx
import { useState } from 'react';
import { useSearch } from '../hooks/useSearch';

export const SearchBar = () => {
  const [query, setQuery] = useState('');
  const { search, loading } = useSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button disabled={loading}>Search</button>
    </form>
  );
};
```

## 数据库配置

### 创建全文搜索索引
```sql
-- 使用 PostgreSQL tsvector 进行全文搜索
CREATE OR REPLACE FUNCTION search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 posts 表添加搜索列和索引
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(search_vector);

-- 创建触发器
DROP TRIGGER IF EXISTS tsvector_update ON posts;
CREATE TRIGGER tsvector_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION search_trigger();
```

## 验证清单

- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] 搜索有最小长度验证
- [ ] 全文搜索索引正确配置