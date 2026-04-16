// ============================================================================
// 文件写入器 - Modularity-skill
// 将生成的代码写入用户项目
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';

export interface WriteResult {
  success: boolean;
  files_written: string[];
  files_skipped: string[];
  errors: { path: string; error: string }[];
}

export interface FilePatch {
  path: string;
  content: string;
  action: 'create' | 'modify' | 'skip';
}

const PROTECTED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.env',
  '.env.local',
  '.env.production',
  'secrets',
  'password',
  'config.prod',
  '.next',
  '.nuxt',
];

/**
 * 文件写入器
 */
export class FileWriter {
  private dryRun: boolean;
  private basePath: string;

  constructor(basePath: string = process.cwd(), dryRun: boolean = true) {
    this.basePath = basePath;
    this.dryRun = dryRun;
  }

  /**
   * 设置是否干跑模式
   */
  setDryRun(dryRun: boolean): void {
    this.dryRun = dryRun;
  }

  /**
   * 写入文件
   */
  async write(patches: FilePatch[]): Promise<WriteResult> {
    const result: WriteResult = {
      success: true,
      files_written: [],
      files_skipped: [],
      errors: [],
    };

    for (const patch of patches) {
      const fullPath = path.join(this.basePath, patch.path);

      // 检查是否是受保护路径
      if (this.isProtectedPath(patch.path)) {
        result.files_skipped.push(patch.path);
        continue;
      }

      try {
        // 确保目录存在
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          if (!this.dryRun) {
            fs.mkdirSync(dir, { recursive: true });
          }
        }

        // 检查文件是否存在
        if (fs.existsSync(fullPath) && patch.action === 'skip') {
          result.files_skipped.push(patch.path);
          continue;
        }

        // 写入文件
        if (!this.dryRun) {
          fs.writeFileSync(fullPath, patch.content, 'utf-8');
        }

        result.files_written.push(patch.path);
      } catch (error: any) {
        result.errors.push({
          path: patch.path,
          error: error.message,
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * 写入后端代码
   */
  async writeBackend(patches: FilePatch[], backendPath?: string): Promise<WriteResult> {
    const originalBase = this.basePath;
    if (backendPath) {
      this.basePath = backendPath;
    }
    const result = await this.write(patches);
    this.basePath = originalBase;
    return result;
  }

  /**
   * 写入前端代码
   */
  async writeFrontend(patches: FilePatch[], frontendPath?: string): Promise<WriteResult> {
    const originalBase = this.basePath;
    if (frontendPath) {
      this.basePath = frontendPath;
    }
    const result = await this.write(patches);
    this.basePath = originalBase;
    return result;
  }

  /**
   * 检查是否是受保护路径
   */
  private isProtectedPath(filePath: string): boolean {
    const normalized = path.normalize(filePath);
    for (const protectedPath of PROTECTED_PATHS) {
      if (normalized.includes(protectedPath)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 预览写入结果（不实际写入）
   */
  async preview(patches: FilePatch[]): Promise<WriteResult> {
    this.setDryRun(true);
    return this.write(patches);
  }
}

/**
 * 从代码补丁生成文件补丁
 */
export function generateFilePatches(code: string, type: 'backend' | 'frontend' | 'database'): FilePatch[] {
  const patches: FilePatch[] = [];

  if (type === 'backend') {
    // 解析后端代码，生成文件路径和内容
    const lines = code.split('\n');
    let currentFile = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // 检测文件头（如 # File: app/api/comment.py）
      const fileMatch = line.match(/^#\s*File:\s*(.+)$/);
      if (fileMatch) {
        // 保存上一个文件
        if (currentFile && currentContent.length > 0) {
          patches.push({
            path: currentFile,
            content: currentContent.join('\n'),
            action: 'create',
          });
        }
        currentFile = fileMatch[1].trim();
        currentContent = [];
      } else if (currentFile) {
        currentContent.push(line);
      }
    }

    // 保存最后一个文件
    if (currentFile && currentContent.length > 0) {
      patches.push({
        path: currentFile,
        content: currentContent.join('\n'),
        action: 'create',
      });
    }
  }

  if (type === 'frontend') {
    // 解析前端代码
    const lines = code.split('\n');
    let currentFile = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // 检测文件头（如 // File: src/components/Comment.tsx）
      const fileMatch = line.match(/^\/\/\s*File:\s*(.+)$/);
      if (fileMatch) {
        if (currentFile && currentContent.length > 0) {
          patches.push({
            path: currentFile,
            content: currentContent.join('\n'),
            action: 'create',
          });
        }
        currentFile = fileMatch[1].trim();
        currentContent = [];
      } else if (currentFile) {
        currentContent.push(line);
      }
    }

    if (currentFile && currentContent.length > 0) {
      patches.push({
        path: currentFile,
        content: currentContent.join('\n'),
        action: 'create',
      });
    }
  }

  if (type === 'database') {
    // 数据库迁移文件
    patches.push({
      path: 'migrations/auto_migration.sql',
      content: code,
      action: 'create',
    });
  }

  return patches;
}

/**
 * 便捷函数：写入代码
 */
export async function writeCode(
  code: string,
  type: 'backend' | 'frontend' | 'database',
  basePath?: string,
  dryRun: boolean = true
): Promise<WriteResult> {
  const writer = new FileWriter(basePath, dryRun);
  const patches = generateFilePatches(code, type);
  return writer.write(patches);
}
