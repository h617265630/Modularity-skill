// ============================================================================
// 生成器基类 - Modularity-skill
// ============================================================================

import type { FilePatch, GenerationResult, Language } from './shared/types.js';
import { kebabCase, pascalCase, camelCase, snakeCase } from './shared/strings.js';

export { kebabCase, pascalCase, camelCase, snakeCase };

import type { FeatureTemplate, TechStack } from '../core/types.js';

/**
 * 生成器配置
 */
export interface GeneratorConfig {
  projectPath: string;
  language: Language;
  framework: string;
  dryRun: boolean;
}

/**
 * 基类生成器
 */
export abstract class BaseGenerator {
  protected config: GeneratorConfig;
  protected template: FeatureTemplate | null = null;
  protected stack: TechStack | null = null;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * 设置模板
   */
  setTemplate(template: FeatureTemplate): void {
    this.template = template;
  }

  /**
   * 设置技术栈
   */
  setStack(stack: TechStack): void {
    this.stack = stack;
  }

  /**
   * 生成代码 - 子类必须实现
   */
  abstract generate(template: any, stack: any): Promise<string>;

  /**
   * 生成文件头注释
   */
  protected generateFileHeader(
    fileName: string,
    description: string,
    isPython: boolean = false
  ): string[] {
    const sep = isPython ? '#' : '//';
    const lines: string[] = [];
    lines.push(`${sep} ============================================================================`);
    lines.push(`${sep} File: ${fileName}`);
    lines.push(`${sep} ============================================================================`);
    lines.push(`${sep} ${description}`);
    lines.push(`${sep} ============================================================================`);
    lines.push('');
    return lines;
  }

  /**
   * 从模板生成代码
   */
  protected parseTemplateCode(code: string): FilePatch[] {
    const patches: FilePatch[] = [];
    const filePattern = /^\/\/ File: (.*)$|^\# File: (.*)$/gm;
    let match;
    let lastIndex = 0;
    let currentPath = '';
    let currentContent = '';

    while ((match = filePattern.exec(code)) !== null) {
      if (currentPath) {
        currentContent = code.substring(lastIndex, match.index).trim();
        patches.push({
          path: currentPath,
          content: currentContent,
          action: 'create',
        });
      }
      currentPath = match[1] || match[2];
      lastIndex = filePattern.lastIndex;
    }

    if (currentPath) {
      currentContent = code.substring(lastIndex).trim();
      patches.push({
        path: currentPath,
        content: currentContent,
        action: 'create',
      });
    }

    return patches;
  }

  /**
   * 生成导入语句
   */
  protected generateImports(imports: string[], isPython: boolean = false): string[] {
    const sep = isPython ? '' : "import ";
    const end = isPython ? '' : ';';
    return imports.map((imp) => `${sep}${imp}${end}`);
  }

  /**
   * 验证模板
   */
  protected validateTemplate(): void {
    if (!this.template) {
      throw new Error('Template not set. Call setTemplate() first.');
    }
  }

  /**
   * 获取语言
   */
  protected getLanguage(): Language {
    return this.config.language;
  }

  /**
   * 判断是否为 Python
   */
  protected isPython(): boolean {
    return this.config.language === 'python';
  }

  /**
   * 判断是否为 TypeScript
   */
  protected isTypeScript(): boolean {
    return this.config.language === 'typescript';
  }

  /**
   * 获取框架
   */
  protected getFramework(): string {
    return this.config.framework;
  }

  /**
   * 创建空的生成结果
   */
  protected emptyResult(): GenerationResult {
    return {
      files: [],
      warnings: [],
      errors: [],
    };
  }

  /**
   * 添加警告
   */
  protected addWarning(result: GenerationResult, warning: string): void {
    result.warnings.push(warning);
  }

  /**
   * 添加错误
   */
  protected addError(result: GenerationResult, error: string): void {
    result.errors.push(error);
  }

  /**
   * 添加文件
   */
  protected addFile(result: GenerationResult, path: string, content: string): void {
    result.files.push({ path, content, action: 'create' });
  }
}
