// ============================================================================
// 核心编译器 - Feature Compiler AI
// ============================================================================

import { CompiledFeature, CompileContext, FeatureTemplate, TechStack, GeneratedCode, DetectedFrontendCode, IntegrationMatchResult } from './types.js';
import { BackendGenerator } from '../generators/backend.js';
import { FrontendGenerator } from '../generators/frontend.js';
import { DatabaseGenerator } from '../generators/database.js';
import { getTemplate } from '../templates/index.js';
import { verifyModule } from '../verifier/index.js';
import type { VerificationResult } from '../verifier/index.js';
import { FrontendAnalyzer, matchFrontendToBackend } from '../detector/frontend-analyzer.js';
import { ProjectScanner, ProjectStructure } from './project-scanner.js';

/**
 * Feature Compiler AI - 主类
 * 将功能命令转换为完整的全栈模块实现
 */
export class FeatureCompiler {
  private backendGenerator: BackendGenerator;
  private frontendGenerator: FrontendGenerator;
  private databaseGenerator: DatabaseGenerator;

  constructor() {
    this.backendGenerator = new BackendGenerator({
      projectPath: '',
      language: 'python',
      framework: 'fastapi',
      dryRun: true
    });
    this.frontendGenerator = new FrontendGenerator({
      projectPath: '',
      language: 'typescript',
      framework: 'react',
      dryRun: true
    });
    this.databaseGenerator = new DatabaseGenerator();
  }

  /**
   * 编译功能命令
   * @param command 功能命令（如 '/comment-m'）
   * @param context 可选的编译上下文
   * @returns 编译后的完整功能模块
   */
  async compile(command: string, context?: CompileContext): Promise<CompiledFeature> {
    // 解析命令
    const normalizedCommand = this.normalizeCommand(command);

    // 获取功能模板
    const template = await this.getFeatureTemplate(normalizedCommand);

    if (!template) {
      throw new Error(`Unknown command: ${command}. Supported commands: /comment-m, /like, /follow, /notification`);
    }

    // 确定技术栈
    const stack = context?.stack || this.getDefaultStack();

    // 生成后端代码
    const backendPatch = await this.backendGenerator.generate(template, stack);

    // 生成前端代码
    const frontendPatch = await this.frontendGenerator.generate(template, stack);

    // 生成数据库代码
    const databasePatch = await this.databaseGenerator.generate(template, stack);

    // 构建结果
    const result: CompiledFeature = {
      feature_name: template.feature_name,
      description: template.description,

      backend_changes: this.buildBackendChanges(template, backendPatch),
      frontend_changes: this.buildFrontendChanges(template, frontendPatch),
      shared_contracts: this.buildSharedContracts(template),

      integration_steps: template.integration.steps,
      code_patch: {
        backend: backendPatch,
        frontend: frontendPatch,
        database: databasePatch,
      },
      risk_notes: this.generateRiskNotes(template),
    };

    // 如果启用了验证，运行验证流程
    if (context?.verify) {
      const generatedCode: GeneratedCode = {
        backend: backendPatch,
        frontend: frontendPatch,
        database: databasePatch,
      };

      const verificationResult = await verifyModule(template, generatedCode, {
        verbose: true,
        fix_enabled: true,
        max_retries: 3,
      }, context.language || 'python');

      // 将验证结果附加到结果中
      (result as any).verification = verificationResult;

      if (!verificationResult.success) {
        console.warn(`Verification failed for ${command}: ${verificationResult.errors.length} error(s)`);
      }
    }

    return result;
  }

  /**
   * 获取所有支持的功能命令
   */
  getSupportedCommands(): string[] {
    return ['/comment-m', '/like', '/follow', '/notification'];
  }

  /**
   * 扫描项目并检测前端代码（用于外部调用）
   */
  async scanProject(projectPath: string): Promise<ProjectStructure> {
    const scanner = new ProjectScanner();
    return scanner.scan(projectPath);
  }

