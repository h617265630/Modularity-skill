import { FeatureTemplate, CompiledFeature } from './types.js';
import { SystemStateGraph } from './state-graph.js';
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
export declare class PatchValidator {
    private stateGraph;
    constructor(stateGraph: SystemStateGraph);
    /**
     * 验证 Feature 补丁
     */
    validateFeature(template: FeatureTemplate, compiled: CompiledFeature): ValidationResult;
    /**
     * 验证多个 features
     */
    validateFeatures(templates: FeatureTemplate[], compileds: CompiledFeature[]): ValidationResult[];
    private validateSchema;
    private validateApis;
    private validateTypeConsistency;
    private validateImports;
    private detectRouteConflicts;
    /**
     * 检查两个路径是否冲突
     */
    private pathsConflict;
    private generateDiffSummary;
    private isValidTableName;
    private isValidColumnName;
    private isValidApiPath;
    private isValidHandlerName;
    private getPythonToTsType;
    private toKebabCase;
    /**
     * 生成验证报告
     */
    generateReport(result: ValidationResult): string;
}
//# sourceMappingURL=patch-validator.d.ts.map