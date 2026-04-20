---
name: user-m
description: 用户系统模块 - 自动检测前端代码并生成匹配的完整后端（FastAPI + PostgreSQL）
---

# /user-m — 用户系统模块

自动检测现有前端代码，生成匹配的完整后端 API 并对接前端。

## 执行步骤

**当你调用 `/user-m` 时，执行以下步骤：**

### 步骤 1：运行前端代码检测

在项目目录下执行：

```bash
npx modularity-skill /user-m --hooks-dir=src/hooks --components-dir=src/components --api-dir=src/services
```

或者直接运行（使用默认目录）：

```bash
npx modularity-skill /user-m
```

### 步骤 2：查看检测结果

CLI 会输出：
- 检测到的前端 hooks 和组件
- 生成的 API 路由
- 需要修改的前端文件

### 步骤 3：写入文件（需要时）

```bash
npx modularity-skill /user-m --write
```

### 步骤 4：启动服务（可选）

```bash
npx modularity-skill /user-m --write --run
```

## 前端检测逻辑

`/user-m` 会自动检测以下前端代码：

| 前端元素 | 检测文件 |
|----------|----------|
| 登录表单 | hooks/useAuth.ts, components/LoginForm.tsx |
| 注册表单 | hooks/useRegister.ts, components/RegisterForm.tsx |
| 用户资料 | hooks/useUser.ts, components/UserProfile.tsx |
| 用户列表 | hooks/useUsers.ts, components/UserList.tsx |
| 导航栏 | components/Navbar.tsx, components/Header.tsx |

## 导航栏用户状态

**`/user-m` 会修改导航栏实现登录状态显示：**

- 检测到 `Navbar.tsx` 或 `Header.tsx`
- 导入 `useAuth` hook 获取用户状态
- 将 Login 按钮改为条件渲染：登录后显示用户名，否则显示登录按钮
- 添加用户下拉菜单（含登出选项）

**修改效果：**
```
未登录：显示 [Login] [Register] 按钮
已登录：显示 [用户名] ▼ 下拉菜单（含 Profile, Logout）
```

## 生成内容

**后端：**
- `backend/app/models/user.py` — User 模型
- `backend/app/schemas/user.py` — Pydantic schemas
- `backend/app/cruds/user.py` — CRUD 操作
- `backend/app/api/routes/user.py` — API 路由

**API 端点：**
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/users/register | 用户注册 |
| POST | /api/users/login | 用户登录 |
| GET | /api/users/me | 获取当前用户 |
| PUT | /api/users/me | 更新用户资料 |
| GET | /api/users | 用户列表（管理员） |

**数据库：**
- `users` 表（id, email, password_hash, username, created_at）

## 前端对接

检测到前端代码后，会生成以下对接文件：

- `src/services/adapters/userAdapter.ts` — API 适配器（如果路径不匹配）
- 修改现有的 hooks 指向新 API

## 选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 预览变更，不写入文件（默认） |
| `--write` | 生成代码并写入文件 |
| `--run` | 生成代码 + 写入文件 + 安装依赖 + 运行 |
| `--force` | 强制覆盖已存在的文件 |
| `--hooks-dir=<path>` | 自定义 hooks 目录 |
| `--components-dir=<path>` | 自定义组件目录 |
| `--api-dir=<path>` | 自定义 API 目录 |

## 示例对话

```
你：/user-m
Claude：运行 npx modularity-skill /user-m 并展示结果

你：/user-m --write --run
Claude：执行完整流程，包括启动服务
```

## 需要的权限

- `Read` — 读取现有项目结构
- `Write` — 创建/修改文件
- `Bash` — 运行 CLI 工具和服务
