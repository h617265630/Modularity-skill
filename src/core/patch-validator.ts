// ============================================================================
// Patch Validator - Feature Compiler AI
// 补丁验证层 - 在应用前验证所有变更
// ============================================================================

import { FeatureTemplate, CompiledFeature } from './types.js';
import { SystemStateGraph, SchemaNode, ApiNode } from './state-graph.js';

// ============================================================================
// 验证结果类型
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  diff: DiffSummary;
}

/**
 * 验证错误
 */
export interface ValidationError {
  type: 'schema' | 'api' | 'type' | 'conflict' | 'import' | 'syntax';
  location: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  type: string;
  location: string;
  message: string;
}

/**
 * Diff 摘要
 */
export interface DiffSummary {
  files_created: FileDiff[];
  files_modified: FileDiff[];
  tables_created: string[];
  tables_modified: string[];
  apis_created: string[];
  apis_modified: string[];
  components_created: string[];
  total_changes: number;
}

/**
 * 文件 Diff
 */
export interface FileDiff {
  path: string;
  action: 'create' | 'modify' | 'delete';
  hunks: DiffHunk[];
}

/**
 * Diff 块
 */
export interface DiffHunk {
  lines_added: number;
  lines_removed: number;
  content: string[];
}

/**
 * 类型一致性检查结果
 */
export interface TypeConsistencyResult {
  consistent: boolean;
  mismatches: TypeMismatch[];
}

export interface TypeMismatch {
  frontend_type: string;
  backend_type: string;
  location: string;
  suggestion: string;
}

// ============================================================================
// Patch Validator 主类
// ============================================================================

export class PatchValidator {
  private stateGraph: SystemStateGraph;

  constructor(stateGraph: SystemStateGraph) {
    this.stateGraph = stateGraph;
  }

  // ============================================================================
  // 验证入口
  // ============================================================================

  /**
   * 验证 Feature 补丁
   */
  validateFeature(template: FeatureTemplate, compiled: CompiledFeature): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Schema 验证
    const schemaErrors = this.validateSchema(template);
    errors.push(...schemaErrors.filter(e => e.severity === 'error'));
    warnings.push(...schemaErrors.filter(e => e.severity === 'warning') as any);

    // 2. API 验证
    const apiErrors = this.validateApis(template);
    errors.push(...apiErrors);

    // 3. 类型一致性验证
    const typeErrors = this.validateTypeConsistency(template);
    errors.push(...typeErrors);

    // 4. 导入依赖验证
    const importErrors = this.validateImports(compiled);
    errors.push(...importErrors);

    // 5. 路由冲突检测
    const routeConflicts = this.detectRouteConflicts(template);
    errors.push(...routeConflicts);

