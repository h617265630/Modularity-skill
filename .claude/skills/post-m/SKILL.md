---
name: post-m
description: 帖子系统模块。生成 Post 模型、CRUD API，以及前端 PostList、PostItem、PostInput 组件。
triggers:
  - post
  - post module
  - post functionality
---

# /post-m — 帖子系统

生成帖子 CRUD 的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship，用查询方法获取关联数据
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### Post 模型（修复：不使用 relationship）
```python
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 不定义 relationship，使用查询方法
    @classmethod
    def with_comments(cls, db: Session, post_id: int):
        """获取帖子及评论（显式查询，不使用 relationship）"""
        post = db.query(cls).filter(cls.id == post_id).first()
        if not post:
            return None
        post.comments = db.query(Comment).filter(
            Comment.target_id == post_id,
            Comment.target_type == "post"
        ).all()
        return post

    @classmethod
    def with_likes(cls, db: Session, post_id: int):
        """获取帖子及点赞数（显式查询）"""
        post = db.query(cls).filter(cls.id == post_id).first()
        if not post:
            return None
        post.likes_count = db.query(func.count(Like.id)).filter(
            Like.target_id == post_id,
            Like.target_type == "post"
        ).scalar()
        return post
```

### API 路由
```python
@router.get("/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)) -> ResponseModel:
    post = Post.with_comments(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return ResponseModel(data=post)
```

## 前端模板规范

### PostList 组件
```tsx
import { usePosts } from '../hooks/usePosts';

export const PostList = () => {
  const { posts, loading } = usePosts();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

## 验证清单

- [ ] Post 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id