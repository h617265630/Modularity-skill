---
name: code-quality
description: 代码质量保证策略 - 确保生成的模块代码无错误运行
---

# 代码质量保证策略

## 核心原则

**生成代码时必须遵循以下规则，避免常见错误。**

---

## 1. SQLAlchemy 模型规则

### 1.1 禁止跨模型 relationship（除非有明确外键）

❌ **错误做法** - 模型间滥用 relationship：
```python
# User 模型中
followers = relationship("Follow", foreign_keys="Follow.following_id")
following = relationship("Follow", foreign_keys="Follow.follower_id")

# Post 模型中
comments = relationship("Comment", back_populates="post")
likes = relationship("Like", back_populates="post")
```

✅ **正确做法** - 使用显式查询方法：
```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # ... 其他字段

    def get_followers(self, db: Session):
        """显式查询粉丝，不使用 relationship"""
        return db.query(Follow).filter(Follow.following_id == self.id).all()

    def get_following(self, db: Session):
        """显式查询关注，不使用 relationship"""
        return db.query(Follow).filter(Follow.follower_id == self.id).all()
```

### 1.2 多态关联（target_type + target_id）必须用查询方法

❌ **错误做法**：
```python
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    comments = relationship("Comment", primaryjoin="and_(Comment.target_id==Post.id, Comment.target_type=='post')")  # 这会报错
```

✅ **正确做法**：
```python
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    # 不定义 relationship

    @classmethod
    def get_comments(cls, db: Session, post_id: int):
        """通过查询获取评论"""
        return db.query(Comment).filter(
            Comment.target_id == post_id,
            Comment.target_type == "post"
        ).all()

    @classmethod
    def get_likes(cls, db: Session, post_id: int):
        """通过查询获取点赞"""
        return db.query(Like).filter(
            Like.target_id == post_id,
            Like.target_type == "post"
        ).all()
```

### 1.3 每个模型必须定义 `__tablename__` 和主键

```python
class Base:
    __tablename__ = "model_name"  # 必须
    id = Column(Integer, primary_key=True, index=True)  # 必须有主键
```

### 1.4 外键必须显式声明

```python
# ✅ 正确
user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

# ❌ 错误 - 没有外键约束
user_id = Column(Integer)
```

---

## 2. 代码检查规则 ⚠️

### 2.1 生成代码前必须检查现有代码

**执行流程：**
```
1. 检查后端：backend/app/models/ 是否有相关模型
2. 检查后端：backend/app/api/ 是否有相关路由
3. 检查后端：backend/app/schemas/ 是否有相关 schema
4. 检查前端：frontend/src/components/ 是否有相关组件
5. 检查前端：frontend/src/hooks/ 是否有相关 hooks
6. 检查前端：frontend/src/services/ 是否有相关 API 服务
7. 检查前端：frontend/src/types/ 是否有相关类型定义
```

### 2.2 检查逻辑（按模块）

| 模块 | 后端检查项 | 前端检查项 |
|------|-----------|-----------|
| `/user-m` | `models/user.py`<br>`api/user.py`<br>`schemas/user.py` | `components/UserProfile.tsx`<br>`components/UserList.tsx`<br>`hooks/useUser.ts` |
| `/post-m` | `models/post.py`<br>`api/post.py`<br>`schemas/post.py` | `components/PostList.tsx`<br>`components/PostItem.tsx`<br>`hooks/usePost.ts` |
| `/like` | `models/like.py`<br>`api/like.py`<br>`schemas/like.py` | `components/LikeButton.tsx`<br>`components/LikeCount.tsx`<br>`hooks/useLike.ts` |
| `/follow` | `models/follow.py`<br>`api/follow.py`<br>`schemas/follow.py` | `components/FollowButton.tsx`<br>`components/FollowersList.tsx`<br>`hooks/useFollow.ts` |
| `/comment-m` | `models/comment.py`<br>`api/comment.py`<br>`schemas/comment.py` | `components/CommentList.tsx`<br>`components/CommentItem.tsx`<br>`components/CommentInput.tsx`<br>`hooks/useComment.ts` |
| `/notification` | `models/notification.py`<br>`api/notification.py` | `components/NotificationBell.tsx`<br>`hooks/useNotification.ts` |
| `/message` | `models/message.py`<br>`api/message.py` | `components/MessageList.tsx`<br>`hooks/useMessage.ts` |
| `/search` | `services/search.py`<br>`api/search.py` | `components/SearchBar.tsx`<br>`components/SearchResults.tsx`<br>`hooks/useSearch.ts` |

### 2.3 检查行为