    // 6. 生成 Diff 摘要
    const diff = this.generateDiffSummary(template, compiled);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      diff,
    };
  }

  /**
   * 验证多个 features
   */
  validateFeatures(
    templates: FeatureTemplate[],
    compileds: CompiledFeature[]
  ): ValidationResult[] {
    return templates.map((t, i) => this.validateFeature(t, compileds[i]));
  }

  // ============================================================================
  // Schema 验证
  // ============================================================================

  private validateSchema(template: FeatureTemplate): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const table of template.database.tables) {
      // 检查表是否存在
      const existing = this.stateGraph.getTable(table.name);

      if (existing) {
        // 表存在，检查字段兼容性
        for (const field of table.fields) {
          const existingField = existing.fields.find(f => f.name === field.name);

          if (existingField) {
            // 字段存在，检查类型
            if (existingField.type !== field.type) {
              errors.push({
                type: 'schema',
                location: `table.${table.name}.${field.name}`,
                message: `Field type mismatch: existing=${existingField.type}, new=${field.type}`,
                severity: 'error',
                suggestion: `Change '${field.name}' type to ${existingField.type} or update existing field`,
              });
            }

            // 检查 nullable 兼容性
            if (existingField.nullable !== (field.nullable ?? true)) {
              errors.push({
                type: 'schema',
                location: `table.${table.name}.${field.name}`,
                message: `Nullability conflict: existing=${existingField.nullable}, new=${field.nullable}`,
                severity: 'warning',
                suggestion: `Align nullable setting with existing field`,
              });
            }
          }
        }

        // 检查外键冲突
        for (const fk of existing.foreign_keys) {
          const hasFk = table.fields.some(
            f => f.name === fk.column && f.foreign_key === `${fk.reference_table}.${fk.reference_column}`
          );
          if (!hasFk && table.fields.some(f => f.name === fk.column)) {
            errors.push({
              type: 'schema',
              location: `table.${table.name}.${fk.column}`,
              message: `Existing foreign key ${fk.column} -> ${fk.reference_table} may be affected`,
              severity: 'warning',
              suggestion: `Ensure foreign key relationship is maintained`,
            });
          }
        }
      } else {
        // 新表，检查命名规范
        if (!this.isValidTableName(table.name)) {
          errors.push({
            type: 'schema',
            location: `table.${table.name}`,
            message: `Invalid table name format`,
            severity: 'error',
            suggestion: `Use snake_case naming (e.g., 'user_comments' not 'userComments')`,
          });
        }

        // 检查是否有主键
        const hasPrimaryKey = table.fields.some(f => f.name === 'id');
        if (!hasPrimaryKey) {
          errors.push({
            type: 'schema',
            location: `table.${table.name}`,
            message: `Table has no primary key`,
            severity: 'error',
            suggestion: `Add an 'id' primary key field`,
          });
        }
      }

      // 验证字段
      for (const field of table.fields) {
        if (!this.isValidColumnName(field.name)) {
          errors.push({
            type: 'schema',
            location: `table.${table.name}.${field.name}`,
            message: `Invalid column name format: '${field.name}'`,
            severity: 'error',
            suggestion: `Use snake_case naming`,
          });
        }

        // 检查外键引用是否存在
        if (field.foreign_key) {
          const [refTable] = field.foreign_key.split('.');
          const refExists = this.stateGraph.getTable(refTable);
          if (!refExists) {
            errors.push({
              type: 'schema',
              location: `table.${table.name}.${field.name}`,
              message: `Foreign key reference '${field.foreign_key}' does not exist`,
              severity: 'error',
              suggestion: `Ensure the referenced table '${refTable}' exists or will be created first`,
            });
          }
        }
      }

      // 验证索引
      if (table.indexes) {
        for (const idx of table.indexes) {
          const idxColumns = new Set(idx.columns);
          const tableColumns = new Set(table.fields.map(f => f.name));

          for (const col of idx.columns) {
            if (!tableColumns.has(col)) {
              errors.push({
                type: 'schema',
                location: `index.${idx.name}`,
                message: `Index references non-existent column '${col}'`,
                severity: 'error',
                suggestion: `Remove '${col}' from index or add the column to the table`,
              });
            }
          }
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // API 验证
  // ============================================================================

  private validateApis(template: FeatureTemplate): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const route of template.backend.routes) {
      // 检查路径格式
      if (!this.isValidApiPath(route.path)) {
        errors.push({
          type: 'api',
          location: `${route.method} ${route.path}`,
          message: `Invalid API path format`,
          severity: 'error',
          suggestion: `Use RESTful path format (e.g., /users/{id}, /comments)`,
        });
      }

      // 检查处理器名称
      if (!this.isValidHandlerName(route.handler_name)) {
        errors.push({
          type: 'api',
          location: `${route.method} ${route.path}`,
          message: `Invalid handler name: '${route.handler_name}'`,
          severity: 'error',
          suggestion: `Use snake_case (e.g., 'get_user', 'create_comment')`,
        });
      }

      // 检查认证配置
      if (route.method !== 'GET' && !route.auth_required) {
        errors.push({
          type: 'api',
          location: `${route.method} ${route.path}`,
          message: `Non-GET endpoint should typically require authentication`,
          severity: 'warning',
          suggestion: `Consider setting auth_required=true for ${route.method} ${route.path}`,
        });
      }
    }

    return errors;
  }

  // ============================================================================
  // 类型一致性验证
  // ============================================================================

  private validateTypeConsistency(template: FeatureTemplate): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查模型和前端组件的类型对应
    for (const model of template.backend.models) {
      for (const field of model.fields) {
        // 查找前端是否有对应的类型使用
        const frontendUsage = template.frontend.components.some(c =>
          c.props?.some(p => p.type.toLowerCase().includes(field.name.toLowerCase()))
        );

        if (frontendUsage) {
          // 检查类型映射
          const typeMapping = this.getPythonToTsType(field.type);
          if (typeMapping === null) {
            errors.push({
              type: 'type',
              location: `model.${model.name}.${field.name}`,
              message: `Type '${field.type}' may not have a clear TypeScript equivalent`,
              severity: 'warning',
              suggestion: `Verify that frontend can handle '${field.type}' type from backend`,
            });
          }
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // 导入依赖验证
  // ============================================================================

  private validateImports(compiled: CompiledFeature): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查生成的代码是否有明显的导入问题
    const backendCode = compiled.code_patch.backend;

    // 检查是否有未使用的导入
    if (backendCode.includes('from sqlalchemy.orm import')) {
      const hasRelationship = backendCode.includes('relationship');
      if (!hasRelationship && backendCode.includes('@property')) {
        errors.push({
          type: 'import',
          location: 'backend:sqlalchemy_imports',
          message: `'relationship' imported but may not be used`,
          severity: 'warning',
        });
      }
    }

    // 检查 FastAPI 依赖
    if (backendCode.includes('from fastapi import')) {
      const requiredImports = ['APIRouter', 'Depends'];
      for (const imp of requiredImports) {
        if (!backendCode.includes(imp)) {
          errors.push({
            type: 'import',
            location: 'backend:fastapi_imports',
            message: `Missing FastAPI import: '${imp}'`,
            severity: 'error',
            suggestion: `Add '${imp}' to FastAPI imports`,
          });
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // 路由冲突检测
  // ============================================================================

  private detectRouteConflicts(template: FeatureTemplate): ValidationError[] {
    const errors: ValidationError[] = [];
    const existingApis = this.stateGraph.getAllApis();

    for (const route of template.backend.routes) {
      // 精确匹配检查
      const exactMatch = existingApis.find(
        api => api.path === route.path && api.method === route.method
      );

      if (exactMatch) {
        // 不是自身引入的冲突
        if (!exactMatch.features.includes(template.command)) {
          errors.push({
            type: 'conflict',
            location: `${route.method} ${route.path}`,
            message: `Route already exists in ${exactMatch.features.join(', ')}`,
            severity: 'error',
            suggestion: `Use a different path or method for '${route.handler_name}'`,
          });
        }
      }

      // 模式冲突检查
      for (const existing of existingApis) {
        if (existing.features.includes(template.command)) continue;

        if (this.pathsConflict(route.path, existing.path)) {
          if (route.method === existing.method) {
            errors.push({
              type: 'conflict',
              location: `${route.method} ${route.path} vs ${existing.path}`,
              message: `Path pattern conflict with ${existing.handler_name}`,
              severity: 'error',
              suggestion: `Paths '${route.path}' and '${existing.path}' may conflict`,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * 检查两个路径是否冲突
   */
  private pathsConflict(path1: string, path2: string): boolean {
    const segs1 = path1.split('/').filter(s => s);
    const segs2 = path2.split('/').filter(s => s);

    if (segs1.length !== segs2.length) return false;

    for (let i = 0; i < segs1.length; i++) {
      const s1 = segs1[i];
      const s2 = segs2[i];
      if (s1 !== s2 && !s1.startsWith('{') && !s2.startsWith('{')) {
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Diff 摘要生成
  // ============================================================================

  private generateDiffSummary(template: FeatureTemplate, compiled: CompiledFeature): DiffSummary {
    const filesCreated: FileDiff[] = [];
    const filesModified: FileDiff[] = [];

    // 后端文件
    for (const service of template.backend.services) {
      filesCreated.push({
        path: `backend/app/services/${this.toKebabCase(service.name)}.py`,
        action: 'create',
        hunks: [],
      });
    }

    // 前端组件
    for (const component of template.frontend.components) {
      filesCreated.push({
        path: `frontend/src/components/${component.name}.tsx`,
        action: 'create',
        hunks: [],
      });
    }

    // 数据库表
    const tablesCreated = template.database.tables.map(t => t.name);
    const tablesModified: string[] = [];

    for (const table of template.database.tables) {
      const existing = this.stateGraph.getTable(table.name);
      if (existing) {
        tablesModified.push(table.name);
      }
    }

    // API
    const apisCreated: string[] = [];
    const apisModified: string[] = [];

    for (const route of template.backend.routes) {
      const existing = this.stateGraph.getApiByPath(route.method as any, route.path);
      const apiKey = `${route.method} ${route.path}`;

      if (existing) {
        apisModified.push(apiKey);
      } else {
        apisCreated.push(apiKey);
      }
    }

    // 组件
    const componentsCreated = template.frontend.components.map(c => c.name);

    return {
      files_created: filesCreated,
      files_modified: filesModified,
      tables_created: tablesCreated.filter(t => !tablesModified.includes(t)),
      tables_modified: tablesModified,
      apis_created: apisCreated,
      apis_modified: apisModified,
      components_created: componentsCreated,
      total_changes:
        filesCreated.length +
        filesModified.length +
        tablesCreated.length +
        apisCreated.length +
        componentsCreated.length,
    };
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private isValidTableName(name: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(name);
  }

  private isValidColumnName(name: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(name);
  }

  private isValidApiPath(path: string): boolean {
    return /^\/[a-z][a-z0-9_]*(\/[a-z][a-z0-9_]*|(\/\{[a-z_]+\}))*$/.test(path);
  }

  private isValidHandlerName(name: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(name);
  }

  private getPythonToTsType(pythonType: string): string | null {
    const map: Record<string, string> = {
      'str': 'string',
      'string': 'string',
      'int': 'number',
      'integer': 'number',
      'bool': 'boolean',
      'boolean': 'boolean',
      'float': 'number',
      'datetime': 'Date',
      'date': 'Date',
      'json': 'Record<string, any>',
      'text': 'string',
    };
    return map[pythonType] || null;
  }

  private toKebabCase(s: string): string {
    return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // ============================================================================
  // 便捷报告生成
  // ============================================================================

  /**
   * 生成验证报告
   */
  generateReport(result: ValidationResult): string {
    let report = '\n🔍 Patch Validation Report\n';
    report += '═'.repeat(60) + '\n';

    report += `\nStatus: ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`;
    report += `Total changes: ${result.diff.total_changes}\n`;

    if (result.errors.length > 0) {
      report += `\n❌ Errors (${result.errors.length}):\n`;
      for (const err of result.errors) {
        report += `  [${err.type}] ${err.location}\n`;
        report += `    ${err.message}\n`;
        if (err.suggestion) {
          report += `    💡 ${err.suggestion}\n`;
        }
      }
    }

    if (result.warnings.length > 0) {
      report += `\n⚠️  Warnings (${result.warnings.length}):\n`;
      for (const warn of result.warnings) {
        report += `  [${warn.type}] ${warn.location}\n`;
        report += `    ${warn.message}\n`;
      }
    }

    report += '\n📊 Diff Summary:\n';
    report += `  Files created: ${result.diff.files_created.length}\n`;
    report += `  Files modified: ${result.diff.files_modified.length}\n`;
    report += `  Tables created: ${result.diff.tables_created.length}\n`;
    report += `  Tables modified: ${result.diff.tables_modified.length}\n`;
    report += `  APIs created: ${result.diff.apis_created.length}\n`;
    report += `  APIs modified: ${result.diff.apis_modified.length}\n`;
    report += `  Components created: ${result.diff.components_created.length}\n`;

    if (result.diff.tables_created.length > 0) {
      report += `\n  New tables: ${result.diff.tables_created.join(', ')}\n`;
    }
    if (result.diff.apis_created.length > 0) {
      report += `\n  New APIs: ${result.diff.apis_created.join(', ')}\n`;
    }

    return report;
  }
}