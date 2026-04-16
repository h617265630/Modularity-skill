// ============================================================================
// 项目脚手架生成器 - Modularity-skill
// 创建完整的全栈项目结构
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
/**
 * 项目脚手架生成器
 */
export class ProjectScaffolder {
    options;
    constructor(options) {
        this.options = {
            frontend: 'nextjs',
            backend: 'fastapi',
            database: 'postgresql',
            uiLibrary: 'shadcn',
            ...options,
        };
    }
    /**
     * 创建完整项目
     */
    async scaffold() {
        console.log('\n🏗️  Creating project: ' + this.options.projectName + '\n');
        // 1. 创建目录结构
        await this.createDirectoryStructure();
        // 2. 创建前端 (Next.js + shadcn/ui)
        await this.scaffoldFrontend();
        // 3. 创建后端 (FastAPI + PostgreSQL)
        await this.scaffoldBackend();
        // 4. 创建基础页面
        await this.createBasePages();
        // 5. 创建用户管理模块
        await this.createUserManagement();
        // 6. 创建数据库配置
        await this.createDatabaseConfig();
        // 7. 创建 docker-compose (可选)
        await this.createDockerCompose();
        console.log('\n✅ Project scaffolded successfully!\n');
    }
    /**
     * 创建目录结构
     */
    async createDirectoryStructure() {
        const base = this.options.projectPath;
        const dirs = [
            // Frontend
            'frontend/src/app',
            'frontend/src/app/(auth)/login',
            'frontend/src/app/(auth)/register',
            'frontend/src/app/(dashboard)',
            'frontend/src/app/(dashboard)/admin/users',
            'frontend/src/app/(dashboard)/layout',
            'frontend/src/app/about',
            'frontend/src/app/resource',
            'frontend/src/app/update',
            'frontend/src/components/ui',
            'frontend/src/components/layout',
            'frontend/src/hooks',
            'frontend/src/lib',
            'frontend/src/services',
            'frontend/src/types',
            // Backend
            'backend/app/api',
            'backend/app/models',
            'backend/app/schemas',
            'backend/app/cruds',
            'backend/app/services',
            'backend/app/core',
            'backend/app/db',
            'backend/alembic/versions',
            // Root
            'migrations',
        ];
        for (const dir of dirs) {
            const fullPath = path.join(base, dir);
            await fs.promises.mkdir(fullPath, { recursive: true });
        }
    }
    /**
     * 确保文件目录存在
     */
    async ensureDir(filePath) {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
    }
    /**
     * 创建前端项目 (Next.js + shadcn/ui)
     */
    async scaffoldFrontend() {
        console.log('   📦 Setting up Next.js frontend...');
        const base = this.options.projectPath;
        const frontendBase = path.join(base, 'frontend');
        // package.json
        const packageJson = {
            name: this.options.projectName + '-frontend',
            version: '0.1.0',
            private: true,
            scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint',
            },
            dependencies: {
                next: '14.2.0',
                react: '^18',
                'react-dom': '^18',
                '@radix-ui/react-slot': '^1.0.2',
                'class-variance-authority': '^0.7.0',
                clsx: '^2.1.0',
                tailwindcss: '^3.4.0',
                '@tailwindcss/typography': '^0.5.10',
                'lucide-react': '^0.344.0',
                axios: '^1.6.0',
            },
            devDependencies: {
                typescript: '^5',
                '@types/node': '^20',
                '@types/react': '^18',
                '@types/react-dom': '^18',
                autoprefixer: '^10.0.1',
                postcss: '^8',
                tailwindcss: '^3.4.0',
                eslint: '^8',
                'eslint-config-next': '14.2.0',
            },
        };
        await fs.promises.writeFile(path.join(frontendBase, 'package.json'), JSON.stringify(packageJson, null, 2));
        // next.config.js
        const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
`;
        await fs.promises.writeFile(path.join(frontendBase, 'next.config.js'), nextConfig);
        // tsconfig.json
        const tsconfig = {
            compilerOptions: {
                target: 'ES2017',
                lib: ['dom', 'dom.iterable', 'esnext'],
                allowJs: true,
                skipLibCheck: true,
                strict: true,
                noEmit: true,
                esModuleInterop: true,
                module: 'esnext',
                moduleResolution: 'bundler',
                resolveJsonModule: true,
                isolatedModules: true,
                jsx: 'preserve',
                incremental: true,
                plugins: [{ name: 'next' }],
                paths: { '@/*': ['./src/*'] },
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
            exclude: ['node_modules'],
        };
        await fs.promises.writeFile(path.join(frontendBase, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
        // tailwind.config.js
        const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
`;
        await fs.promises.writeFile(path.join(frontendBase, 'tailwind.config.js'), tailwindConfig);
        // postcss.config.js
        await fs.promises.writeFile(path.join(frontendBase, 'postcss.config.js'), 'module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n');
        // globals.css
        const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/globals.css'), globalsCss);
        // layout.tsx
        const layoutTsx = `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '${this.options.projectName}',
  description: 'Created with Modularity-skill',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
`;
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/layout.tsx'), layoutTsx);
        // components.json (shadcn/ui)
        const componentsJson = {
            $schema: 'https://ui.shadcn.com/schema.json',
            style: 'default',
            rsc: true,
            tailwind: {
                config: 'tailwind.config.js',
                css: 'src/app/globals.css',
                baseColor: 'slate',
                cssVariables: true,
            },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils',
            },
        };
        await fs.promises.writeFile(path.join(frontendBase, 'components.json'), JSON.stringify(componentsJson, null, 2));
        // lib/utils.ts
        await fs.promises.writeFile(path.join(frontendBase, 'src/lib/utils.ts'), 'import { type ClassValue, clsx } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n');
        console.log('   ✅ Next.js + shadcn/ui configured');
    }
    /**
     * 创建后端项目 (FastAPI + PostgreSQL)
     */
    async scaffoldBackend() {
        console.log('   📦 Setting up FastAPI backend...');
        const base = this.options.projectPath;
        const backendBase = path.join(base, 'backend');
        const projectName = this.options.projectName;
        // requirements.txt
        const requirements = [
            'fastapi==0.109.0',
            'uvicorn[standard]==0.27.0',
            'sqlalchemy==2.0.25',
            'psycopg2-binary==2.9.9',
            'alembic==1.13.1',
            'pydantic==2.5.3',
            'pydantic-settings==2.1.0',
            'python-jose[cryptography]==3.3.0',
            'passlib[bcrypt]==1.7.4',
            'python-multipart==0.0.6',
            'httpx==0.26.0',
        ];
        await fs.promises.writeFile(path.join(backendBase, 'requirements.txt'), requirements.join('\n'));
        // app/main.py
        const mainPy = '# File: app/main.py\n' +
            '# ============================================================================\n' +
            '# FastAPI Application Entry Point\n' +
            '# ============================================================================\n\n' +
            'from fastapi import FastAPI\n' +
            'from fastapi.middleware.cors import CORSMiddleware\n' +
            'from app.api import users, auth\n' +
            'from app.db.session import engine\n' +
            'from app.db.base import Base\n\n' +
            '# Create database tables\n' +
            'Base.metadata.create_all(bind=engine)\n\n' +
            'app = FastAPI(\n' +
            '    title="' + projectName + ' API",\n' +
            '    description="Backend API for ' + projectName + '",\n' +
            '    version="0.1.0",\n' +
            ')\n\n' +
            '# CORS middleware\n' +
            'app.add_middleware(\n' +
            '    CORSMiddleware,\n' +
            '    allow_origins=["http://localhost:3000"],\n' +
            '    allow_credentials=True,\n' +
            '    allow_methods=["*"],\n' +
            '    allow_headers=["*"],\n' +
            ')\n\n' +
            '# Include routers\n' +
            'app.include_router(auth.router, prefix="/api/auth", tags=["auth"])\n' +
            'app.include_router(users.router, prefix="/api/users", tags=["users"])\n\n\n' +
            '@app.get("/")\n' +
            'async def root():\n' +
            '    return {"message": "' + projectName + ' API", "status": "running"}\n\n\n' +
            '@app.get("/health")\n' +
            'async def health():\n' +
            '    return {"status": "healthy"}\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/main.py'), mainPy);
        // app/__init__.py
        await fs.promises.writeFile(path.join(backendBase, 'app/__init__.py'), '');
        // app/core/config.py
        const configPy = '# File: app/core/config.py\n' +
            '# ============================================================================\n' +
            '# Application Configuration\n' +
            '# ============================================================================\n\n' +
            'from pydantic_settings import BaseSettings\n' +
            'from functools import lru_cache\n\n\n' +
            'class Settings(BaseSettings):\n' +
            '    PROJECT_NAME: str = "' + projectName + '"\n' +
            '    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/' + projectName + '"\n' +
            '    SECRET_KEY: str = "your-secret-key-change-in-production"\n' +
            '    ALGORITHM: str = "HS256"\n' +
            '    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30\n\n' +
            '    class Config:\n' +
            '        env_file = ".env"\n' +
            '        case_sensitive = True\n\n\n' +
            '@lru_cache()\n' +
            'def get_settings():\n' +
            '    return Settings()\n\n\n' +
            'settings = get_settings()\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/core/config.py'), configPy);
        // app/core/__init__.py
        await fs.promises.writeFile(path.join(backendBase, 'app/core/__init__.py'), '');
        // app/db/session.py
        const sessionPy = '# File: app/db/session.py\n' +
            '# ============================================================================\n' +
            '# Database Session Configuration\n' +
            '# ============================================================================\n\n' +
            'from sqlalchemy import create_engine\n' +
            'from sqlalchemy.orm import sessionmaker\n' +
            'from app.core.config import settings\n\n' +
            'engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)\n' +
            'SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\n\n\n' +
            'def get_db():\n' +
            '    db = SessionLocal()\n' +
            '    try:\n' +
            '        yield db\n' +
            '    finally:\n' +
            '        db.close()\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/db/session.py'), sessionPy);
        // app/db/base.py
        const basePy = '# File: app/db/base.py\n' +
            '# ============================================================================\n' +
            '# SQLAlchemy Base Configuration\n' +
            '# ============================================================================\n\n' +
            'from sqlalchemy.orm import DeclarativeBase\n\n\n' +
            'class Base(DeclarativeBase):\n' +
            '    pass\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/db/base.py'), basePy);
        // app/db/__init__.py
        await fs.promises.writeFile(path.join(backendBase, 'app/db/__init__.py'), '');
        console.log('   ✅ FastAPI backend configured');
    }
    /**
     * 创建基础页面
     */
    async createBasePages() {
        console.log('   📄 Creating base pages...');
        const base = this.options.projectPath;
        const frontendBase = path.join(base, 'frontend');
        const projectName = this.options.projectName;
        // Landing Page
        const landingPage = '// File: src/app/page.tsx\n' +
            '// ============================================================================\n' +
            '// Landing Page\n' +
            '// ============================================================================\n\n' +
            'import Link from \'next/link\';\n\n' +
            'export default function HomePage() {\n' +
            '  return (\n' +
            '    <div className="min-h-screen">\n' +
            '      {/* Hero Section */}\n' +
            '      <section className="bg-gradient-to-b from-slate-50 to-white py-20">\n' +
            '        <div className="container mx-auto px-4">\n' +
            '          <div className="max-w-3xl mx-auto text-center">\n' +
            '            <h1 className="text-5xl font-bold text-slate-900 mb-6">\n' +
            '              Welcome to ' + projectName + '\n' +
            '            </h1>\n' +
            '            <p className="text-xl text-slate-600 mb-8">\n' +
            '              A modern full-stack application built with Next.js and FastAPI\n' +
            '            </p>\n' +
            '            <div className="flex gap-4 justify-center">\n' +
            '              <Link\n' +
            '                href="/login"\n' +
            '                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"\n' +
            '              >\n' +
            '                Get Started\n' +
            '              </Link>\n' +
            '              <Link\n' +
            '                href="/about"\n' +
            '                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition"\n' +
            '              >\n' +
            '                Learn More\n' +
            '              </Link>\n' +
            '            </div>\n' +
            '          </div>\n' +
            '        </div>\n' +
            '      </section>\n\n' +
            '      {/* Features Section */}\n' +
            '      <section className="py-20">\n' +
            '        <div className="container mx-auto px-4">\n' +
            '          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>\n' +
            '          <div className="grid md:grid-cols-3 gap-8">\n' +
            '            <div className="p-6 bg-white rounded-xl shadow-sm border">\n' +
            '              <h3 className="text-xl font-semibold mb-3">Fast & Modern</h3>\n' +
            '              <p className="text-slate-600">\n' +
            '                Built with the latest technologies for optimal performance\n' +
            '              </p>\n' +
            '            </div>\n' +
            '            <div className="p-6 bg-white rounded-xl shadow-sm border">\n' +
            '              <h3 className="text-xl font-semibold mb-3">Secure</h3>\n' +
            '              <p className="text-slate-600">\n' +
            '                JWT authentication and password hashing out of the box\n' +
            '              </p>\n' +
            '            </div>\n' +
            '            <div className="p-6 bg-white rounded-xl shadow-sm border">\n' +
            '              <h3 className="text-xl font-semibold mb-3">Scalable</h3>\n' +
            '              <p className="text-slate-600">\n' +
            '                Designed to grow with your needs\n' +
            '              </p>\n' +
            '            </div>\n' +
            '          </div>\n' +
            '        </div>\n' +
            '      </section>\n\n' +
            '      {/* Footer */}\n' +
            '      <footer className="py-8 border-t">\n' +
            '        <div className="container mx-auto px-4 text-center text-slate-500">\n' +
            '          © 2024 ' + projectName + '. All rights reserved.\n' +
            '        </div>\n' +
            '      </footer>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/page.tsx'), landingPage);
        // About Page
        const aboutPage = '// File: src/app/about/page.tsx\n' +
            '// ============================================================================\n' +
            '// About Page\n' +
            '// ============================================================================\n\n' +
            'export default function AboutPage() {\n' +
            '  return (\n' +
            '    <div className="min-h-screen py-20">\n' +
            '      <div className="container mx-auto px-4">\n' +
            '        <h1 className="text-4xl font-bold mb-6">About Us</h1>\n' +
            '        <p className="text-lg text-slate-600 mb-8">\n' +
            '          ' + projectName + ' is a modern full-stack application built with\n' +
            '          Next.js, FastAPI, and PostgreSQL.\n' +
            '        </p>\n' +
            '        <div className="prose max-w-none">\n' +
            '          <h2 className="text-2xl font-semibold mb-4">Our Technology Stack</h2>\n' +
            '          <ul className="list-disc pl-6 space-y-2 text-slate-600">\n' +
            '            <li><strong>Frontend:</strong> Next.js 14 with TypeScript</li>\n' +
            '            <li><strong>UI:</strong> shadcn/ui components</li>\n' +
            '            <li><strong>Backend:</strong> FastAPI with Python</li>\n' +
            '            <li><strong>Database:</strong> PostgreSQL</li>\n' +
            '            <li><strong>ORM:</strong> SQLAlchemy</li>\n' +
            '          </ul>\n' +
            '        </div>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/about/page.tsx'), aboutPage);
        // Resource Page
        const resourcePage = '// File: src/app/resource/page.tsx\n' +
            '// ============================================================================\n' +
            '// Resource Page\n' +
            '// ============================================================================\n\n' +
            'export default function ResourcePage() {\n' +
            '  return (\n' +
            '    <div className="min-h-screen py-20">\n' +
            '      <div className="container mx-auto px-4">\n' +
            '        <h1 className="text-4xl font-bold mb-6">Resources</h1>\n' +
            '        <p className="text-lg text-slate-600 mb-8">\n' +
            '          Find helpful resources and documentation here.\n' +
            '        </p>\n' +
            '        <div className="grid md:grid-cols-2 gap-6">\n' +
            '          <div className="p-6 bg-white rounded-xl shadow-sm border">\n' +
            '            <h3 className="text-xl font-semibold mb-3">Documentation</h3>\n' +
            '            <p className="text-slate-600">\n' +
            '              Comprehensive guides and API documentation\n' +
            '            </p>\n' +
            '          </div>\n' +
            '          <div className="p-6 bg-white rounded-xl shadow-sm border">\n' +
            '            <h3 className="text-xl font-semibold mb-3">Support</h3>\n' +
            '            <p className="text-slate-600">\n' +
            '              Get help from our community\n' +
            '            </p>\n' +
            '          </div>\n' +
            '        </div>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/resource/page.tsx'), resourcePage);
        // Update Page
        const updatePage = '// File: src/app/update/page.tsx\n' +
            '// ============================================================================\n' +
            '// Update / Changelog Page\n' +
            '// ============================================================================\n\n' +
            'const updates = [\n' +
            '  {\n' +
            '    version: \'v0.1.0\',\n' +
            '    date: \'2024-01-01\',\n' +
            '    changes: [\'Initial release\', \'Basic user authentication\', \'User management\'],\n' +
            '  },\n' +
            '];\n\n' +
            'export default function UpdatePage() {\n' +
            '  return (\n' +
            '    <div className="min-h-screen py-20">\n' +
            '      <div className="container mx-auto px-4">\n' +
            '        <h1 className="text-4xl font-bold mb-6">Updates</h1>\n' +
            '        <p className="text-lg text-slate-600 mb-8">\n' +
            '          Latest updates and changelog\n' +
            '        </p>\n' +
            '        <div className="space-y-8">\n' +
            '          {updates.map((update) => (\n' +
            '            <div key={update.version} className="border rounded-xl p-6">\n' +
            '              <div className="flex items-center justify-between mb-4">\n' +
            '                <h2 className="text-2xl font-semibold">{update.version}</h2>\n' +
            '                <span className="text-slate-500">{update.date}</span>\n' +
            '              </div>\n' +
            '              <ul className="list-disc pl-6 space-y-2">\n' +
            '                {update.changes.map((change, i) => (\n' +
            '                  <li key={i} className="text-slate-600">\n' +
            '                    {change}\n' +
            '                  </li>\n' +
            '                ))}\n' +
            '              </ul>\n' +
            '            </div>\n' +
            '          ))}\n' +
            '        </div>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/update/page.tsx'), updatePage);
        console.log('   ✅ Base pages created (landing, about, resource, update)');
    }
    /**
     * 创建用户管理模块
     */
    async createUserManagement() {
        console.log('   👥 Creating user management...');
        const base = this.options.projectPath;
        const frontendBase = path.join(base, 'frontend');
        const backendBase = path.join(base, 'backend');
        // Backend: User Model
        const userModel = '# File: app/models/user.py\n' +
            '# ============================================================================\n' +
            '# User Model - SQLAlchemy\n' +
            '# ============================================================================\n\n' +
            'from sqlalchemy import Column, String, Integer, Boolean, DateTime\n' +
            'from sqlalchemy.orm import relationship\n' +
            'from datetime import datetime\n' +
            'from app.db.base import Base\n\n\n' +
            'class User(Base):\n' +
            '    __tablename__ = "users"\n\n' +
            '    id = Column(Integer, primary_key=True, index=True)\n' +
            '    email = Column(String, unique=True, index=True, nullable=False)\n' +
            '    username = Column(String, unique=True, index=True, nullable=False)\n' +
            '    password_hash = Column(String, nullable=False)\n' +
            '    full_name = Column(String, nullable=True)\n' +
            '    is_active = Column(Boolean, default=True)\n' +
            '    is_superuser = Column(Boolean, default=False)\n' +
            '    created_at = Column(DateTime, default=datetime.utcnow)\n' +
            '    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/models/user.py'), userModel);
        // Backend: User Schemas
        const userSchemas = '# File: app/schemas/user.py\n' +
            '# ============================================================================\n' +
            '# User Pydantic Schemas\n' +
            '# ============================================================================\n\n' +
            'from pydantic import BaseModel, EmailStr\n' +
            'from typing import Optional\n' +
            'from datetime import datetime\n\n\n' +
            'class UserBase(BaseModel):\n' +
            '    email: EmailStr\n' +
            '    username: str\n' +
            '    full_name: Optional[str] = None\n\n\n' +
            'class UserCreate(UserBase):\n' +
            '    password: str\n\n\n' +
            'class UserUpdate(BaseModel):\n' +
            '    email: Optional[EmailStr] = None\n' +
            '    username: Optional[str] = None\n' +
            '    full_name: Optional[str] = None\n' +
            '    password: Optional[str] = None\n\n\n' +
            'class UserResponse(UserBase):\n' +
            '    id: int\n' +
            '    is_active: bool\n' +
            '    is_superuser: bool\n' +
            '    created_at: datetime\n' +
            '    updated_at: Optional[datetime] = None\n\n' +
            '    class Config:\n' +
            '        from_attributes = True\n\n\n' +
            'class Token(BaseModel):\n' +
            '    access_token: str\n' +
            '    token_type: str\n\n\n' +
            'class TokenData(BaseModel):\n' +
            '    username: Optional[str] = None\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/schemas/user.py'), userSchemas);
        // Backend: User CRUD
        const userCrud = '# File: app/cruds/user_crud.py\n' +
            '# ============================================================================\n' +
            '# User CRUD Operations\n' +
            '# ============================================================================\n\n' +
            'from sqlalchemy.orm import Session\n' +
            'from typing import List, Optional\n' +
            'from app.models.user import User\n' +
            'from app.schemas.user import UserCreate, UserUpdate\n' +
            'from passlib.context import CryptContext\n\n' +
            'pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")\n\n\n' +
            'class UserCRUD:\n' +
            '    def get(self, db: Session, user_id: int) -> Optional[User]:\n' +
            '        return db.query(User).filter(User.id == user_id).first()\n\n' +
            '    def get_by_email(self, db: Session, email: str) -> Optional[User]:\n' +
            '        return db.query(User).filter(User.email == email).first()\n\n' +
            '    def get_by_username(self, db: Session, username: str) -> Optional[User]:\n' +
            '        return db.query(User).filter(User.username == username).first()\n\n' +
            '    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:\n' +
            '        return db.query(User).offset(skip).limit(limit).all()\n\n' +
            '    def create(self, db: Session, obj_in: UserCreate) -> User:\n' +
            '        hashed_password = pwd_context.hash(obj_in.password)\n' +
            '        db_obj = User(\n' +
            '            email=obj_in.email,\n' +
            '            username=obj_in.username,\n' +
            '            full_name=obj_in.full_name,\n' +
            '            password_hash=hashed_password,\n' +
            '        )\n' +
            '        db.add(db_obj)\n' +
            '        db.commit()\n' +
            '        db.refresh(db_obj)\n' +
            '        return db_obj\n\n' +
            '    def update(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:\n' +
            '        update_data = obj_in.model_dump(exclude_unset=True)\n' +
            '        if "password" in update_data:\n' +
            '            update_data["password_hash"] = pwd_context.hash(update_data.pop("password"))\n' +
            '        for field, value in update_data.items():\n' +
            '            setattr(db_obj, field, value)\n' +
            '        db.commit()\n' +
            '        db.refresh(db_obj)\n' +
            '        return db_obj\n\n' +
            '    def delete(self, db: Session, user_id: int) -> Optional[User]:\n' +
            '        obj = db.query(User).filter(User.id == user_id).first()\n' +
            '        if obj:\n' +
            '            db.delete(obj)\n' +
            '            db.commit()\n' +
            '        return obj\n\n\n' +
            'user_crud = UserCRUD()\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/cruds/user_crud.py'), userCrud);
        // Backend: Auth Router
        const authRouter = '# File: app/api/auth.py\n' +
            '# ============================================================================\n' +
            '# Authentication API Routes\n' +
            '# ============================================================================\n\n' +
            'from fastapi import APIRouter, Depends, HTTPException, status\n' +
            'from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm\n' +
            'from sqlalchemy.orm import Session\n' +
            'from datetime import timedelta\n' +
            'from jose import JWTError, jwt\n' +
            'from passlib.context import CryptContext\n\n' +
            'from app.db.session import get_db\n' +
            'from app.core.config import settings\n' +
            'from app.schemas.user import UserCreate, UserResponse, Token\n' +
            'from app.cruds.user_crud import user_crud\n\n' +
            'router = APIRouter()\n' +
            'pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")\n' +
            'oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")\n\n\n' +
            'def verify_password(plain_password: str, hashed_password: str) -> bool:\n' +
            '    return pwd_context.verify(plain_password, hashed_password)\n\n\n' +
            'def create_access_token(data: dict, expires_delta: timedelta = None):\n' +
            '    to_encode = data.copy()\n' +
            '    expire = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)\n' +
            '    to_encode.update({"exp": expire})\n' +
            '    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)\n\n\n' +
            'async def get_current_user(\n' +
            '    token: str = Depends(oauth2_scheme),\n' +
            '    db: Session = Depends(get_db),\n' +
            '):\n' +
            '    credentials_exception = HTTPException(\n' +
            '        status_code=status.HTTP_401_UNAUTHORIZED,\n' +
            '        detail="Could not validate credentials",\n' +
            '        headers={"WWW-Authenticate": "Bearer"},\n' +
            '    )\n' +
            '    try:\n' +
            '        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])\n' +
            '        username: str = payload.get("sub")\n' +
            '        if username is None:\n' +
            '            raise credentials_exception\n' +
            '    except JWTError:\n' +
            '        raise credentials_exception\n\n' +
            '    user = user_crud.get_by_username(db, username=username)\n' +
            '    if user is None:\n' +
            '        raise credentials_exception\n' +
            '    return user\n\n\n' +
            '@router.post("/register", response_model=UserResponse)\n' +
            'def register(user_in: UserCreate, db: Session = Depends(get_db)):\n' +
            '    user = user_crud.get_by_email(db, email=user_in.email)\n' +
            '    if user:\n' +
            '        raise HTTPException(\n' +
            '            status_code=400,\n' +
            '            detail="Email already registered",\n' +
            '        )\n' +
            '    user = user_crud.get_by_username(db, username=user_in.username)\n' +
            '    if user:\n' +
            '        raise HTTPException(\n' +
            '            status_code=400,\n' +
            '            detail="Username already taken",\n' +
            '        )\n' +
            '    return user_crud.create(db, user_in)\n\n\n' +
            '@router.post("/login", response_model=Token)\n' +
            'def login(\n' +
            '    form_data: OAuth2PasswordRequestForm = Depends(),\n' +
            '    db: Session = Depends(get_db),\n' +
            '):\n' +
            '    user = user_crud.get_by_username(db, username=form_data.username)\n' +
            '    if not user or not verify_password(form_data.password, user.password_hash):\n' +
            '        raise HTTPException(\n' +
            '            status_code=status.HTTP_401_UNAUTHORIZED,\n' +
            '            detail="Incorrect username or password",\n' +
            '            headers={"WWW-Authenticate": "Bearer"},\n' +
            '        )\n' +
            '    access_token = create_access_token(data={"sub": user.username})\n' +
            '    return {"access_token": access_token, "token_type": "bearer"}\n\n\n' +
            '@router.get("/me", response_model=UserResponse)\n' +
            'def read_users_me(current_user = Depends(get_current_user)):\n' +
            '    return current_user\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/api/auth.py'), authRouter);
        // Backend: Users Router
        const usersRouter = '# File: app/api/users.py\n' +
            '# ============================================================================\n' +
            '# Users API Routes\n' +
            '# ============================================================================\n\n' +
            'from fastapi import APIRouter, Depends, HTTPException\n' +
            'from sqlalchemy.orm import Session\n' +
            'from typing import List\n\n' +
            'from app.db.session import get_db\n' +
            'from app.schemas.user import UserResponse, UserUpdate\n' +
            'from app.cruds.user_crud import user_crud\n' +
            'from app.api.auth import get_current_user\n' +
            'from app.models.user import User\n\n' +
            'router = APIRouter()\n\n\n' +
            '@router.get("/", response_model=List[UserResponse])\n' +
            'def list_users(\n' +
            '    skip: int = 0,\n' +
            '    limit: int = 100,\n' +
            '    db: Session = Depends(get_db),\n' +
            '    current_user: User = Depends(get_current_user),\n' +
            '):\n' +
            '    if not current_user.is_superuser:\n' +
            '        raise HTTPException(status_code=403, detail="Not enough permissions")\n' +
            '    users = user_crud.get_multi(db, skip=skip, limit=limit)\n' +
            '    return users\n\n\n' +
            '@router.get("/{user_id}", response_model=UserResponse)\n' +
            'def get_user(\n' +
            '    user_id: int,\n' +
            '    db: Session = Depends(get_db),\n' +
            '    current_user: User = Depends(get_current_user),\n' +
            '):\n' +
            '    user = user_crud.get(db, user_id=user_id)\n' +
            '    if user is None:\n' +
            '        raise HTTPException(status_code=404, detail="User not found")\n' +
            '    if user.id != current_user.id and not current_user.is_superuser:\n' +
            '        raise HTTPException(status_code=403, detail="Not enough permissions")\n' +
            '    return user\n\n\n' +
            '@router.patch("/{user_id}", response_model=UserResponse)\n' +
            'def update_user(\n' +
            '    user_id: int,\n' +
            '    user_in: UserUpdate,\n' +
            '    db: Session = Depends(get_db),\n' +
            '    current_user: User = Depends(get_current_user),\n' +
            '):\n' +
            '    user = user_crud.get(db, user_id=user_id)\n' +
            '    if user is None:\n' +
            '        raise HTTPException(status_code=404, detail="User not found")\n' +
            '    if user.id != current_user.id and not current_user.is_superuser:\n' +
            '        raise HTTPException(status_code=403, detail="Not enough permissions")\n' +
            '    return user_crud.update(db, user, user_in)\n\n\n' +
            '@router.delete("/{user_id}")\n' +
            'def delete_user(\n' +
            '    user_id: int,\n' +
            '    db: Session = Depends(get_db),\n' +
            '    current_user: User = Depends(get_current_user),\n' +
            '):\n' +
            '    if not current_user.is_superuser:\n' +
            '        raise HTTPException(status_code=403, detail="Not enough permissions")\n' +
            '    user = user_crud.delete(db, user_id=user_id)\n' +
            '    if user is None:\n' +
            '        raise HTTPException(status_code=404, detail="User not found")\n' +
            '    return {"message": "User deleted successfully"}\n';
        await fs.promises.writeFile(path.join(backendBase, 'app/api/users.py'), usersRouter);
        // Frontend: Login Page
        const loginPage = '"use client";\n\n' +
            'import { useState } from "react";\n' +
            'import { useRouter } from "next/navigation";\n' +
            'import Link from "next/link";\n\n' +
            'export default function LoginPage() {\n' +
            '  const router = useRouter();\n' +
            '  const [loading, setLoading] = useState(false);\n' +
            '  const [error, setError] = useState("");\n\n' +
            '  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {\n' +
            '    e.preventDefault();\n' +
            '    setLoading(true);\n' +
            '    setError("");\n\n' +
            '    const formData = new FormData(e.currentTarget);\n' +
            '    const username = formData.get("username") as string;\n' +
            '    const password = formData.get("password") as string;\n\n' +
            '    try {\n' +
            '      const response = await fetch("/api/auth/login", {\n' +
            '        method: "POST",\n' +
            '        headers: { "Content-Type": "application/x-www-form-urlencoded" },\n' +
            '        body: new URLSearchParams({ username, password }),\n' +
            '      });\n\n' +
            '      if (response.ok) {\n' +
            '        const data = await response.json();\n' +
            '        localStorage.setItem("token", data.access_token);\n' +
            '        router.push("/(dashboard)");\n' +
            '      } else {\n' +
            '        setError("Invalid username or password");\n' +
            '      }\n' +
            '    } catch {\n' +
            '      setError("An error occurred. Please try again.");\n' +
            '    } finally {\n' +
            '      setLoading(false);\n' +
            '    }\n' +
            '  }\n\n' +
            '  return (\n' +
            '    <div className="min-h-screen flex items-center justify-center bg-slate-50">\n' +
            '      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border">\n' +
            '        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>\n\n' +
            '        {error && (\n' +
            '          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">\n' +
            '            {error}\n' +
            '          </div>\n' +
            '        )}\n\n' +
            '        <form onSubmit={handleSubmit} className="space-y-4">\n' +
            '          <div>\n' +
            '            <label className="block text-sm font-medium mb-1">Username</label>\n' +
            '            <input\n' +
            '              name="username"\n' +
            '              type="text"\n' +
            '              required\n' +
            '              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"\n' +
            '            />\n' +
            '          </div>\n\n' +
            '          <div>\n' +
            '            <label className="block text-sm font-medium mb-1">Password</label>\n' +
            '            <input\n' +
            '              name="password"\n' +
            '              type="password"\n' +
            '              required\n' +
            '              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"\n' +
            '            />\n' +
            '          </div>\n\n' +
            '          <button\n' +
            '            type="submit"\n' +
            '            disabled={loading}\n' +
            '            className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"\n' +
            '          >\n' +
            '            {loading ? "Signing in..." : "Sign In"}\n' +
            '          </button>\n' +
            '        </form>\n\n' +
            '        <p className="mt-4 text-center text-sm text-slate-600">\n' +
            '          Don\'t have an account?{" "}\n' +
            '          <Link href="/register" className="text-primary hover:underline">\n' +
            '            Sign up\n' +
            '          </Link>\n' +
            '        </p>\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/(auth)/login/page.tsx'), loginPage);
        // Frontend: Dashboard Layout
        const dashboardLayout = '"use client";\n\n' +
            'import Link from "next/link";\n' +
            'import { usePathname } from "next/navigation";\n\n' +
            'const navigation = [\n' +
            '  { name: "Dashboard", href: "/(dashboard)" },\n' +
            '  { name: "Users", href: "/(dashboard)/admin/users" },\n' +
            '];\n\n' +
            'export default function DashboardLayout({\n' +
            '  children,\n' +
            '}: {\n' +
            '  children: React.ReactNode;\n' +
            '}) {\n' +
            '  const pathname = usePathname();\n\n' +
            '  return (\n' +
            '    <div className="min-h-screen bg-slate-50">\n' +
            '      {/* Sidebar */}\n' +
            '      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r">\n' +
            '        <div className="p-4 border-b">\n' +
            '          <h1 className="text-xl font-bold">' + this.options.projectName + '</h1>\n' +
            '        </div>\n' +
            '        <nav className="p-4 space-y-1">\n' +
            '          {navigation.map((item) => (\n' +
            '            <Link\n' +
            '              key={item.name}\n' +
            '              href={item.href}\n' +
            '              className={\n' +
            '                "block px-4 py-2 rounded-lg " +\n' +
            '                (pathname === item.href\n' +
            '                  ? "bg-primary text-white"\n' +
            '                  : "text-slate-600 hover:bg-slate-100")\n' +
            '              }\n' +
            '            >\n' +
            '              {item.name}\n' +
            '            </Link>\n' +
            '          ))}\n' +
            '        </nav>\n' +
            '      </div>\n\n' +
            '      {/* Main Content */}\n' +
            '      <div className="ml-64 p-8">{children}</div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/(dashboard)/layout.tsx'), dashboardLayout);
        // Frontend: Dashboard Page
        const dashboardPage = 'import { redirect } from "next/navigation";\n\n' +
            'export default function DashboardPage() {\n' +
            '  redirect("/(dashboard)/admin/users");\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/(dashboard)/page.tsx'), dashboardPage);
        // Frontend: Users Admin Page
        const usersPage = '"use client";\n\n' +
            'import { useState, useEffect } from "react";\n' +
            'import { useRouter } from "next/navigation";\n\n' +
            'interface User {\n' +
            '  id: number;\n' +
            '  email: string;\n' +
            '  username: string;\n' +
            '  full_name: string | null;\n' +
            '  is_active: boolean;\n' +
            '  created_at: string;\n' +
            '}\n\n' +
            'export default function UsersPage() {\n' +
            '  const router = useRouter();\n' +
            '  const [users, setUsers] = useState<User[]>([]);\n' +
            '  const [loading, setLoading] = useState(true);\n' +
            '  const [error, setError] = useState("");\n\n' +
            '  useEffect(() => {\n' +
            '    fetchUsers();\n' +
            '  }, []);\n\n' +
            '  async function fetchUsers() {\n' +
            '    try {\n' +
            '      const token = localStorage.getItem("token");\n' +
            '      if (!token) {\n' +
            '        router.push("/login");\n' +
            '        return;\n' +
            '      }\n\n' +
            '      const response = await fetch("/api/users/", {\n' +
            '        headers: {\n' +
            '          Authorization: `Bearer ${token}`,\n' +
            '        },\n' +
            '      });\n\n' +
            '      if (response.ok) {\n' +
            '        const data = await response.json();\n' +
            '        setUsers(data);\n' +
            '      } else {\n' +
            '        setError("Failed to fetch users");\n' +
            '      }\n' +
            '    } catch {\n' +
            '      setError("An error occurred");\n' +
            '    } finally {\n' +
            '      setLoading(false);\n' +
            '    }\n' +
            '  }\n\n' +
            '  if (loading) {\n' +
            '    return <div className="text-center py-20">Loading...</div>;\n' +
            '  }\n\n' +
            '  if (error) {\n' +
            '    return (\n' +
            '      <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>\n' +
            '    );\n' +
            '  }\n\n' +
            '  return (\n' +
            '    <div>\n' +
            '      <div className="flex items-center justify-between mb-6">\n' +
            '        <h1 className="text-2xl font-bold">Users</h1>\n' +
            '      </div>\n\n' +
            '      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">\n' +
            '        <table className="w-full">\n' +
            '          <thead className="bg-slate-50">\n' +
            '            <tr>\n' +
            '              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">\n' +
            '                ID\n' +
            '              </th>\n' +
            '              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">\n' +
            '                Username\n' +
            '              </th>\n' +
            '              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">\n' +
            '                Email\n' +
            '              </th>\n' +
            '              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">\n' +
            '                Name\n' +
            '              </th>\n' +
            '              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">\n' +
            '                Status\n' +
            '              </th>\n' +
            '            </tr>\n' +
            '          </thead>\n' +
            '          <tbody className="divide-y">\n' +
            '            {users.map((user) => (\n' +
            '              <tr key={user.id}>\n' +
            '                <td className="px-6 py-4 text-sm text-slate-600">{user.id}</td>\n' +
            '                <td className="px-6 py-4 text-sm font-medium">\n' +
            '                  {user.username}\n' +
            '                </td>\n' +
            '                <td className="px-6 py-4 text-sm text-slate-600">\n' +
            '                  {user.email}\n' +
            '                </td>\n' +
            '                <td className="px-6 py-4 text-sm text-slate-600">\n' +
            '                  {user.full_name || "-"}\n' +
            '                </td>\n' +
            '                <td className="px-6 py-4">\n' +
            '                  <span\n' +
            '                    className={`px-2 py-1 text-xs rounded-full ${\n' +
            '                      user.is_active\n' +
            '                        ? "bg-green-100 text-green-700"\n' +
            '                        : "bg-red-100 text-red-700"\n' +
            '                    }`}\n' +
            '                  >\n' +
            '                    {user.is_active ? "Active" : "Inactive"}\n' +
            '                  </span>\n' +
            '                </td>\n' +
            '              </tr>\n' +
            '            ))}\n' +
            '          </tbody>\n' +
            '        </table>\n\n' +
            '        {users.length === 0 && (\n' +
            '          <div className="text-center py-12 text-slate-500">\n' +
            '            No users found\n' +
            '          </div>\n' +
            '        )}\n' +
            '      </div>\n' +
            '    </div>\n' +
            '  );\n' +
            '}\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/app/(dashboard)/admin/users/page.tsx'), usersPage);
        // Frontend: API Service
        const apiService = 'import axios from "axios";\n\n' +
            'const api = axios.create({\n' +
            '  baseURL: "/api",\n' +
            '  timeout: 10000,\n' +
            '});\n\n' +
            '// Add auth interceptor\n' +
            'api.interceptors.request.use((config) => {\n' +
            '  const token = localStorage.getItem("token");\n' +
            '  if (token) {\n' +
            '    config.headers.Authorization = `Bearer ${token}`;\n' +
            '  }\n' +
            '  return config;\n' +
            '});\n\n' +
            '// Response interceptor\n' +
            'api.interceptors.response.use(\n' +
            '  (response) => response,\n' +
            '  (error) => {\n' +
            '    if (error.response?.status === 401) {\n' +
            '      localStorage.removeItem("token");\n' +
            '      window.location.href = "/login";\n' +
            '    }\n' +
            '    return Promise.reject(error);\n' +
            '  }\n' +
            ');\n\n' +
            'export default api;\n';
        await fs.promises.writeFile(path.join(frontendBase, 'src/services/api.ts'), apiService);
        console.log('   ✅ User management created');
    }
    /**
     * 创建数据库配置
     */
    async createDatabaseConfig() {
        console.log('   🗄️  Creating database configuration...');
        const base = this.options.projectPath;
        const backendBase = path.join(base, 'backend');
        const projectName = this.options.projectName;
        // .env.example
        await fs.promises.writeFile(path.join(backendBase, '.env.example'), '# Database\n' +
            'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/' + projectName + '\n\n' +
            '# Security\n' +
            'SECRET_KEY=your-secret-key-change-in-production\n');
        // .env (default)
        await fs.promises.writeFile(path.join(backendBase, '.env'), '# Database\n' +
            'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/' + projectName + '\n\n' +
            '# Security\n' +
            'SECRET_KEY=dev-secret-key-change-in-production\n');
        // alembic.ini
        await fs.promises.writeFile(path.join(backendBase, 'alembic.ini'), '[alembic]\n' +
            'script_location = alembic\n' +
            'prepend_sys_path = .\n' +
            'version_path_separator = os\n\n' +
            'sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/' + projectName + '\n\n' +
            '[post_write_hooks]\n\n' +
            '[loggers]\n' +
            'keys = root,sqlalchemy,alembic\n\n' +
            '[handlers]\n' +
            'keys = console\n\n' +
            '[formatters]\n' +
            'keys = generic\n\n' +
            '[logger_root]\n' +
            'level = WARN\n' +
            'handlers = console\n' +
            'qualname =\n\n' +
            '[logger_sqlalchemy]\n' +
            'level = WARN\n' +
            'handlers =\n' +
            'qualname = sqlalchemy.engine\n\n' +
            '[logger_alembic]\n' +
            'level = INFO\n' +
            'handlers =\n' +
            'qualname = alembic\n\n' +
            '[handler_console]\n' +
            'class = StreamHandler\n' +
            'args = (sys.stderr,)\n' +
            'level = NOTSET\n' +
            'formatter = generic\n\n' +
            '[formatter_generic]\n' +
            'format = %(levelname)-5.5s [%(name)s] %(message)s\n' +
            'datefmt = %H:%M:%S\n');
        // alembic env.py
        const alembicEnv = '# File: alembic/env.py\n' +
            '# ============================================================================\n' +
            '# Alembic Migration Environment\n' +
            '# ============================================================================\n\n' +
            'from logging.config import fileConfig\n' +
            'from sqlalchemy import engine_from_config, pool\n' +
            'from alembic import context\n\n' +
            'from app.db.base import Base\n' +
            'from app.core.config import settings\n\n' +
            'config = context.config\n' +
            'config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)\n\n' +
            'if config.config_file_name is not None:\n' +
            '    fileConfig(config.config_file_name)\n\n' +
            'target_metadata = Base.metadata\n\n\n' +
            'def run_migrations_offline() -> None:\n' +
            '    url = config.get_main_option("sqlalchemy.url")\n' +
            '    context.configure(\n' +
            '        url=url,\n' +
            '        target_metadata=target_metadata,\n' +
            '        literal_binds=True,\n' +
            '        dialect_opts={"paramstyle": "named"},\n' +
            '    )\n' +
            '    with context.begin_transaction():\n' +
            '        context.run_migrations()\n\n\n' +
            'def run_migrations_online() -> None:\n' +
            '    connectable = engine_from_config(\n' +
            '        config.get_section(config.config_ini_section, {}),\n' +
            '        prefix="sqlalchemy.",\n' +
            '        poolclass=pool.NullPool,\n' +
            '    )\n' +
            '    with connectable.connect() as connection:\n' +
            '        context.configure(connection=connection, target_metadata=target_metadata)\n' +
            '        with context.begin_transaction():\n' +
            '            context.run_migrations()\n\n\n' +
            'if context.is_offline_mode():\n' +
            '    run_migrations_offline()\n' +
            'else:\n' +
            '    run_migrations_online()\n';
        await fs.promises.writeFile(path.join(backendBase, 'alembic/env.py'), alembicEnv);
        // alembic script.py.mako
        const alembicScript = '"""${message}\n\n' +
            'Revision ID: ${up_revision}\n' +
            'Revises: ${down_revision | comma,n}\n' +
            'Create Date: ${create_date}\n\n' +
            '"""\n' +
            'from typing import Sequence, Union\n' +
            'from alembic import op\n' +
            'import sqlalchemy as sa\n\n' +
            '# revision identifiers, used by Alembic.\n' +
            'revision: str = ${repr(up_revision)}\n' +
            'down_revision: Union[str, None] = ${repr(down_revision)}\n' +
            'branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}\n' +
            'depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}\n\n\n' +
            'def upgrade() -> None:\n' +
            '    ${upgrades if upgrades else "pass"}\n\n\n' +
            'def downgrade() -> None:\n' +
            '    ${downgrades if downgrades else "pass"}\n';
        await fs.promises.writeFile(path.join(backendBase, 'alembic/script.py.mako'), alembicScript);
        console.log('   ✅ Database configuration created');
    }
    /**
     * 创建 docker-compose
     */
    async createDockerCompose() {
        console.log('   🐳 Creating docker-compose...');
        const base = this.options.projectPath;
        const projectName = this.options.projectName;
        const dockerCompose = 'version: \'3.8\'\n\n' +
            'services:\n' +
            '  db:\n' +
            '    image: postgres:16-alpine\n' +
            '    environment:\n' +
            '      POSTGRES_USER: postgres\n' +
            '      POSTGRES_PASSWORD: postgres\n' +
            '      POSTGRES_DB: ' + projectName + '\n' +
            '    ports:\n' +
            '      - "5432:5432"\n' +
            '    volumes:\n' +
            '      - postgres_data:/var/lib/postgresql/data\n\n' +
            '  backend:\n' +
            '    build: ./backend\n' +
            '    ports:\n' +
            '      - "8000:8000"\n' +
            '    environment:\n' +
            '      DATABASE_URL: postgresql://postgres:postgres@db:5432/' + projectName + '\n' +
            '      SECRET_KEY: dev-secret-key\n' +
            '    depends_on:\n' +
            '      - db\n\n' +
            '  frontend:\n' +
            '    build: ./frontend\n' +
            '    ports:\n' +
            '      - "3000:3000"\n' +
            '    depends_on:\n' +
            '      - backend\n\n' +
            'volumes:\n' +
            '  postgres_data:\n';
        await fs.promises.writeFile(path.join(base, 'docker-compose.yml'), dockerCompose);
        // Backend Dockerfile
        const backendDockerfile = 'FROM python:3.11-slim\n\n' +
            'WORKDIR /app\n\n' +
            'COPY requirements.txt .\n' +
            'RUN pip install --no-cache-dir -r requirements.txt\n\n' +
            'COPY . .\n\n' +
            'EXPOSE 8000\n\n' +
            'CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]\n';
        await fs.promises.writeFile(path.join(base, 'backend', 'Dockerfile'), backendDockerfile);
        // Frontend Dockerfile
        const frontendDockerfile = 'FROM node:18-alpine\n\n' +
            'WORKDIR /app\n\n' +
            'COPY package*.json ./\n' +
            'RUN npm install\n\n' +
            'COPY . .\n\n' +
            'RUN npm run build\n\n' +
            'EXPOSE 3000\n\n' +
            'CMD ["npm", "start"]\n';
        await fs.promises.writeFile(path.join(base, 'frontend', 'Dockerfile'), frontendDockerfile);
        console.log('   ✅ Docker configuration created');
    }
}
/**
 * 便捷函数：创建新项目
 */
export async function scaffoldProject(options) {
    const scaffolder = new ProjectScaffolder(options);
    await scaffolder.scaffold();
}
//# sourceMappingURL=index.js.map