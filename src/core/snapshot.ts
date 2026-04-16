// ============================================================================
// Snapshot & Rollback System - Feature Compiler AI
// 快照与回滚系统 - 记录系统状态，支持回滚到任意版本
// ============================================================================

import { SystemStateGraph, SchemaNode, ApiNode, FeatureNode, FeatureEdge } from './state-graph.js';

// ============================================================================
// 快照类型定义
// ============================================================================

/**
 * 系统快照
 */
export interface SystemSnapshot {
  id: string;
  version: string;
  timestamp: string;
  description: string;
  feature_id?: string;               // 如果是 feature 安装产生的快照
  state: SnapshotState;
  parent_id?: string;                // 父快照（用于构建快照链）
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

// ============================================================================
// Snapshot Manager 主类
// ============================================================================

export class SnapshotManager {
  private snapshots: Map<string, SystemSnapshot> = new Map();
  private currentSnapshotId: string | null = null;
  private stateGraph: SystemStateGraph;

  constructor(stateGraph: SystemStateGraph) {
    this.stateGraph = stateGraph;
    // 创建初始快照
    this.createInitialSnapshot();
  }

  // ============================================================================
  // 快照操作
  // ============================================================================

  /**
   * 创建初始快照（系统空白状态）
   */
  createInitialSnapshot(): SystemSnapshot {
    const snapshot: SystemSnapshot = {
      id: 'initial',
      version: '0.0.0',
      timestamp: new Date().toISOString(),
      description: 'Initial empty state',
      state: {
        schema_nodes: [],
        api_nodes: [],
        feature_nodes: [],
        edges: [],
      },
      tags: ['initial', 'base'],
    };

    this.snapshots.set('initial', snapshot);
    this.currentSnapshotId = 'initial';
    return snapshot;
  }

  /**
   * 创建新快照
   */
  createSnapshot(options: {
    description: string;
    feature_id?: string;
    tags?: string[];
  }): SystemSnapshot {
    const id = this.generateSnapshotId();
    const currentState = this.stateGraph.export();

    const snapshot: SystemSnapshot = {
      id,
      version: this.bumpVersion(),
      timestamp: new Date().toISOString(),
      description: options.description,
      feature_id: options.feature_id,
      state: currentState,
      parent_id: this.currentSnapshotId || undefined,
      tags: options.tags || [],
    };

    this.snapshots.set(id, snapshot);
    this.currentSnapshotId = id;

    return snapshot;
  }

  /**
   * 获取快照
   */
  getSnapshot(id: string): SystemSnapshot | undefined {
    return this.snapshots.get(id);
  }

