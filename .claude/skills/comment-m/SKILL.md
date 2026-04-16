---
name: comment-m
description: 多层评论系统模块。生成支持嵌套回复（最大3层）的评论系统，包括后端 Comment 模型、API 路由和前端 CommentList、CommentItem、CommentInput 组件。
triggers:
  - comment
  - comment module
  - comment functionality
---

# /comment-m — 评论系统

生成多层嵌套评论的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship，用查询方法获取关联数据
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### Comment 模型
```python
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_type = Column(String(50), nullable=False)  # 'post', 'comment'
    target_id = Column(Integer, nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    reply_count = Column(Integer, default=0)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 不定义跨模型 relationship
    @classmethod
    def get_comments_for_target(cls, db: Session, target_type: str, target_id: int, parent_id: int = None):
        """获取目标对象的评论"""
        query = db.query(cls).filter(
            cls.target_type == target_type,
            cls.target_id == target_id,
            cls.parent_id == parent_id
        )
        return query.order_by(cls.created_at).all()
```

### API 路由
```python
@router.get("/comments/{target_type}/{target_id}")
def get_comments(target_type: str, target_id: int, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        comments = Comment.get_comments_for_target(db, target_type, target_id)
        return ResponseModel(data=comments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### CommentList 组件
```tsx
import { useComments } from '../hooks/useComments';

export const CommentList = ({ targetType, targetId }: Props) => {
  const { comments, loading } = useComments(targetType, targetId);

  if (loading) return <div>Loading comments...</div>;

  return (
    <div>
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} targetType={targetType} />
      ))}
    </div>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    parent_id INTEGER REFERENCES comments(id),
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_target ON comments(target_type, target_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

## 验证清单

- [ ] Comment 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id