**如果文件已存在：**
- 读取现有文件内容
- 检查是否与要生成的功能匹配
- 如果匹配，跳过生成，输出"已存在"
- 如果不匹配，提示用户是否覆盖（需要 `--force` 选项）

**如果文件不存在：**
- 创建新文件

### 2.4 前端区域检查

**检查逻辑：**
```typescript
// 检查组件是否已存在
const componentExists = (componentName: string) => {
  const path = `frontend/src/components/${componentName}.tsx`;
  if (fs.existsSync(path)) {
    // 读取并检查内容
    const content = fs.readFileSync(path, 'utf-8');
    return { exists: true, content };
  }
  return { exists: false };
};

// 检查相关文件
const checkModuleFiles = (moduleName: string) => {
  const files = [
    `components/${moduleName}List.tsx`,
    `components/${moduleName}Item.tsx`,
    `hooks/use${capitalize(moduleName)}.ts`,
    `services/${moduleName}.ts`,
    `types/${moduleName}.ts`
  ];

  return files.map(file => ({
    path: `frontend/src/${file}`,
    exists: fs.existsSync(`frontend/src/${file}`)
  }));
};
```

### 2.5 检查输出格式

```bash
✓ 代码检查完成：

后端：
  ✓ models/like.py - 已存在，跳过
  ✓ api/like.py - 已存在，跳过
  ✓ schemas/like.py - 已存在，跳过

前端：
  ✓ components/LikeButton.tsx - 已存在，跳过
  ✓ components/LikeCount.tsx - 已存在，跳过
  ✓ hooks/useLike.ts - 已存在，跳过

📦 只生成缺失的文件：
  - services/like.ts
  - types/like.ts
```

---

## 3. 前端代码质量规则

## 2. API 路由规则

### 2.1 所有路由必须返回标准格式

```python
from fastapi import HTTPException

class ResponseModel(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[Any] = None

@router.get("/items/{item_id}")
def get_item(item_id: int) -> ResponseModel:
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ResponseModel(data=item)
```

### 2.2 错误处理

```python
@router.post("/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    try:
        db_item = Item(**item.dict())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return ResponseModel(data=db_item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 3. Swagger/OpenAPI 配置

### 3.1 禁用默认 CDN，使用本地静态文件

```python
from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html

app = FastAPI(
    title="My API",
    docs_url=None,  # 禁用默认 /docs
    redoc_url=None,  # 禁用默认 /redoc
)