  /**
   * 获取当前快照
   */
  getCurrentSnapshot(): SystemSnapshot | undefined {
    if (!this.currentSnapshotId) return undefined;
    return this.snapshots.get(this.currentSnapshotId);
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): SnapshotMetadata[] {
    return Array.from(this.snapshots.values())
      .map(s => ({
        id: s.id,
        version: s.version,
        timestamp: s.timestamp,
        description: s.description,
        feature_id: s.feature_id,
        size_bytes: JSON.stringify(s.state).length,
        parent_id: s.parent_id,
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 删除快照
   */
  deleteSnapshot(id: string): boolean {
    // 不能删除初始快照
    if (id === 'initial') return false;

    // 不能删除当前快照
    if (id === this.currentSnapshotId) return false;

    return this.snapshots.delete(id);
  }

  // ============================================================================
  // 回滚操作
  // ============================================================================

  /**
   * 回滚到指定快照
   */
  rollback(
    targetSnapshotId: string,
    strategy: RollbackStrategy = 'full'
  ): RollbackResult {
    const targetSnapshot = this.snapshots.get(targetSnapshotId);
    if (!targetSnapshot) {
      return {
        success: false,
        target_snapshot_id: targetSnapshotId,
        current_snapshot_id: this.currentSnapshotId || 'none',
        changes_reverted: [],
        features_removed: [],
        features_preserved: [],
        error: `Target snapshot not found: ${targetSnapshotId}`,
      };
    }

    const currentSnapshot = this.getCurrentSnapshot();
    if (!currentSnapshot) {
      return {
        success: false,
        target_snapshot_id: targetSnapshotId,
        current_snapshot_id: 'none',
        changes_reverted: [],
        features_removed: [],
        features_preserved: [],
        error: 'No current snapshot',
      };
    }

    // 计算差异
    const diff = this.compareSnapshots(currentSnapshot, targetSnapshot);

    // 根据策略执行回滚
    if (strategy === 'full') {
      return this.fullRollback(targetSnapshot, diff);
    } else if (strategy === 'feature-only') {
      return this.featureOnlyRollback(targetSnapshot, diff);
    } else {
      return this.schemaOnlyRollback(targetSnapshot, diff);
    }
  }

  /**
   * 回滚到上一个快照
   */
  rollbackToPrevious(): RollbackResult {
    const current = this.getCurrentSnapshot();
    if (!current || !current.parent_id) {
      return {
        success: false,
        target_snapshot_id: 'none',
        current_snapshot_id: current?.id || 'none',
        changes_reverted: [],
        features_removed: [],
        features_preserved: [],
        error: 'No previous snapshot to rollback to',
      };
    }

    const result = this.rollback(current.parent_id);

    // 更新当前快照引用
    if (result.success) {
      this.currentSnapshotId = current.parent_id;
    }

    return result;
  }

  /**
   * 完整回滚
   */
  private fullRollback(
    targetSnapshot: SystemSnapshot,
    diff: SnapshotDiff
  ): RollbackResult {
    // 恢复状态图
    this.stateGraph.import(targetSnapshot.state);

    // 更新当前快照
    const previousCurrentId = this.currentSnapshotId;
    this.currentSnapshotId = targetSnapshot.id;

    return {
      success: true,
      target_snapshot_id: targetSnapshot.id,
      current_snapshot_id: previousCurrentId || 'none',
      changes_reverted: [
        ...diff.added_tables,
        ...diff.added_apis,
        ...diff.added_features,
      ],
      features_removed: diff.added_features,
      features_preserved: [],
    };
  }

  /**
   * 仅回滚 feature（保留 schema）
   */
  private featureOnlyRollback(
    targetSnapshot: SystemSnapshot,
    diff: SnapshotDiff
  ): RollbackResult {
    // 只恢复 feature 相关的数据
    const preservedTables = new Set<string>();
    for (const node of targetSnapshot.state.schema_nodes) {
      preservedTables.add(node.id);
    }

    // 恢复 API
    this.stateGraph.import({
      schema_nodes: this.getCurrentSnapshot()?.state.schema_nodes || [],
      api_nodes: targetSnapshot.state.api_nodes,
      feature_nodes: targetSnapshot.state.feature_nodes,
      edges: targetSnapshot.state.edges,
    });

    const previousCurrentId = this.currentSnapshotId;
    this.currentSnapshotId = targetSnapshot.id;

    return {
      success: true,
      target_snapshot_id: targetSnapshot.id,
      current_snapshot_id: previousCurrentId || 'none',
      changes_reverted: diff.added_apis,
      features_removed: diff.added_features,
      features_preserved: Array.from(preservedTables),
    };
  }

  /**
   * 仅回滚 schema（保留 feature）
   */
  private schemaOnlyRollback(
    targetSnapshot: SystemSnapshot,
    diff: SnapshotDiff
  ): RollbackResult {
    // 只恢复 schema 相关的数据
    this.stateGraph.import({
      schema_nodes: targetSnapshot.state.schema_nodes,
      api_nodes: this.getCurrentSnapshot()?.state.api_nodes || [],
      feature_nodes: this.getCurrentSnapshot()?.state.feature_nodes || [],
      edges: this.getCurrentSnapshot()?.state.edges || [],
    });

    const previousCurrentId = this.currentSnapshotId;
    this.currentSnapshotId = targetSnapshot.id;

    return {
      success: true,
      target_snapshot_id: targetSnapshot.id,
      current_snapshot_id: previousCurrentId || 'none',
      changes_reverted: diff.added_tables,
      features_removed: [],
      features_preserved: diff.added_features,
    };
  }

  // ============================================================================
  // 快照比较
  // ============================================================================

  /**
   * 比较两个快照
   */
  compareSnapshots(from: SystemSnapshot, to: SystemSnapshot): SnapshotDiff {
    const fromTables = new Set(from.state.schema_nodes.map(n => n.id));
    const toTables = new Set(to.state.schema_nodes.map(n => n.id));

    const fromApis = new Set(from.state.api_nodes.map(n => n.id));
    const toApis = new Set(to.state.api_nodes.map(n => n.id));

    const fromFeatures = new Set(from.state.feature_nodes.map(n => n.id));
    const toFeatures = new Set(to.state.feature_nodes.map(n => n.id));

    return {
      added_tables: Array.from(toTables).filter(t => !fromTables.has(t)),
      removed_tables: Array.from(fromTables).filter(t => !toTables.has(t)),
      modified_tables: this.findModifiedTables(from, to),
      added_apis: Array.from(toApis).filter(a => !fromApis.has(a)),
      removed_apis: Array.from(fromApis).filter(a => !toApis.has(a)),
      added_features: Array.from(toFeatures).filter(f => !fromFeatures.has(f)),
      removed_features: Array.from(fromFeatures).filter(f => !toFeatures.has(f)),
      added_edges: to.state.edges.filter(
        e => !from.state.edges.some(
          fe => fe.source === e.source && fe.target === e.target && fe.type === e.type
        )
      ),
      removed_edges: from.state.edges.filter(
        e => !to.state.edges.some(
          fe => fe.source === e.source && fe.target === e.target && fe.type === e.type
        )
      ),
    };
  }

  /**
   * 查找修改过的表
   */
  private findModifiedTables(from: SystemSnapshot, to: SystemSnapshot): string[] {
    const modified: string[] = [];
    const fromMap = new Map(from.state.schema_nodes.map(n => [n.id, n]));
    const toMap = new Map(to.state.schema_nodes.map(n => [n.id, n]));

    for (const [id, toNode] of toMap) {
      const fromNode = fromMap.get(id);
      if (fromNode) {
        // 比较字段
        if (JSON.stringify(fromNode.fields) !== JSON.stringify(toNode.fields)) {
          modified.push(id);
        }
      }
    }

    return modified;
  }

  // ============================================================================
  // 快照链操作
  // ============================================================================

  /**
   * 获取快照的完整链
   */
  getSnapshotChain(snapshotId: string): SystemSnapshot[] {
    const chain: SystemSnapshot[] = [];
    let current = this.snapshots.get(snapshotId);

    while (current) {
      chain.unshift(current);
      current = current.parent_id ? this.snapshots.get(current.parent_id) : undefined;
    }

    return chain;
  }

  /**
   * 获取两个快照的最近公共祖先
   */
  findCommonAncestor(snapshotId1: string, snapshotId2: string): SystemSnapshot | null {
    const chain1 = new Set(this.getSnapshotChain(snapshotId1).map(s => s.id));
    const chain2 = this.getSnapshotChain(snapshotId2);

    for (const snapshot of chain2) {
      if (chain1.has(snapshot.id)) {
        return snapshot;
      }
    }

    return null;
  }

  /**
   * 获取 feature 相关的快照历史
   */
  getFeatureHistory(featureId: string): SystemSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(s => s.feature_id === featureId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 生成快照 ID
   */
  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 递增版本号
   */
  private bumpVersion(): string {
    const current = this.getCurrentSnapshot();
    if (!current) return '1.0.0';

    const [major, minor, patch] = current.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // ============================================================================
  // 导出/导入
  // ============================================================================

  /**
   * 导出所有快照（用于持久化）
   */
  export(): { snapshots: SystemSnapshot[]; currentId: string | null } {
    return {
      snapshots: Array.from(this.snapshots.values()),
      currentId: this.currentSnapshotId,
    };
  }

  /**
   * 导入快照
   */
  import(data: { snapshots: SystemSnapshot[]; currentId: string | null }): void {
    this.snapshots = new Map(data.snapshots.map(s => [s.id, s]));
    this.currentSnapshotId = data.currentId;
  }

  // ============================================================================
  // 报告生成
  // ============================================================================

  /**
   * 生成快照报告
   */
  generateReport(): string {
    let report = '\n📸 Snapshot & Rollback Report\n';
    report += '═'.repeat(60) + '\n';

    report += `\nTotal snapshots: ${this.snapshots.size}\n`;
    report += `Current snapshot: ${this.currentSnapshotId || 'none'}\n`;

    const allSnapshots = this.getAllSnapshots();

    if (allSnapshots.length > 0) {
      report += '\n📋 Snapshot History:\n';
      for (const snap of allSnapshots.slice(0, 10)) {
        const marker = snap.id === this.currentSnapshotId ? '→ ' : '  ';
        report += `${marker}[${snap.id}] ${snap.version}\n`;
        report += `   ${snap.timestamp}\n`;
        report += `   ${snap.description}\n`;
        if (snap.feature_id) {
          report += `   Feature: ${snap.feature_id}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }

  /**
   * 生成回滚报告
   */
  generateRollbackReport(result: RollbackResult): string {
    let report = '\n🔄 Rollback Report\n';
    report += '═'.repeat(60) + '\n';

    report += `\nStatus: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    report += `From: ${result.current_snapshot_id}\n`;
    report += `To: ${result.target_snapshot_id}\n`;

    if (result.success) {
      if (result.features_removed.length > 0) {
        report += `\n🧩 Features removed:\n`;
        for (const f of result.features_removed) {
          report += `  - ${f}\n`;
        }
      }

      if (result.features_preserved.length > 0) {
        report += `\n🧩 Features preserved:\n`;
        for (const f of result.features_preserved) {
          report += `  - ${f}\n`;
        }
      }

      if (result.changes_reverted.length > 0) {
        report += `\n📋 Changes reverted:\n`;
        for (const c of result.changes_reverted) {
          report += `  - ${c}\n`;
        }
      }
    } else {
      report += `\n❌ Error: ${result.error}\n`;
    }

    return report;
  }
}