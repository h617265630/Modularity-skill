// ============================================================================
// Project Scanner - Feature Compiler AI
// 自动扫描项目结构
// ============================================================================

import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

export interface ProjectStructure {
  root: string;
  backend?: BackendStructure;
  frontend?: FrontendStructure;
  database?: DatabaseStructure;
  type: 'mono' | 'separate' | 'frontend-only' | 'backend-only' | 'empty';
}

export interface BackendStructure {
  path: string;
  framework: 'fastapi' | 'express' | 'django' | 'flask' | 'nextjs' | 'unknown';
  language: 'python' | 'javascript' | 'typescript' | 'unknown';
  appDir: string;          // e.g., backend/app
  apiDir: string;         // e.g., backend/app/api
  modelsDir: string;      // e.g., backend/app/models
  servicesDir: string;    // e.g., backend/app/services
  schemasDir: string;     // e.g., backend/app/schemas
  crudsDir: string;       // e.g., backend/app/cruds
  migrationsDir: string;   // e.g., backend/migrations
  mainFile: string;       // e.g., backend/main.py
}

export interface FrontendStructure {
  path: string;
  framework: 'react' | 'vue' | 'angular' | 'nextjs' | 'unknown';
  language: 'typescript' | 'javascript' | 'unknown';
  srcDir: string;         // e.g., frontend/src
  componentsDir: string;   // e.g., frontend/src/components
  hooksDir: string;        // e.g., frontend/src/hooks
  pagesDir: string;         // e.g., frontend/src/pages
  apiDir: string;          // e.g., frontend/src/api
  servicesDir: string;      // e.g., frontend/src/services
}

export interface DatabaseStructure {
  path: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'unknown';
  migrationsDir: string;
}

export class ProjectScanner {
  /**
   * 扫描项目结构
   */
  scan(projectPath: string): ProjectStructure {
    const structure: ProjectStructure = {
      root: projectPath,
      type: 'empty',
    };

    if (!existsSync(projectPath)) {
      return structure;
    }

    const entries = this.getDirEntries(projectPath);
    const dirs = entries.filter(e => e.isDirectory).map(e => e.name);
    const files = entries.filter(e => e.isFile).map(e => e.name);

    // 检测后端
    const backendDirs = ['backend', 'api', 'server', 'app'];
    const hasBackend = dirs.some(d => backendDirs.includes(d));
    if (hasBackend) {
      const backendPath = this.findBackendPath(projectPath, dirs);
      if (backendPath) {
        structure.backend = this.scanBackend(backendPath);
      }
    }

    // 检测前端
    const frontendDirs = ['frontend', 'client', 'web', 'src', 'pages'];
    const hasFrontend = dirs.some(d => frontendDirs.includes(d)) || files.some(f => f === 'package.json');
    if (hasFrontend) {
      const frontendPath = this.findFrontendPath(projectPath, dirs, files);
      if (frontendPath) {
        structure.frontend = this.scanFrontend(frontendPath);
      }
    }

    // 检测数据库
    const dbDirs = ['database', 'db', 'migrations', 'sql'];
    const hasDb = dirs.some(d => dbDirs.includes(d));
    if (hasDb) {
      const dbPath = this.findDbPath(projectPath, dirs);
      if (dbPath) {
        structure.database = this.scanDatabase(dbPath);
      }
    }

    // 确定项目类型
    structure.type = this.determineProjectType(structure);

    return structure;
  }

