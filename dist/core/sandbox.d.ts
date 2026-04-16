import { FeatureTemplate, CompiledFeature } from './types.js';
import { SystemStateGraph } from './state-graph.js';
import { ValidationResult } from './patch-validator.js';
/**
 * Sandbox 执行模式
 */
export type SandboxMode = 'dry-run' | 'staged' | 'production';
/**
 * Sandbox 执行结果
 */
export interface SandboxResult {
    success: boolean;
    mode: SandboxMode;
    applied: boolean;
    staged_files: string[];
    executed_at: string;
    validation: ValidationResult;
    feature_id: string;
    error?: string;
    stack_trace?: string;
}
/**
 * Staged 修改
 */
export interface StagedChange {
    id: string;
    feature_id: string;
    type: 'backend' | 'frontend' | 'database';
    file_path: string;
    content: string;
    action: 'create' | 'modify';
    staged_at: string;
    validated: boolean;
}
/**
 * Sandbox 配置
 */
export interface SandboxConfig {
    mode: SandboxMode;
    target_directory?: string;
    allow_production_write?: boolean;
    max_file_size?: number;
    blocked_paths?: string[];
    allowed_extensions?: string[];
}
export declare class ExecutionSandbox {
    private config;
    private stateGraph;
    private validator;
    private dependencyGraph;
    private stagedChanges;
    private changeHistory;
    constructor(config?: Partial<SandboxConfig>, stateGraph?: SystemStateGraph);
    /**
     * 在 Sandbox 中执行 Feature 编译
     */
    execute(template: FeatureTemplate, compiled: CompiledFeature): Promise<SandboxResult>;
    /**
     * 预览变更（模拟干跑）
     */
    preview(template: FeatureTemplate, compiled: CompiledFeature): {
        files_to_create: string[];
        files_to_modify: string[];
        tables_to_create: string[];
        apis_to_create: string[];
        validation_warnings: string[];
    };
    /**
     * 获取所有暂存的修改
     */
    getStagedChanges(): StagedChange[];
    /**
     * 获取特定 Feature 的暂存修改
     */
    getStagedChangesByFeature(featureId: string): StagedChange[];
    /**
     * 应用所有暂存的修改
     */
    applyStaged(featureId: string): Promise<{
        success: boolean;
        applied: number;
        failed: string[];
    }>;
    /**
     * 清除暂存的修改
     */
    clearStaged(featureId?: string): void;
    /**
     * 设置执行模式
     */
    setMode(mode: SandboxMode): void;
    /**
     * 获取当前配置
     */
    getConfig(): SandboxConfig;
    /**
     * 获取执行历史
     */
    getHistory(): SandboxResult[];
    /**
     * 前置检查
     */
    private preExecuteCheck;
    /**
     * 路径匹配（简单的 glob 匹配）
     */
    private matchPath;
    /**
     * 模拟暂存
     */
    private simulateStaging;
    /**
     * 暂存修改
     */
    private stageChanges;
    /**
     * 应用修改
     */
    private applyChanges;
    /**
     * 获取要创建的文件列表
     */
    private getFilesToCreate;
    /**
     * 获取要修改的文件列表
     */
    private getFilesToModify;
    /**
     * 获取文件内容
     */
    private getFileContent;
    /**
     * 获取文件类型
     */
    private getFileType;
    /**
     * 写入文件（仅在沙箱目录）
     */
    private writeFile;
    /**
     * 创建失败结果
     */
    private createFailureResult;
    /**
     * 转换为 kebab-case
     */
    private toKebabCase;
    /**
     * 生成 Sandbox 报告
     */
    generateReport(): string;
}
//# sourceMappingURL=sandbox.d.ts.map