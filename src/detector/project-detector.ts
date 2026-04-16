// ============================================================================
// 项目自动检测器 - Modularity-skill
// 检测用户项目的技术栈和框架
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';

export interface DetectedProject {
  type: 'fastapi' | 'express' | 'nextjs' | 'nuxt' | 'django' | 'laravel' | 'unknown';
  language: 'python' | 'typescript' | 'javascript' | 'php';
  frontend?: 'react' | 'vue' | 'nextjs' | 'nuxt';
  structure: ProjectStructure;
}

export interface ProjectStructure {
  backend_path?: string;
  frontend_path?: string;
  has_monorepo: boolean;
  package_json?: any;
  pyproject_toml?: any;
  requirements_txt?: string;
}

/**
 * 项目检测器
 */
export class ProjectDetector {
  /**
   * 检测项目类型
   */
  async detect(cwd: string = process.cwd()): Promise<DetectedProject> {
    const structure = await this.analyzeStructure(cwd);
    return this.identifyType(structure);
  }

  /**
   * 分析项目结构
   */
  private async analyzeStructure(cwd: string): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      has_monorepo: false,
    };

    // 检查 package.json
    const packageJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      structure.package_json = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // 检查是否是 monorepo
      if (structure.package_json.workspaces) {
        structure.has_monorepo = true;
      }
    }

    // 检查 pyproject.toml (Python)
    const pyprojectPath = path.join(cwd, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      structure.pyproject_toml = fs.readFileSync(pyprojectPath, 'utf-8');
    }

    // 检查 requirements.txt
    const requirementsPath = path.join(cwd, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      structure.requirements_txt = fs.readFileSync(requirementsPath, 'utf-8');
    }

    // 检测后端路径
    if (structure.pyproject_toml || structure.requirements_txt) {
      structure.backend_path = cwd;
    }

    // 检测前端路径
    if (structure.package_json) {
      const deps = { ...structure.package_json.dependencies, ...structure.package_json.devDependencies };

      if (deps.next) {
        structure.frontend_path = cwd;
      } else if (deps.nuxt) {
        structure.frontend_path = cwd;
      } else if (deps.react) {
        structure.frontend_path = cwd;
      } else if (deps.vue) {
        structure.frontend_path = cwd;
      }
    }

    // 检测 monorepo 子目录
    if (structure.has_monorepo && structure.package_json.workspaces) {
      const workspaces = structure.package_json.workspaces;
      for (const workspace of workspaces) {
        const workspacePath = path.join(cwd, workspace);
        if (fs.existsSync(workspacePath)) {
          // 检查后端
          if (fs.existsSync(path.join(workspacePath, 'pyproject.toml'))) {
            structure.backend_path = workspacePath;
          }
          // 检查前端
          if (fs.existsSync(path.join(workspacePath, 'package.json'))) {
            structure.frontend_path = workspacePath;
          }
        }
      }
    }

    // 常见后端目录结构
    const backendDirs = ['backend', 'api', 'server', 'app'];
    for (const dir of backendDirs) {
      const dirPath = path.join(cwd, dir);
      if (fs.existsSync(dirPath)) {
        if (fs.existsSync(path.join(dirPath, 'pyproject.toml')) ||
            fs.existsSync(path.join(dirPath, 'requirements.txt'))) {
          structure.backend_path = dirPath;
        }
        if (fs.existsSync(path.join(dirPath, 'package.json'))) {
          structure.frontend_path = dirPath;
        }
      }
    }

    // 常见前端目录结构
    const frontendDirs = ['frontend', 'client', 'web', 'src'];
    for (const dir of frontendDirs) {
      const dirPath = path.join(cwd, dir);
      if (fs.existsSync(dirPath)) {
        if (fs.existsSync(path.join(dirPath, 'package.json'))) {
          structure.frontend_path = dirPath;
        }
      }
    }

    return structure;
  }

  /**
   * 识别项目类型
   */
  private identifyType(structure: ProjectStructure): DetectedProject {
    const result: DetectedProject = {
      type: 'unknown',
      language: 'typescript',
      structure,
    };

    // Python 项目
    if (structure.pyproject_toml || structure.requirements_txt) {
      result.language = 'python';

      // FastAPI
      if (structure.requirements_txt?.includes('fastapi') ||
          structure.pyproject_toml?.includes('fastapi')) {
        result.type = 'fastapi';
      }
      // Django
      else if (structure.requirements_txt?.includes('django') ||
               structure.pyproject_toml?.includes('django')) {
        result.type = 'django';
      }
      else {
        result.type = 'fastapi'; // 默认 Python 项目为 FastAPI
      }
    }

    // Node.js 项目
    if (structure.package_json) {
      const deps = { ...structure.package_json.dependencies, ...structure.package_json.devDependencies };

      // Next.js
      if (deps.next) {
        result.type = 'nextjs';
        result.frontend = 'nextjs';
        result.language = 'typescript';
      }
      // Nuxt
      else if (deps.nuxt) {
        result.type = 'nuxt';
        result.frontend = 'nuxt';
        result.language = 'typescript';
      }
      // Express
      else if (deps.express) {
        result.type = 'express';
        result.language = 'javascript';
      }
      // React
      else if (deps.react) {
        result.type = 'express'; // 前后端分离，API 用 Express
        result.frontend = 'react';
        result.language = 'typescript';
      }
      // Vue
      else if (deps.vue) {
        result.type = 'express';
        result.frontend = 'vue';
        result.language = 'typescript';
      }
    }

    return result;
  }

  /**
   * 获取建议的模块安装路径
   */
  getSuggestedPaths(project: DetectedProject): { backend: string; frontend: string } {
    const backend = project.structure.backend_path || project.structure.frontend_path || '.';
    const frontend = project.structure.frontend_path || '.';

    return { backend, frontend };
  }
}

/**
 * 便捷函数：检测项目
 */
export async function detectProject(cwd?: string): Promise<DetectedProject> {
  const detector = new ProjectDetector();
  return detector.detect(cwd);
}