  /**
   * 扫描后端结构
   */
  private scanBackend(path: string): BackendStructure {
    const entries = this.getDirEntries(path);
    const dirs = entries.filter(e => e.isDirectory).map(e => e.name);
    const files = entries.filter(e => e.isFile).map(e => e.name);

    // 检测框架
    const framework = this.detectBackendFramework(path, dirs, files);

    // 检测语言
    const language = this.detectBackendLanguage(path, files);

    // 查找关键目录
    const appDir = this.findDir(path, ['app', 'api', 'application', 'src']);
    const apiDir = appDir ? this.findDir(appDir, ['api', 'routes', 'endpoints']) : appDir;
    const modelsDir = appDir ? this.findDir(appDir, ['models', 'entities', 'schemas']) : appDir;
    const servicesDir = appDir ? this.findDir(appDir, ['services', 'business', 'logic']) : appDir;
    const schemasDir = appDir ? this.findDir(appDir, ['schemas', 'dto', 'validators']) : appDir;
    const crudsDir = appDir ? this.findDir(appDir, ['cruds', 'repositories', 'dal']) : appDir;

    // 查找迁移目录
    const migrationsDir = this.findDir(path, ['migrations', 'alembic', 'db']);

    // 查找入口文件
    const mainFile = this.findMainFile(path, files, framework);

    return {
      path,
      framework,
      language,
      appDir: appDir || path,
      apiDir: apiDir || (appDir ? appDir : path),
      modelsDir: modelsDir || (appDir ? appDir : path),
      servicesDir: servicesDir || (appDir ? appDir : path),
      schemasDir: schemasDir || (appDir ? appDir : path),
      crudsDir: crudsDir || (appDir ? appDir : path),
      migrationsDir: migrationsDir || join(path, 'migrations'),
      mainFile,
    };
  }

  /**
   * 扫描前端结构
   */
  private scanFrontend(path: string): FrontendStructure {
    const entries = this.getDirEntries(path);
    const dirs = entries.filter(e => e.isDirectory).map(e => e.name);
    const files = entries.filter(e => e.isFile).map(e => e.name);

    // 检测框架
    const framework = this.detectFrontendFramework(path, dirs, files);

    // 检测语言
    const language = this.detectFrontendLanguage(path, files);

    // 查找关键目录
    const srcDir = this.findDir(path, ['src', 'app', 'source']) || path;
    const componentsDir = this.findDir(srcDir, ['components', 'Component', 'ui']);
    const hooksDir = this.findDir(srcDir, ['hooks', 'useHooks', 'composables']);
    const pagesDir = this.findDir(srcDir, ['pages', 'views', 'screens']);
    const apiDir = this.findDir(srcDir, ['api', 'services', 'http']);
    const servicesDir = this.findDir(srcDir, ['services', 'store', 'state']);

    return {
      path,
      framework,
      language,
      srcDir,
      componentsDir: componentsDir || join(srcDir, 'components'),
      hooksDir: hooksDir || join(srcDir, 'hooks'),
      pagesDir: pagesDir || join(srcDir, 'pages'),
      apiDir: apiDir || join(srcDir, 'api'),
      servicesDir: servicesDir || join(srcDir, 'services'),
    };
  }

  /**
   * 扫描数据库结构
   */
  private scanDatabase(path: string): DatabaseStructure {
    const entries = this.getDirEntries(path);
    const dirs = entries.filter(e => e.isDirectory).map(e => e.name);
    const files = entries.filter(e => e.isFile).map(e => e.name);

    // 检测数据库类型
    const type = this.detectDatabaseType(path, files);

    // 查找迁移目录
    const migrationsDir = this.findDir(path, ['migrations', 'alembic', 'sql']) || path;

    return {
      path,
      type,
      migrationsDir,
    };
  }

  /**
   * 检测后端框架
   */
  private detectBackendFramework(path: string, dirs: string[], files: string[]): BackendStructure['framework'] {
    if (files.some(f => f === 'requirements.txt')) {
      const content = this.readFileIfExists(join(path, 'requirements.txt')) || '';
      if (content.includes('fastapi')) return 'fastapi';
      if (content.includes('django')) return 'django';
      if (content.includes('flask')) return 'flask';
    }
    if (files.some(f => f === 'package.json')) return 'express';
    if (dirs.includes('app')) return 'fastapi'; // 常见于 FastAPI
    return 'unknown';
  }

  /**
   * 检测后端语言
   */
  private detectBackendLanguage(path: string, files: string[]): BackendStructure['language'] {
    if (files.some(f => f.endsWith('.py'))) return 'python';
    if (files.some(f => f.endsWith('.js') || f.endsWith('.ts'))) return 'javascript';
    return 'unknown';
  }

