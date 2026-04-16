# Modularity-Skill - AI Full-Stack Module Compiler

**An AI-powered CLI tool** that generates complete backend APIs and frontend React components from simple slash commands like `/comment-m` or `/attach-um`.

## What It Does

```
User input: /comment-m          AI outputs: Complete comment system
                              ├── Backend API (FastAPI + SQLAlchemy)
                              ├── Database (PostgreSQL + Alembic migrations)
                              └── Frontend (React + TypeScript + shadcn/ui)
```

## Features

- **One-command module generation**: `npx modularity-skill /comment-m`
- **Full-stack output**: Backend APIs + Database schemas + Frontend components
- **Smart integration**: `/attach-um` scans existing frontend code and generates matching backend
- **Project scaffolding**: `npx modularity-skill init` creates a complete project structure
- **Dry-run mode**: Preview changes before writing any files

## Quick Start

```bash
# Install
npm install
npm run build

# Create a new project
npx modularity-skill init --project-name=myapp

# Add modules to your project
npx modularity-skill /comment-m --write
npx modularity-skill /like /follow /post-m --write

# Scan existing frontend and generate backend
npx modularity-skill /attach-um --write
```

## Supported Modules

| Command | Description | Backend Routes | DB Tables | Frontend Components |
|---------|-------------|---------------|-----------|---------------------|
| `/comment-m` | Multi-level comments | 5 | 1 | 3 |
| `/like` | Like/unlike system | 4 | 1 | 2 |
| `/follow` | Follow system | 6 | 1 | 4 |
| `/notification` | Notifications | 7 | 2 | 5 |
| `/post-m` | Post system | 6 | 1 | 4 |
| `/user-m` | User management | 8 | 2 | 5 |

## Core Commands

### `init` - Create New Project

```bash
npx modularity-skill init --project-name=myapp --target=./myapp
```

Creates a complete full-stack project with:
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Frontend**: Next.js + shadcn/ui + TypeScript
- **Database**: PostgreSQL with docker-compose
- **Auth**: JWT authentication ready

### `/<module>` - Add Module

```bash
# Preview only (dry-run)
npx modularity-skill /comment-m

# Write files
npx modularity-skill /comment-m --write

# With verification
npx modularity-skill /comment-m --verify --write

# Multiple modules
npx modularity-skill /comment-m /like /follow --write
```

### `/attach-um` - Attach Existing Frontend

Scans your existing frontend code, detects hooks and components, and generates the matching backend:

```bash
# Scan and preview
npx modularity-skill /attach-um

# Scan and write
npx modularity-skill /attach-um --write

# With custom directories
npx modularity-skill /attach-um --hooks-dir=src/store/hooks --components-dir=src/features
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview changes without writing (default) |
| `--write, -w` | Write generated files to project |
| `--verify, -v` | Run verification (lint + tests) |
| `--run, -r` | Write files and start services |
| `--force` | Overwrite existing files |
| `--target=<path>` | Project path (default: current directory) |
| `--hooks-dir=<path>` | Custom hooks directory |
| `--components-dir=<path>` | Custom components directory |
| `--api-dir=<path>` | Custom API services directory |

## Generated Code Example

### Backend (FastAPI)

```python
# backend/app/api/comment.py
@router.post("/comments", response_model=CommentResponse)
async def create_comment(
    obj_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new comment"""
    return Comment_crud.create(db, obj_in)
```

### Frontend (React)

```tsx
// frontend/src/components/CommentList.tsx
export function CommentList({ postId }: { postId: string }) {
  const { comments, loading, error } = useComments(postId);
  // ... component implementation
}
```

### Database (PostgreSQL)

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    target_type VARCHAR(255) NOT NULL,
    target_id INTEGER NOT NULL,
    parent_id INTEGER REFERENCES comments(id),
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL |
| Frontend | React + TypeScript + shadcn/ui |
| Database | PostgreSQL + Alembic |
| Auth | JWT |

## Project Structure

```
src/
├── core/
│   ├── compiler.ts       # Core compiler
│   ├── types.ts          # Type definitions
│   └── ...
├── generators/
│   ├── backend.ts        # Backend code generation
│   ├── frontend.ts       # Frontend code generation
│   └── template-snippets.ts
├── detector/
│   ├── project-detector.ts
│   └── frontend-analyzer.ts  # Frontend code analysis
├── scaffolding/
│   ├── index.ts          # Project scaffolding
│   └── ...
└── templates/
    ├── comment-m.json
    ├── like.json
    └── ...
```

## Installation Order

Recommended installation order (automatically calculated):

```
1. /user-m         → Provides users table and authentication
2. /post-m         → Post system
3. /comment-m      → Depends on /post-m
4. /like           → Depends on /post-m and /user-m
5. /follow         → Depends on /user-m
6. /notification    → Depends on /user-m
```

## License

MIT
