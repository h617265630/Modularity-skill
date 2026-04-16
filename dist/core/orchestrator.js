// ============================================================================
// Feature Orchestrator - Feature Compiler AI
// 功能编排器 - 整合所有系统，提供统一的 API
// ============================================================================
import { SystemStateGraph, } from './state-graph.js';
import { DependencyGraph } from './dependency-graph.js';
import { PatchValidator } from './patch-validator.js';
import { ExecutionSandbox } from './sandbox.js';
import { SnapshotManager } from './snapshot.js';
import { FeatureCompiler as OriginalCompiler } from './compiler.js';
import { getTemplate } from '../templates/index.js';
// ============================================================================
// Feature Orchestrator 主类
// ============================================================================
export class FeatureOrchestrator {
    config;
    originalCompiler;
    stateGraph;
    dependencyGraph;
    patchValidator;
    sandbox;
    snapshotManager;
    constructor(config) {
        this.config = {
            sandbox_mode: config?.sandbox_mode || 'dry-run',
            auto_snapshot: config?.auto_snapshot ?? true,
            max_snapshots: config?.max_snapshots || 50,
            allow_production_write: config?.allow_production_write || false,
        };
        this.originalCompiler = new OriginalCompiler();
        this.stateGraph = new SystemStateGraph();
        this.dependencyGraph = new DependencyGraph(this.stateGraph);
        this.patchValidator = new PatchValidator(this.stateGraph);
        this.sandbox = new ExecutionSandbox({
            mode: this.config.sandbox_mode,
            allow_production_write: this.config.allow_production_write,
        }, this.stateGraph);
        this.snapshotManager = new SnapshotManager(this.stateGraph);
    }
    // ============================================================================
    // 核心 API
    // ============================================================================
    /**
     * 编译并安装 Feature
     */
    async compileFeature(command, options) {
        try {
            // 1. 获取模板
            const template = await getTemplate(command);
            if (!template) {
                return this.createFailureResult(command, `Unknown command: ${command}`);
            }
            // 2. 编译 Feature
            const compiled = await this.originalCompiler.compile(command);
            // 3. 更新状态图（临时，用于验证）
            this.stateGraph.addFeatureSchema(template);
            this.stateGraph.addFeatureApis(template);
            this.stateGraph.addFeature(template);
            // 4. 依赖分析
            const depAnalysis = this.dependencyGraph.analyzeFeature(template);
            // 5. 验证 Patch
            const validation = this.patchValidator.validateFeature(template, compiled);
            // 6. 检查是否可以安全安装
            const safetyCheck = this.dependencyGraph.canInstallSafely(template);
            if (!options?.force) {
                if (!safetyCheck.can_install) {
                    return this.createFailureResult(command, 'Safety check failed', undefined, { dependency_analysis: depAnalysis, validation });
                }
                if (!validation.valid) {
                    return this.createFailureResult(command, 'Validation failed', undefined, { dependency_analysis: depAnalysis, validation });
                }
            }
            // 7. 生成安装计划
            const installPlan = this.dependencyGraph.generateInstallPlan([template]);
            // 8. 创建快照（如果启用）
            let snapshot = null;
            if (this.config.auto_snapshot && !options?.skip_snapshot) {
                snapshot = this.snapshotManager.createSnapshot({
                    description: `Install ${template.command}`,
                    feature_id: template.command,
                    tags: ['install', 'auto'],
                });
            }
            // 9. 在 Sandbox 中执行
            const sandboxResult = await this.sandbox.execute(template, compiled);
            // 10. 如果是 dry-run，回滚状态图变更
            if (this.config.sandbox_mode === 'dry-run') {
                // 保持状态图不变
            }
            else if (sandboxResult.success && this.config.auto_snapshot) {
                // 快照已经创建
            }
            return {
                success: sandboxResult.success && validation.valid,
                feature_id: template.command,
                template,
                compiled,
                state_graph: {
                    tables: this.stateGraph.getAllTables(),
                    apis: this.stateGraph.getAllApis(),
                    features: this.stateGraph.getAllFeatures(),
                    edges: this.stateGraph.getAllEdges(),
                },
                validation,
                dependency_analysis: depAnalysis,
                install_plan: installPlan[0] || null,
                sandbox_result: sandboxResult,
                snapshot,
                rollback_available: this.snapshotManager.getAllSnapshots().length > 1,
                error: sandboxResult.error,
            };
        }
        catch (error) {
            return this.createFailureResult(command, error.message);
        }
    }
    /**
     * 预览 Feature（不实际修改）
     */
    async previewFeature(command) {
        const template = await getTemplate(command);
        if (!template)
            return null;
        const compiled = await this.originalCompiler.compile(command);
        const dependencies = this.dependencyGraph.analyzeFeature(template);
        // 临时添加到状态图用于预览
        this.stateGraph.addFeatureSchema(template);
        this.stateGraph.addFeatureApis(template);
        const preview = this.sandbox.preview(template, compiled);
        // 回滚临时添加
        this.stateGraph.clear();
        return {
            template,
            dependencies,
            conflicts: dependencies.conflicts.map(c => c.description),
            preview: {
                files_to_create: preview.files_to_create,
                tables_to_create: preview.tables_to_create,
                apis_to_create: preview.apis_to_create,
                warnings: preview.validation_warnings,
            },
        };
    }
    /**
     * 回滚到指定快照
     */
    rollbackTo(snapshotId, strategy = 'full') {
        return this.snapshotManager.rollback(snapshotId, strategy);
    }
    /**
     * 回滚到上一个快照
     */
    rollbackToPrevious() {
        return this.snapshotManager.rollbackToPrevious();
    }
    // ============================================================================
    // 状态查询
    // ============================================================================
    /**
     * 获取系统状态
     */
    getSystemStatus() {
        const snapshots = this.snapshotManager.getAllSnapshots();
        return {
            timestamp: new Date().toISOString(),
            config: this.config,
            state: {
                tables_count: this.stateGraph.getAllTables().length,
                apis_count: this.stateGraph.getAllApis().length,
                features_count: this.stateGraph.getAllFeatures().length,
                edges_count: this.stateGraph.getAllEdges().length,
            },
            snapshots: {
                total: snapshots.length,
                current: this.snapshotManager.getCurrentSnapshot()?.id || 'none',
                latest: snapshots[0]?.id || null,
            },
            staged_changes: this.sandbox.getStagedChanges().length,
            recent_history: this.sandbox.getHistory().slice(-5),
        };
    }
    /**
     * 获取表信息
     */
    getTable(tableName) {
        return this.stateGraph.getTable(tableName);
    }
    /**
     * 获取 API 信息
     */
    getApi(method, path) {
        return this.stateGraph.getApiByPath(method, path);
    }
    /**
     * 获取 Feature 信息
     */
    getFeature(featureId) {
        return this.stateGraph.getFeature(featureId);
    }
    /**
     * 获取共享表（多个 feature 使用的表）
     */
    getSharedTables() {
        return this.stateGraph.getSharedTables();
    }
    /**
     * 检测路由冲突
     */
    getRouteConflicts() {
        return this.stateGraph.findRouteConflicts();
    }
    /**
     * 检测循环依赖
     */
    getCircularDependencies() {
        return this.stateGraph.detectCircularDeps();
    }
    // ============================================================================
    // 配置管理
    // ============================================================================
    /**
     * 设置 Sandbox 模式
     */
    setSandboxMode(mode) {
        this.config.sandbox_mode = mode;
        this.sandbox.setMode(mode);
    }
    /**
     * 设置是否自动快照
     */
    setAutoSnapshot(enabled) {
        this.config.auto_snapshot = enabled;
    }
    /**
     * 获取配置
     */
    getConfig() {
        return { ...this.config };
    }
    // ============================================================================
    // 快照管理
    // ============================================================================
    /**
     * 获取所有快照
     */
    getAllSnapshots() {
        return this.snapshotManager.getAllSnapshots();
    }
    /**
     * 创建手动快照
     */
    createManualSnapshot(description) {
        return this.snapshotManager.createSnapshot({
            description,
            tags: ['manual'],
        });
    }
    /**
     * 清除快照历史
     */
    clearSnapshots(keepLast = 5) {
        const snapshots = this.snapshotManager.getAllSnapshots();
        const toKeep = new Set(snapshots.slice(0, keepLast).map(s => s.id));
        toKeep.add('initial'); // 总是保留初始快照
        // 注意：这需要 SnapshotManager 支持按 ID 删除
    }
    // ============================================================================
    // 辅助方法
    // ============================================================================
    createFailureResult(featureId, error, extra, partial) {
        return {
            success: false,
            feature_id: featureId,
            template: extra?.template,
            compiled: extra?.compiled,
            state_graph: {
                tables: [],
                apis: [],
                features: [],
                edges: [],
            },
            validation: partial?.validation || {
                valid: false,
                errors: [{ type: 'syntax', location: 'orchestrator', message: error, severity: 'error' }],
                warnings: [],
                diff: {
                    files_created: [],
                    files_modified: [],
                    tables_created: [],
                    tables_modified: [],
                    apis_created: [],
                    apis_modified: [],
                    components_created: [],
                    total_changes: 0,
                },
            },
            dependency_analysis: partial?.dependency_analysis || {
                feature_id: featureId,
                direct_dependencies: [],
                transitive_dependencies: [],
                dependents: [],
                transitive_dependents: [],
                schema_dependencies: [],
                api_dependencies: [],
                missing_dependencies: [],
                installation_order: [],
                conflicts: [],
            },
            install_plan: null,
            sandbox_result: {
                success: false,
                mode: this.config.sandbox_mode,
                applied: false,
                staged_files: [],
                executed_at: new Date().toISOString(),
                validation: partial?.validation || {},
                feature_id: featureId,
                error,
            },
            snapshot: null,
            rollback_available: this.snapshotManager.getAllSnapshots().length > 1,
            error,
        };
    }
    // ============================================================================
    // 报告生成
    // ============================================================================
    /**
     * 生成完整系统报告
     */
    generateSystemReport() {
        const status = this.getSystemStatus();
        const cycles = this.getCircularDependencies();
        const conflicts = this.getRouteConflicts();
        const sharedTables = this.getSharedTables();
        let report = '\n🏗️  Feature Orchestrator - System Report\n';
        report += '═'.repeat(60) + '\n';
        report += `\n📊 Current State:\n`;
        report += `  Tables: ${status.state.tables_count}\n`;
        report += `  APIs: ${status.state.apis_count}\n`;
        report += `  Features: ${status.state.features_count}\n`;
        report += `  Edges: ${status.state.edges_count}\n`;
        if (cycles.length > 0) {
            report += `\n⚠️  Circular Dependencies:\n`;
            for (const c of cycles) {
                report += `  ${c.path.join(' -> ')}\n`;
            }
        }
        if (conflicts.length > 0) {
            report += `\n⚠️  Route Conflicts:\n`;
            for (const c of conflicts) {
                report += `  ${c.api1.method} ${c.api1.path} vs ${c.api2.method} ${c.api2.path}\n`;
            }
        }
        if (sharedTables.length > 0) {
            report += `\n⚠️  Shared Tables:\n`;
            for (const st of sharedTables) {
                report += `  ${st.table.id} <- [${st.features.join(', ')}]\n`;
            }
        }
        report += this.snapshotManager.generateReport();
        report += this.sandbox.generateReport();
        return report;
    }
}
// ============================================================================
// 导出便利函数
// ============================================================================
export async function createOrchestrator(config) {
    return new FeatureOrchestrator(config);
}
//# sourceMappingURL=orchestrator.js.map