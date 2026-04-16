---
name: message
description: 私信系统模块。生成 Message 模型、API 路由，以及前端 MessageList、MessageItem 组件。
triggers:
  - message
  - message module
  - message functionality
---

# /message — 私信系统

生成私信功能的完整代码。

## 代码质量保证 ⚠️

**必须遵循 [CODE_QUALITY](CODE_QUALITY.md) 中的规则：**

1. **SQLAlchemy 模型** - 不使用跨模型 relationship
2. **API 错误处理** - 返回标准响应格式
3. **Swagger 文档** - 使用 ReDoc 或本地静态文件

---

## 后端模板规范

### Message 模型
```python
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 不定义跨模型 relationship
    @classmethod
    def get_conversation_messages(cls, db: Session, conversation_id: int):
        return db.query(cls).filter(
            cls.conversation_id == conversation_id
        ).order_by(cls.created_at).all()
```

### Conversation 模型
```python
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def get_user_conversations(cls, db: Session, user_id: int):
        return db.query(cls).filter(
            or_(cls.user1_id == user_id, cls.user2_id == user_id)
        ).order_by(cls.updated_at.desc()).all()
```

### API 路由
```python
@router.post("/messages")
def send_message(message_data: MessageCreate, db: Session = Depends(get_db)) -> ResponseModel:
    try:
        new_message = Message(**message_data.dict())
        db.add(new_message)

        # 更新会话时间
        conv = db.query(Conversation).filter(Conversation.id == message_data.conversation_id).first()
        if conv:
            conv.updated_at = datetime.utcnow()

        db.commit()
        return ResponseModel(data=new_message)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

## 前端模板规范

### MessageList 组件
```tsx
import { useMessages } from '../hooks/useMessages';

export const MessageList = ({ conversationId }: Props) => {
  const { messages, loading } = useMessages(conversationId);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {messages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};
```

## 数据库迁移

```sql
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id),
    user2_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_conversations_users ON conversations(user1_id, user2_id);
```

## 验证清单

- [ ] Message 模型不使用跨模型 relationship
- [ ] API 返回 ResponseModel 格式
- [ ] `/docs` 使用 ReDoc 或本地静态文件
- [ ] SQL 外键正确指向 users.id 和 conversations.id