@app.get("/docs", include_in_schema=False)
async def custom_docs():
    """使用本地 HTML 不依赖 CDN"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title="API Documentation",
        swagger_js_url="/static/swagger-ui-bundle.js",
        swagger_css_url="/static/swagger-ui.css",
    )

# 或者更简单的方案 - 使用 ReDoc（不依赖 CDN）
@app.get("/docs", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title="API Documentation",
        redoc_js_url="/static/redoc.standalone.js",
    )
```

### 3.2 推荐：直接使用 ReDoc

```python
app = FastAPI(
    title="My API",
    description="API Documentation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",  # ReDoc 不依赖 CDN
    swagger_ui_oauth2_redirect_url="/docs/oauth2-redirect",
)
```

---

## 3.5 前端代码质量规则

### 3.5.1 组件必须使用 TypeScript 类型

❌ **错误做法：**
```tsx
// 没有类型
export const LikeButton = ({ targetType, targetId }) => {
  return <button>...</button>;
};
```

✅ **正确做法：**
```tsx
interface Props {
  targetType: string;
  targetId: number | string;
}

export const LikeButton: React.FC<Props> = ({ targetType, targetId }) => {
  return <button>...</button>;
};
```

### 3.5.2 Hooks 必须处理加载和错误状态

```tsx
export const useLike = (targetType: string, targetId: number | string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [like, setLike] = useState<Like | null>(null);

  const toggleLike = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.like.toggle(targetType, targetId);
      setLike(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to toggle like');
    } finally {
      setLoading(false);
    }
  };

  return { like, toggleLike, loading, error };
};
```

### 3.5.3 组件必须有加载和错误边界

```tsx
export const LikeButton = ({ targetType, targetId }: Props) => {
  const { like, toggleLike, loading, error } = useLike(targetType, targetId);

  if (loading) return <button disabled>加载中...</button>;
  if (error) return <button disabled>{error}</button>;

  return (
    <button onClick={toggleLike}>
      {like ? '👎 已赞' : '🤍 赞'}
    </button>
  );
};
```

### 3.5.4 API 服务必须封装

```tsx
// frontend/src/services/like.ts
import { API_BASE } from './api';

export const likeService = {
  toggle: async (targetType: string, targetId: number | string) => {
    const response = await fetch(`${API_BASE}/api/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId })
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle like: ${response.statusText}`);
    }
    return response.json();
  },

  check: async (targetType: string, targetId: number | string) => {
    const response = await fetch(`${API_BASE}/api/likes/check/${targetType}/${targetId}`);
    if (!response.ok) {
      throw new Error(`Failed to check like: ${response.statusText}`);
    }
    return response.json();
  }
};
```

### 3.5.5 组件使用 CSS Modules 或 Tailwind

```tsx
// CSS Modules 方式
import styles from './LikeButton.module.css';

export const LikeButton: React.FC<Props> = ({ isLiked }) => {
  return (
    <button className={`${styles.button} ${isLiked ? styles.liked : styles.unliked}`}>
      {isLiked ? '👎' : '🤍'}
    </button>
  );
};
```

```tsx
// Tailwind CSS 方式
export const LikeButton: React.FC<Props> = ({ isLiked }) => {
  return (
    <button className={`
      px-4 py-2 rounded-lg transition-colors
      ${isLiked ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}
      hover:scale-105 active:scale-95
    `}>
      {isLiked ? '👎' : '🤍'}
    </button>
  );
};
```

### 3.5.6 区域作用规则

**检查组件是否作用于特定区域：**
```tsx
// 检查组件是否已在目标区域存在
const checkComponentInArea = (
  componentName: string,
  targetArea: 'post' | 'comment' | 'user' | 'message'
): boolean => {
  const existingComponents: Record<string, string[]> = {
    post: ['PostItem', 'PostList', 'PostCard'],
    comment: ['CommentItem', 'CommentList', 'CommentInput'],
    user: ['UserProfile', 'UserCard', 'UserAvatar'],
    message: ['MessageItem', 'MessageList', 'MessageBubble']
  };

  return existingComponents[targetArea].some(comp => componentName.includes(comp));
};
```

**使用示例：**
```tsx
// 在 post 区域添加 like 按钮
// 如果 PostItem 已有 LikeButton，就跳过
if (!checkComponentInArea('LikeButton', 'post')) {
  // 只在 PostItem 组件里添加 LikeButton
}
```

---

## 4. 数据库规则

### 4.1 确保表结构正确

```sql
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

### 4.2 迁移文件必须包含上下级依赖

```sql
-- migrations/001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- migrations/002_create_posts.sql
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),  -- 依赖 users 表
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. 验证流程

### 5.1 生成代码后必须验证

生成代码后，检查以下项目：

1. **模型验证**
   - [ ] 所有 `relationship()` 调用都是同模型内或明确外键
   - [ ] 没有使用 `back_populates` 跨模型引用
   - [ ] 多态关联使用 `@classmethod` 查询方法

2. **API 验证**
   - [ ] 所有端点返回 `ResponseModel` 或 `List[ResponseModel]`
   - [ ] 错误处理返回合适的 HTTP 状态码

3. **文档验证**
   - [ ] `/docs` 不依赖外部 CDN
   - [ ] 或使用 ReDoc（推荐）

### 5.2 快速测试命令

```bash
# 1. 检查 FastAPI 能否启动
cd backend && uvicorn app.main:app --reload --port 8000

# 2. 测试 API
curl http://localhost:8000/docs  # 应该显示文档
curl http://localhost:8000/api/v1/posts  # 应该返回 JSON

# 3. 检查错误日志
# 查看 uvicorn 输出是否有 500 错误
```

---

## 6. 常见错误修复对照表

| 错误 | 原因 | 修复方法 |
|------|------|---------|
| `relationship() accepts 0 positional arguments` | relationship 定义错误 | 检查 foreign_keys 参数 |
| `Could not determine join condition` | 跨模型关系无法推断 | 改用显式查询方法 |
| `/docs` 空白 | CDN 无法访问 | 使用 ReDoc 或本地静态文件 |
| `500 Internal Server Error` | 模型关系错误 | 移除有问题的 relationship |
| ` FOREIGN KEY constraint failed` | 外键引用错误表 | 检查 ForeignKey 指向 |

---

## 7. 代码模板检查清单

生成每个模块前，确保模板包含：

- [ ] 模型只有本表字段，不使用跨模型 relationship
- [ ] 多态关联使用 `@classmethod` 查询方法
- [ ] FastAPI 配置使用 ReDoc 或本地静态文件
- [ ] 所有 SQL 表有正确的外键约束
- [ ] 迁移文件有正确的依赖顺序