---
name: follow
description: 用户关注系统模块。生成后端 Follow 模型、CRUD、API 路由，以及前端 FollowButton、FollowersList、FollowingList 组件和 useFollow Hook。
triggers:
  - follow
  - follow button
  - follow functionality
---

# /follow — 关注系统

生成用户关注/取消关注的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### Follow 模型
```python
class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 不定义 relationship，使用查询方法
    @classmethod
    def check_following(cls, db: Session, follower_id: int, following_id: int):
        return db.query(cls).filter(
            cls.follower_id == follower_id,
            cls.following_id == following_id
        ).first()

    @classmethod
    def get_followers(cls, db: Session, user_id: int):
        return db.query(cls).filter(cls.following_id == user_id).all()

    @classmethod
    def get_following(cls, db: Session, user_id: int):
        return db.query(cls).filter(cls.follower_id == user_id).all()
```

### API 路由
```python
@router.post("/follows")
def create_follow(follow_data: FollowCreate, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        if follow_data.follower_id == follow_data.following_id:
            return ResponseModel(code=400, message="Cannot follow yourself")

        existing = Follow.check_following(db, follow_data.follower_id, follow_data.following_id)
        if existing:
            return ResponseModel(code=400, message="Already following")

        new_follow = Follow(**follow_data.dict())
        db.add(new_follow)
        db.commit()
        return ResponseModel(data=new_follow)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### FollowButton 组件
```tsx
import { useFollow } from '../hooks/useFollow';

export const FollowButton = ({ targetUserId }: Props) => {
  const { isFollowing, toggleFollow, loading } = useFollow(targetUserId);

  return (
    <button onClick={toggleFollow} disabled={loading}>
      {isFollowing ? '已关注' : '关注'}
    </button>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id),
    following_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

## 验证清单

- [ ] Follow 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id

## 需要的权限

- `Read` — 读取现有项目结构和 CODE_QUALITY.md
- `Write` — 创建新文件
- `Bash` — 运行服务