  /**
   * 带前端感知的编译
   * 自动检测现有前端代码并生成适配层
   * @param command 功能命令
   * @param context 编译上下文，包含 projectPath
   */
  async compileWithFrontendAwareness(command: string, context?: CompileContext & { projectPath?: string }): Promise<CompiledFeature> {
    // 解析命令
    const normalizedCommand = this.normalizeCommand(command);

    // 获取功能模板
    const template = await this.getFeatureTemplate(normalizedCommand);

    if (!template) {
      throw new Error(`Unknown command: ${command}. Supported commands: /comment-m, /like, /follow, /notification`);
    }

    // 确定技术栈
    const stack = context?.stack || this.getDefaultStack();

    // 分析现有前端代码
    let detectedFrontend: DetectedFrontendCode | null = null;
    let integrationResult: IntegrationMatchResult | null = null;

    if (context?.projectPath) {
      const scanner = new ProjectScanner();
      const projectStructure = scanner.scan(context.projectPath);

      if (projectStructure.frontend) {
        // 使用用户指定的目录或默认目录
        const analyzerOptions = context.frontendAnalysis ? {
          hooks_dir: context.frontendAnalysis.hooks_dir,
          components_dir: context.frontendAnalysis.components_dir,
          api_services_dir: context.frontendAnalysis.api_services_dir,
        } : undefined;

        const analyzer = new FrontendAnalyzer(projectStructure.frontend, analyzerOptions);
        detectedFrontend = await analyzer.analyzeFeature(template.feature_name);

        if (detectedFrontend) {
          console.log(`   📦 Detected existing frontend code: ${detectedFrontend.hooks.length} hook(s), ${detectedFrontend.components.length} component(s)`);

          // 匹配前端与后端
          integrationResult = matchFrontendToBackend(
            detectedFrontend,
            template.backend.routes.map(r => ({ method: r.method, path: r.path }))
          );

          console.log(`   🔄 Integration strategy: ${integrationResult.strategy}`);

          if (integrationResult.strategy === 'adapter') {
            console.log(`   📝 Will generate adapter for ${integrationResult.mismatched_endpoints.length} endpoint(s)`);
          }
        } else if (context.frontendAnalysis) {
          // 用户指定了目录但没找到
          console.log(`   ⚠️  No existing frontend code found in specified directories`);
        }
      }
    }

    // 生成后端代码
    const backendPatch = await this.backendGenerator.generate(template, stack);

    // 生成前端代码
    const frontendPatch = await this.frontendGenerator.generate(template, stack);

    // 生成数据库代码
    const databasePatch = await this.databaseGenerator.generate(template, stack);

    // 构建结果
    const result: CompiledFeature = {
      feature_name: template.feature_name,
      description: template.description,

      backend_changes: this.buildBackendChanges(template, backendPatch),
      frontend_changes: this.buildFrontendChanges(template, frontendPatch),
      shared_contracts: this.buildSharedContracts(template),

      integration_steps: [...template.integration.steps],
      code_patch: {
        backend: backendPatch,
        frontend: frontendPatch,
        database: databasePatch,
      },
      risk_notes: this.generateRiskNotes(template),
    };

    // 添加集成相关的信息
    if (detectedFrontend) {
      // 显示检测到的文件位置
      const hookPaths = detectedFrontend.hooks.map(h => `  - ${h.name}: ${this.shortenPath(h.file_path)}`).join('\n');
      const componentPaths = detectedFrontend.components.map(c => `  - ${c.name}: ${this.shortenPath(c.file_path)}`).join('\n');

      result.integration_steps.unshift(
        `📦 Existing frontend detected: ${detectedFrontend.hooks.length} hook(s), ${detectedFrontend.components.length} component(s)`,
        'Detected hooks:',
        hookPaths || '  (none)',
        'Detected components:',
        componentPaths || '  (none)',
        ''
      );
    }

    if (integrationResult) {
      result.integration_steps.unshift(`🔄 Integration strategy: ${integrationResult.strategy}`);

      // 如果需要 adapter，添加到 code_patch
      if (integrationResult.strategy === 'adapter' && integrationResult.adapter_code) {
        result.code_patch.adapter = integrationResult.adapter_code;
        result.integration_steps.unshift('🔄 Generating adapter layer for API path compatibility');
      }

      // 添加后端补丁建议
      if (integrationResult.backend_patch_suggestions.length > 0) {
        result.integration_steps.push(...integrationResult.backend_patch_suggestions.map(s => `💡 ${s}`));
      }

      // 添加前端补丁建议
      if (integrationResult.frontend_patch_suggestions.length > 0) {
        result.integration_steps.push(...integrationResult.frontend_patch_suggestions.map(s => `💡 ${s}`));
      }
    }

    // 如果启用了验证，运行验证流程
    if (context?.verify) {
      const generatedCode: GeneratedCode = {
        backend: backendPatch,
        frontend: frontendPatch,
        database: databasePatch,
        adapter: result.code_patch.adapter,
      };

      const verificationResult = await verifyModule(template, generatedCode, {
        verbose: true,
        fix_enabled: true,
        max_retries: 3,
      }, context.language || 'python');

      (result as any).verification = verificationResult;

      if (!verificationResult.success) {
        console.warn(`Verification failed for ${command}: ${verificationResult.errors.length} error(s)`);
      }
    }

    return result;
  }

