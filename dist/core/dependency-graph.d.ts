import { FeatureTemplate } from './types.js';
import { SystemStateGraph } from './state-graph.js';
/**
 * 依赖分析结果
 */
export interface DependencyAnalysis {
    feature_id: string;
    direct_dependencies: string[];
    transitive_dependencies: string[];
    dependents: string[];
    transitive_dependents: string[];
    schema_dependencies: SchemaDep[];
    api_dependencies: ApiDep[];
    missing_dependencies: MissingDep[];
    installation_order: string[];
    conflicts: Conflict[];
}
/**
 * Schema 依赖
 */
export interface SchemaDep {
    table: string;
    columns: string[];
    required_by: string;
}
/**
 * API 依赖
 */
export interface ApiDep {
    method: string;
    path: string;
    required_by: string;
}
/**
 * 缺失的依赖
 */
export interface MissingDep {
    type: 'schema' | 'api' | 'feature';
    name: string;
    required_by: string;
    suggestion: string;
}
/**
 * 冲突
 */
export interface Conflict {
    type: 'schema' | 'api' | 'field';
    name: string;
    features: string[];
    description: string;
    severity: 'error' | 'warning';
}
/**
 * Feature 安装计划
 */
export interface InstallationPlan {
    feature_id: string;
    order: 'first' | 'normal' | 'last';
    must_install_before: string[];
    must_install_after: string[];
    side_effects: SideEffect[];
    warnings: string[];
}
/**
 * 副作用
 */
export interface SideEffect {
    target: 'schema' | 'api' | 'file';
    action: 'create' | 'modify' | 'extend';
    description: string;
}
export declare class DependencyGraph {
    private stateGraph;
    constructor(stateGraph: SystemStateGraph);
    /**
     * 分析单个 feature 的依赖
     */
    analyzeFeature(template: FeatureTemplate): DependencyAnalysis;
    /**
     * 批量分析多个 features
     */
    analyzeFeatures(templates: FeatureTemplate[]): DependencyAnalysis[];
    /**
     * 检查是否可以安全安装
     */
    canInstallSafely(template: FeatureTemplate): {
        can_install: boolean;
        blocking_issues: string[];
        warnings: string[];
    };
    /**
     * 生成安装计划
     */
    generateInstallPlan(templates: FeatureTemplate[]): InstallationPlan[];
    /**
     * 查找直接依赖
     */
    private findDirectDependencies;
    /**
     * 查找传递依赖
     */
    private findTransitiveDependencies;
    /**
     * 查找依赖此 feature 的所有 features
     */
    private findDependents;
    /**
     * 查找传递依赖者
     */
    private findTransitiveDependents;
    /**
     * 查找 Schema 依赖
     */
    private findSchemaDependencies;
    /**
     * 查找 API 依赖
     */
    private findApiDependencies;
    /**
     * 查找缺失的依赖
     */
    private findMissingDependencies;
    /**
     * 查找冲突
     */
    private findConflicts;
    /**
     * 建议安装顺序
     */
    private suggestInstallationOrder;
    /**
     * 拓扑排序（考虑 features）
     */
    private topologicalSortWithFeatures;
    /**
     * 推断认证 feature
     */
    private inferAuthFeature;
    /**
     * 推断 service 依赖
     */
    private inferServiceDependency;
    /**
     * 生成完整的依赖报告
     */
    generateReport(templates: FeatureTemplate[]): string;
}
//# sourceMappingURL=dependency-graph.d.ts.map