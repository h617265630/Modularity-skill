---
name: user-m
description: 用户系统模块。生成 User 模型、注册/登录/资料 API，以及前端 UserProfile、UserList 组件。
triggers:
  - user
  - user module
  - user functionality
---

# /user-m — 用户系统

生成用户管理的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### User 模型
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(255))
    bio = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 不定义跨模型 relationship
    @classmethod
    def get_by_email(cls, db: Session, email: str):
        return db.query(cls).filter(cls.email == email).first()

    @classmethod
    def get_by_username(cls, db: Session, username: str):
        return db.query(cls).filter(cls.username == username).first()
```

### API 路由
```python
@router.post("/users")
def create_user(user_data: UserCreate, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        if User.get_by_email(db, user_data.email):
            return ResponseModel(code=400, message="Email already registered")

        if User.get_by_username(db, user_data.username):
            return ResponseModel(code=400, message="Username taken")

        new_user = User(**user_data.dict(exclude={"password"}))
        new_user.hashed_password = hash_password(user_data.password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return ResponseModel(data=new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### UserProfile 组件
```tsx
import { useUser } from '../hooks/useUser';

export const UserProfile = ({ userId }: Props) => {
  const { user, loading } = useUser(userId);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.username}</h1>
      <p>{user.bio || 'No bio'}</p>
    </div>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

## 验证清单

- [ ] User 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 唯一约束正确