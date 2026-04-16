---
name: notification
description: 实时通知系统模块。生成 Notification + NotificationSetting 模型、API 路由，以及前端 NotificationBell、NotificationDropdown 组件。
triggers:
  - notification
  - notification module
  - notification functionality
---

# /notification — 通知系统

生成实时通知的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### Notification 模型
```python
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    action_url = Column(String(500))
    actor_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # 不定义跨模型 relationship
    @classmethod
    def get_unread(cls, db: Session, user_id: int):
        return db.query(cls).filter(
            cls.user_id == user_id,
            cls.is_read == False
        ).order_by(cls.created_at.desc()).all()

    @classmethod
    def mark_as_read(cls, db: Session, notification_id: int):
        notification = db.query(cls).filter(cls.id == notification_id).first()
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
        return notification
```

### NotificationSetting 模型
```python
class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    like_enabled = Column(Boolean, default=True)
    follow_enabled = Column(Boolean, default=True)
    comment_enabled = Column(Boolean, default=True)
    mention_enabled = Column(Boolean, default=True)
```

### API 路由
```python
@router.get("/notifications")
def get_notifications(user_id: int, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        notifications = db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(50).all()
        return ResponseModel(data=notifications)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### NotificationBell 组件
```tsx
import { useNotifications } from '../hooks/useNotifications';

export const NotificationBell = () => {
  const { unreadCount, toggleDropdown } = useNotifications();

  return (
    <button onClick={toggleDropdown}>
      🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    actor_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    like_enabled BOOLEAN DEFAULT TRUE,
    follow_enabled BOOLEAN DEFAULT TRUE,
    comment_enabled BOOLEAN DEFAULT TRUE,
    mention_enabled BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

## 验证清单

- [ ] Notification 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id