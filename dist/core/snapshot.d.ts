import { SystemStateGraph, SchemaNode, ApiNode, FeatureNode, FeatureEdge } from './state-graph.js';
/**
 * 系统快照
 */
export interface SystemSnapshot {
    id: string;
    version: string;
    timestamp: string;
    description: string;
    feature_id?: string;
    state: SnapshotState;
    parent_id?: string;
    tags: string[];
}
/**
 * 快照状态数据
 */
export interface SnapshotState {
    schema_nodes: SchemaNode[];
    api_nodes: ApiNode[];
    feature_nodes: FeatureNode[];
    edges: FeatureEdge[];
}
/**
 * 回滚结果
 */
export interface RollbackResult {
    success: boolean;
    target_snapshot_id: string;
    current_snapshot_id: string;
    changes_reverted: string[];
    features_removed: string[];
    features_preserved: string[];
    error?: string;
}
/**
 * 快照比较结果
 */
export interface SnapshotDiff {
    added_tables: string[];
    removed_tables: string[];
    modified_tables: string[];
    added_apis: string[];
    removed_apis: string[];
    added_features: string[];
    removed_features: string[];
    added_edges: FeatureEdge[];
    removed_edges: FeatureEdge[];
}
/**
 * 回滚策略
 */
export type RollbackStrategy = 'full' | 'feature-only' | 'schema-only';
/**
 * 快照元信息
 */
export interface SnapshotMetadata {
    id: string;
    version: string;
    timestamp: string;
    description: string;
    feature_id?: string;
    size_bytes: number;
    parent_id?: string;
}
export declare class SnapshotManager {
    private snapshots;
    private currentSnapshotId;
    private stateGraph;
    constructor(stateGraph: SystemStateGraph);
    /**
     * 创建初始快照（系统空白状态）
     */
    createInitialSnapshot(): SystemSnapshot;
    /**
     * 创建新快照
     */
    createSnapshot(options: {
        description: string;
        feature_id?: string;
        tags?: string[];
    }): SystemSnapshot;
    /**
     * 获取快照
     */
    getSnapshot(id: string): SystemSnapshot | undefined;
    /**
     * 获取当前快照
     */
    getCurrentSnapshot(): SystemSnapshot | undefined;
    /**
     * 获取所有快照
     */
    getAllSnapshots(): SnapshotMetadata[];
    /**
     * 删除快照
     */
    deleteSnapshot(id: string): boolean;
    /**
     * 回滚到指定快照
     */
    rollback(targetSnapshotId: string, strategy?: RollbackStrategy): RollbackResult;
    /**
     * 回滚到上一个快照
     */
    rollbackToPrevious(): RollbackResult;
    /**
     * 完整回滚
     */
    private fullRollback;
    /**
     * 仅回滚 feature（保留 schema）
     */
    private featureOnlyRollback;
    /**
     * 仅回滚 schema（保留 feature）
     */
    private schemaOnlyRollback;
    /**
     * 比较两个快照
     */
    compareSnapshots(from: SystemSnapshot, to: SystemSnapshot): SnapshotDiff;
    /**
     * 查找修改过的表
     */
    private findModifiedTables;
    /**
     * 获取快照的完整链
     */
    getSnapshotChain(snapshotId: string): SystemSnapshot[];
    /**
     * 获取两个快照的最近公共祖先
     */
    findCommonAncestor(snapshotId1: string, snapshotId2: string): SystemSnapshot | null;
    /**
     * 获取 feature 相关的快照历史
     */
    getFeatureHistory(featureId: string): SystemSnapshot[];
    /**
     * 生成快照 ID
     */
    private generateSnapshotId;
    /**
     * 递增版本号
     */
    private bumpVersion;
    /**
     * 导出所有快照（用于持久化）
     */
    export(): {
        snapshots: SystemSnapshot[];
        currentId: string | null;
    };
    /**
     * 导入快照
     */
    import(data: {
        snapshots: SystemSnapshot[];
        currentId: string | null;
    }): void;
    /**
     * 生成快照报告
     */
    generateReport(): string;
    /**
     * 生成回滚报告
     */
    generateRollbackReport(result: RollbackResult): string;
}
//# sourceMappingURL=snapshot.d.ts.map