  /**
   * 检测前端框架
   */
  private detectFrontendFramework(path: string, dirs: string[], files: string[]): FrontendStructure['framework'] {
    const packageJson = this.readFileIfExists(join(path, 'package.json'));
    if (packageJson) {
      const content = packageJson.toLowerCase();
      if (content.includes('nextjs') || content.includes('"next"')) return 'nextjs';
      if (content.includes('vue')) return 'vue';
      if (content.includes('angular')) return 'angular';
      if (content.includes('react')) return 'react';
    }
    if (files.some(f => f.endsWith('.tsx') || f.endsWith('.jsx'))) return 'react';
    if (dirs.includes('pages')) return 'nextjs'; // Next.js 特有
    return 'unknown';
  }

  /**
   * 检测前端语言
   */
  private detectFrontendLanguage(path: string, files: string[]): FrontendStructure['language'] {
    if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) return 'typescript';
    if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) return 'javascript';
    return 'unknown';
  }

  /**
   * 检测数据库类型
   */
  private detectDatabaseType(path: string, files: string[]): DatabaseStructure['type'] {
    if (files.some(f => f.includes('alembic') || f.includes('pg'))) return 'postgresql';
    if (files.some(f => f.includes('mysql') || f.includes('migrations'))) return 'mysql';
    if (files.some(f => f.endsWith('.sqlite'))) return 'sqlite';
    if (files.some(f => f.includes('mongo'))) return 'mongodb';
    return 'unknown';
  }

  /**
   * 确定项目类型
   */
  private determineProjectType(structure: ProjectStructure): ProjectStructure['type'] {
    if (!structure.backend && !structure.frontend) return 'empty';
    if (structure.backend && structure.frontend) return 'mono';
    if (structure.backend) return 'backend-only';
    if (structure.frontend) return 'frontend-only';
    return 'empty';
  }

  /**
   * 查找后端路径
   */
  private findBackendPath(root: string, dirs: string[]): string | null {
    const candidates = ['backend', 'server', 'api', 'app'];
    for (const dir of dirs) {
      if (candidates.includes(dir)) {
        const path = join(root, dir);
        if (this.hasBackendFiles(path)) {
          return path;
        }
      }
    }
    // 如果没找到，但根目录有后端文件
    if (this.hasBackendFiles(root)) {
      return root;
    }
    return null;
  }

  /**
   * 查找前端路径
   */
  private findFrontendPath(root: string, dirs: string[], files: string[]): string | null {
    // 优先检查 frontend 目录
    if (dirs.includes('frontend')) {
      return join(root, 'frontend');
    }
    // 检查 client
    if (dirs.includes('client')) {
      return join(root, 'client');
    }
    // 检查 web
    if (dirs.includes('web')) {
      return join(root, 'web');
    }
    // 检查是否有 src 目录
    if (dirs.includes('src')) {
      return root;
    }
    // 检查是否有 package.json
    if (files.includes('package.json')) {
      return root;
    }
    return null;
  }

  /**
   * 查找数据库路径
   */
  private findDbPath(root: string, dirs: string[]): string | null {
    const candidates = ['database', 'db', 'migrations', 'sql'];
    for (const dir of dirs) {
      if (candidates.includes(dir)) {
        return join(root, dir);
      }
    }
    // 检查是否有 alembic 目录
    for (const dir of dirs) {
      if (dir.toLowerCase().includes('alembic')) {
        return join(root, dir);
      }
    }
    return null;
  }

  /**
   * 检查目录是否有后端文件
   */
  private hasBackendFiles(path: string): boolean {
    try {
      const entries = this.getDirEntries(path);
      const files = entries.filter(e => e.isFile).map(e => e.name);
      const dirs = entries.filter(e => e.isDirectory).map(e => e.name);

      const backendIndicators = [
        'requirements.txt', 'setup.py', 'Pipfile', 'pyproject.toml',
        'package.json', 'server.js', 'index.js',
        'main.py', 'app.py', 'server.py'
      ];

      if (files.some(f => backendIndicators.includes(f))) return true;
      if (dirs.includes('app') || dirs.includes('api') || dirs.includes('src')) return true;

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 查找主入口文件
   */
  private findMainFile(path: string, files: string[], framework: string): string {
    const candidates: Record<string, string[]> = {
      fastapi: ['main.py', 'app.py', 'server.py'],
      django: ['manage.py', 'settings.py'],
      express: ['server.js', 'index.js', 'app.js'],
    };

    const frameworkCandidates = candidates[framework] || [];
    for (const candidate of frameworkCandidates) {
      if (files.includes(candidate)) {
        return join(path, candidate);
      }
    }

    // 默认返回值
    if (files.some(f => f.endsWith('.py'))) {
      const pyFiles = files.filter(f => f.endsWith('.py'));
      return join(path, pyFiles[0]);
    }

    return join(path, 'main.py');
  }

  /**
   * 查找目录
   */
  private findDir(base: string, candidates: string[]): string | null {
    try {
      const entries = this.getDirEntries(base);
      const dirs = entries.filter(e => e.isDirectory).map(e => e.name);

      for (const candidate of candidates) {
        if (dirs.includes(candidate)) {
          return join(base, candidate);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 获取目录条目
   */
  private getDirEntries(path: string): Array<{ name: string; isDirectory: boolean; isFile: boolean }> {
    try {
      return readdirSync(path).map(name => {
        const fullPath = join(path, name);
        const stat = statSync(fullPath);
        return {
          name,
          isDirectory: stat.isDirectory(),
          isFile: stat.isFile(),
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * 读取文件内容（如果存在）
   */
  private readFileIfExists(path: string): string | null {
    try {
      const { readFileSync } = require('fs');
      return readFileSync(path, 'utf-8');
    } catch {
      return null;
    }
  }
}

/**
 * 打印项目结构（调试用）
 */
export function printProjectStructure(structure: ProjectStructure): string {
  let output = '\n📁 Project Structure Scan Result\n';
  output += '='.repeat(50) + '\n\n';

  output += `Type: ${structure.type}\n`;
  output += `Root: ${structure.root}\n\n`;

  if (structure.backend) {
    output += `🔧 Backend (${structure.backend.framework})\n`;
    output += `   Path: ${structure.backend.path}\n`;
    output += `   Language: ${structure.backend.language}\n`;
    output += `   App Dir: ${structure.backend.appDir}\n`;
    output += `   API Dir: ${structure.backend.apiDir}\n`;
    output += `   Models Dir: ${structure.backend.modelsDir}\n`;
    output += `   Services Dir: ${structure.backend.servicesDir}\n`;
    output += `   Schemas Dir: ${structure.backend.schemasDir}\n`;
    output += `   Cruds Dir: ${structure.backend.crudsDir}\n`;
    output += `   Migrations Dir: ${structure.backend.migrationsDir}\n`;
    output += `   Main File: ${structure.backend.mainFile}\n\n`;
  }

  if (structure.frontend) {
    output += `🎨 Frontend (${structure.frontend.framework})\n`;
    output += `   Path: ${structure.frontend.path}\n`;
    output += `   Language: ${structure.frontend.language}\n`;
    output += `   Src Dir: ${structure.frontend.srcDir}\n`;
    output += `   Components Dir: ${structure.frontend.componentsDir}\n`;
    output += `   Hooks Dir: ${structure.frontend.hooksDir}\n`;
    output += `   Pages Dir: ${structure.frontend.pagesDir}\n`;
    output += `   API Dir: ${structure.frontend.apiDir}\n\n`;
  }

  if (structure.database) {
    output += `🗄️  Database (${structure.database.type})\n`;
    output += `   Path: ${structure.database.path}\n`;
    output += `   Migrations Dir: ${structure.database.migrationsDir}\n\n`;
  }

  return output;
}