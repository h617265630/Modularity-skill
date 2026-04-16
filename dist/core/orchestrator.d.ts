import { SchemaNode, ApiNode, FeatureNode, FeatureEdge } from './state-graph.js';
import { DependencyAnalysis, InstallationPlan } from './dependency-graph.js';
import { ValidationResult } from './patch-validator.js';
import { SandboxResult, SandboxMode } from './sandbox.js';
import { SystemSnapshot, RollbackResult } from './snapshot.js';
import { FeatureTemplate, CompiledFeature } from './types.js';
export interface OrchestratorConfig {
    sandbox_mode: SandboxMode;
    auto_snapshot: boolean;
    max_snapshots: number;
    allow_production_write: boolean;
}
/**
 * 完整编译结果
 */
export interface OrchestratedCompileResult {
    success: boolean;
    feature_id: string;
    template: FeatureTemplate;
    compiled: CompiledFeature;
    state_graph: {
        tables: SchemaNode[];
        apis: ApiNode[];
        features: FeatureNode[];
        edges: FeatureEdge[];
    };
    validation: ValidationResult;
    dependency_analysis: DependencyAnalysis;
    install_plan: InstallationPlan | null;
    sandbox_result: SandboxResult;
    snapshot: SystemSnapshot | null;
    rollback_available: boolean;
    error?: string;
}
/**
 * 系统状态报告
 */
export interface SystemStatusReport {
    timestamp: string;
    config: OrchestratorConfig;
    state: {
        tables_count: number;
        apis_count: number;
        features_count: number;
        edges_count: number;
    };
    snapshots: {
        total: number;
        current: string;
        latest: string | null;
    };
    staged_changes: number;
    recent_history: SandboxResult[];
}
export declare class FeatureOrchestrator {
    private config;
    private originalCompiler;
    private stateGraph;
    private dependencyGraph;
    private patchValidator;
    private sandbox;
    private snapshotManager;
    constructor(config?: Partial<OrchestratorConfig>);
    /**
     * 编译并安装 Feature
     */
    compileFeature(command: string, options?: {
        validate_only?: boolean;
        skip_snapshot?: boolean;
        force?: boolean;
    }): Promise<OrchestratedCompileResult>;
    /**
     * 预览 Feature（不实际修改）
     */
    previewFeature(command: string): Promise<{
        template: FeatureTemplate;
        dependencies: DependencyAnalysis;
        conflicts: string[];
        preview: {
            files_to_create: string[];
            tables_to_create: string[];
            apis_to_create: string[];
            warnings: string[];
        };
    } | null>;
    /**
     * 回滚到指定快照
     */
    rollbackTo(snapshotId: string, strategy?: 'full' | 'feature-only' | 'schema-only'): RollbackResult;
    /**
     * 回滚到上一个快照
     */
    rollbackToPrevious(): RollbackResult;
    /**
     * 获取系统状态
     */
    getSystemStatus(): SystemStatusReport;
    /**
     * 获取表信息
     */
    getTable(tableName: string): SchemaNode | undefined;
    /**
     * 获取 API 信息
     */
    getApi(method: string, path: string): ApiNode | undefined;
    /**
     * 获取 Feature 信息
     */
    getFeature(featureId: string): FeatureNode | undefined;
    /**
     * 获取共享表（多个 feature 使用的表）
     */
    getSharedTables(): Array<{
        table: SchemaNode;
        features: string[];
    }>;
    /**
     * 检测路由冲突
     */
    getRouteConflicts(): Array<{
        api1: ApiNode;
        api2: ApiNode;
        type: 'exact' | 'pattern';
    }>;
    /**
     * 检测循环依赖
     */
    getCircularDependencies(): Array<{
        feature: string;
        path: string[];
    }>;
    /**
     * 设置 Sandbox 模式
     */
    setSandboxMode(mode: SandboxMode): void;
    /**
     * 设置是否自动快照
     */
    setAutoSnapshot(enabled: boolean): void;
    /**
     * 获取配置
     */
    getConfig(): OrchestratorConfig;
    /**
     * 获取所有快照
     */
    getAllSnapshots(): import("./snapshot.js").SnapshotMetadata[];
    /**
     * 创建手动快照
     */
    createManualSnapshot(description: string): SystemSnapshot;
    /**
     * 清除快照历史
     */
    clearSnapshots(keepLast?: number): void;
    private createFailureResult;
    /**
     * 生成完整系统报告
     */
    generateSystemReport(): string;
}
export declare function createOrchestrator(config?: Partial<OrchestratorConfig>): Promise<FeatureOrchestrator>;
//# sourceMappingURL=orchestrator.d.ts.map