  /**
   * 获取功能模板详情
   */
  async getTemplateInfo(command: string): Promise<FeatureTemplate | null> {
    const normalized = this.normalizeCommand(command);
    return await getTemplate(normalized);
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 标准化命令格式
   */
  private normalizeCommand(command: string): string {
    const trimmed = command.trim();
    if (!trimmed.startsWith('/')) {
      return '/' + trimmed;
    }
    return trimmed;
  }

  /**
   * 获取功能模板
   */
  private async getFeatureTemplate(command: string): Promise<FeatureTemplate | null> {
    return await getTemplate(command);
  }

  /**
   * 获取默认技术栈
   */
  private getDefaultStack(): TechStack {
    return {
      frontend: {
        framework: 'React',
        language: 'TypeScript',
        state: 'Zustand',
      },
      backend: {
        framework: 'FastAPI',
        language: 'Python',
      },
      database: 'PostgreSQL',
    };
  }

  /**
   * 构建后端变更描述
   */
  private buildBackendChanges(template: FeatureTemplate, codePatch: string) {
    return {
      new_files: template.backend.services.map(s => `backend/app/services/${s.name}.py`),
      modified_files: ['backend/app/api/router.py', 'backend/app/db/models.py'],
      api_routes: template.backend.routes.map(r => ({
        method: r.method as any,
        path: r.path,
        description: `${r.method} ${r.path} - ${r.handler_name}`,
        auth_required: r.auth_required,
      })),
      database_changes: template.database.tables.map(t => ({
        type: 'CREATE_TABLE' as const,
        table_name: t.name,
        description: `Create ${t.name} table`,
      })),
    };
  }

  /**
   * 构建前端变更描述
   */
  private buildFrontendChanges(template: FeatureTemplate, codePatch: string) {
    return {
      new_components: template.frontend.components.map(c => ({
        name: c.name,
        path: `frontend/src/components/${c.name}.tsx`,
        description: c.description,
      })),
      modified_components: ['frontend/src/App.tsx'],
      state_changes: template.frontend.hooks.map(h => ({
        type: 'hook',
        description: h.description,
      })),
      api_calls: template.backend.routes.map(r => ({
        name: `${r.method.toLowerCase()}${r.path.replace(/\//g, '')}`,
        endpoint: r.path,
        method: r.method,
      })),
    };
  }

  /**
   * 构建共享合约
   */
  private buildSharedContracts(template: FeatureTemplate) {
    const types = template.backend.models.map(m => ({
      name: m.name,
      language: 'both' as const,
      definition: `interface ${m.name} {\n${m.fields.map(f => `  ${f.name}: ${this.mapTypeToTS(f.type)};`).join('\n')}\n}`,
    }));

    const schemas = template.backend.models.map(m => ({
      name: m.name,
      framework: 'pydantic' as const,
      definition: `class ${m.name}Base(BaseModel):\n${m.fields.map(f => `  ${f.name}: ${this.mapTypeToPydantic(f.type)}`).join('\n')}`,
    }));

    return { types, schemas };
  }

  /**
   * 生成风险提示
   */
  private generateRiskNotes(template: FeatureTemplate): string[] {
    const notes: string[] = [];

    // 添加认证注意事项
    if (template.backend.routes.some(r => r.auth_required)) {
      notes.push('Auth consideration: Some routes require authentication - ensure JWT middleware is configured');
    }

    // 添加性能注意事项
    if (template.database.tables.some(t => t.fields.length > 5)) {
      notes.push('Performance consideration: Consider adding indexes for frequently queried fields');
    }

    // 添加通用风险
    notes.push('Edge case: Handle concurrent modifications with optimistic locking if needed');
    notes.push('Security: Validate all inputs on both client and server sides');
    notes.push('Testing: Add unit tests for all CRUD operations');

    return notes;
  }

  // ============================================================================
  // 类型映射辅助方法
  // ============================================================================

  private mapTypeToTS(pythonType: string): string {
    const typeMap: Record<string, string> = {
      'str': 'string',
      'int': 'number',
      'float': 'number',
      'bool': 'boolean',
      'datetime': 'Date',
      'json': 'Record<string, any>',
    };
    return typeMap[pythonType] || pythonType;
  }

  private mapTypeToPydantic(pythonType: string): string {
    const typeMap: Record<string, string> = {
      'str': 'str',
      'int': 'int',
      'float': 'float',
      'bool': 'bool',
      'datetime': 'datetime',
      'json': 'dict',
    };
    return typeMap[pythonType] || pythonType;
  }

  /**
   * 缩短路径显示（去掉项目根路径前缀）
   */
  private shortenPath(fullPath: string): string {
    // 移除常见的根路径前缀
    const prefixes = ['frontend/src/', 'src/', 'frontend/', 'app/'];
    for (const prefix of prefixes) {
      if (fullPath.includes(prefix)) {
        return '...' + fullPath.substring(fullPath.indexOf(prefix));
      }
    }
    // 如果没有匹配，返回最后50个字符
    return fullPath.length > 50 ? '...' + fullPath.slice(-50) : fullPath;
  }
}

/**
 * 导出便利函数
 */
export async function compileFeature(command: string, context?: CompileContext): Promise<CompiledFeature> {
  const compiler = new FeatureCompiler();
  return await compiler.compile(command, context);
}

/**
 * 带前端感知的编译便利函数
 */
export async function compileWithFrontendAwareness(command: string, context?: CompileContext & { projectPath?: string }): Promise<CompiledFeature> {
  const compiler = new FeatureCompiler();
  return await compiler.compileWithFrontendAwareness(command, context);
}
