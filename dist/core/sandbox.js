// ============================================================================
// Execution Sandbox - Feature Compiler AI
// 执行沙箱 - 确保安全地修改代码，防止污染 production codebase
// ============================================================================
import { SystemStateGraph } from './state-graph.js';
import { PatchValidator } from './patch-validator.js';
import { DependencyGraph } from './dependency-graph.js';
// ============================================================================
// Execution Sandbox 主类
// ============================================================================
export class ExecutionSandbox {
    config;
    stateGraph;
    validator;
    dependencyGraph;
    stagedChanges = new Map();
    changeHistory = [];
    constructor(config = {}, stateGraph) {
        this.config = {
            mode: config.mode || 'dry-run',
            target_directory: config.target_directory || './sandbox',
            allow_production_write: config.allow_production_write || false,
            max_file_size: config.max_file_size || 1024 * 1024, // 1MB
            blocked_paths: config.blocked_paths || [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/coverage/**',
                '**/.env*',
                '**/secrets/**',
                '**/credentials/**',
                '**/password*',
                '**/config.prod*',
                '**/settings.prod*',
            ],
            allowed_extensions: config.allowed_extensions || [
                '.ts',
                '.tsx',
                '.js',
                '.jsx',
                '.py',
                '.sql',
                '.json',
                '.yaml',
                '.yml',
            ],
        };
        this.stateGraph = stateGraph || new SystemStateGraph();
        this.validator = new PatchValidator(this.stateGraph);
        this.dependencyGraph = new DependencyGraph(this.stateGraph);
    }
    // ============================================================================
    // 核心执行方法
    // ============================================================================
    /**
     * 在 Sandbox 中执行 Feature 编译
     */
    async execute(template, compiled) {
        const startTime = Date.now();
        // 1. 前置检查
        const preCheck = this.preExecuteCheck(template);
        if (!preCheck.canExecute) {
            return this.createFailureResult(template.command, preCheck.reason, preCheck.details);
        }
        // 2. 验证 Patch
        const validation = this.validator.validateFeature(template, compiled);
        if (!validation.valid && this.config.mode === 'production') {
            return this.createFailureResult(template.command, 'Validation failed', validation.errors.map(e => `[${e.type}] ${e.location}: ${e.message}`));
        }
        // 3. 依赖检查
        const depAnalysis = this.dependencyGraph.canInstallSafely(template);
        if (!depAnalysis.can_install && this.config.mode === 'production') {
            return this.createFailureResult(template.command, 'Dependency check failed', depAnalysis.blocking_issues);
        }
        // 4. 根据模式执行
        let applied = false;
        let stagedFiles = [];
        if (this.config.mode === 'dry-run') {
            // 干跑模式 - 只验证，不实际修改
            stagedFiles = this.simulateStaging(template, compiled);
        }
        else if (this.config.mode === 'staged') {
            // 分阶段模式 - 暂存修改，等待确认
            stagedFiles = await this.stageChanges(template, compiled);
        }
        else if (this.config.mode === 'production') {
            // 生产模式 - 实际执行（需要明确授权）
            if (!this.config.allow_production_write) {
                return this.createFailureResult(template.command, 'Production write not allowed', ['Set allow_production_write=true to enable']);
            }
            stagedFiles = await this.applyChanges(template, compiled);
            applied = true;
        }
        const result = {
            success: true,
            mode: this.config.mode,
            applied,
            staged_files: stagedFiles,
            executed_at: new Date().toISOString(),
            validation,
            feature_id: template.command,
        };
        this.changeHistory.push(result);
        return result;
    }
    /**
     * 预览变更（模拟干跑）
     */
    preview(template, compiled) {
        const validation = this.validator.validateFeature(template, compiled);
        return {
            files_to_create: this.getFilesToCreate(template),
            files_to_modify: this.getFilesToModify(template),
            tables_to_create: template.database.tables.map(t => t.name),
            apis_to_create: template.backend.routes.map(r => `${r.method} ${r.path}`),
            validation_warnings: validation.warnings.map(w => w.message),
        };
    }
    // ============================================================================
    // Staged Changes 管理
    // ============================================================================
    /**
     * 获取所有暂存的修改
     */
    getStagedChanges() {
        return Array.from(this.stagedChanges.values());
    }
    /**
     * 获取特定 Feature 的暂存修改
     */
    getStagedChangesByFeature(featureId) {
        return Array.from(this.stagedChanges.values()).filter(c => c.feature_id === featureId);
    }
    /**
     * 应用所有暂存的修改
     */
    async applyStaged(featureId) {
        const changes = this.getStagedChangesByFeature(featureId);
        const failed = [];
        for (const change of changes) {
            try {
                await this.writeFile(change.file_path, change.content);
            }
            catch (e) {
                failed.push(change.file_path);
            }
        }
        // 清除已应用的暂存
        for (const change of changes) {
            if (!failed.includes(change.file_path)) {
                this.stagedChanges.delete(change.id);
            }
        }
        return {
            success: failed.length === 0,
            applied: changes.length - failed.length,
            failed,
        };
    }
    /**
     * 清除暂存的修改
     */
    clearStaged(featureId) {
        if (featureId) {
            const toDelete = [];
            for (const [id, change] of this.stagedChanges) {
                if (change.feature_id === featureId) {
                    toDelete.push(id);
                }
            }
            for (const id of toDelete) {
                this.stagedChanges.delete(id);
            }
        }
        else {
            this.stagedChanges.clear();
        }
    }
    // ============================================================================
    // 配置管理
    // ============================================================================
    /**
     * 设置执行模式
     */
    setMode(mode) {
        this.config.mode = mode;
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 获取执行历史
     */
    getHistory() {
        return [...this.changeHistory];
    }
    // ============================================================================
    // 私有方法
    // ============================================================================
    /**
     * 前置检查
     */
    preExecuteCheck(template) {
        // 检查 feature 是否有效
        if (!template.command || !template.feature_name) {
            return { canExecute: false, reason: 'Invalid template', details: ['Missing command or feature_name'] };
        }
        // 检查是否有冲突路径
        if (this.config.blocked_paths && this.config.blocked_paths.length > 0) {
            const filePaths = this.getFilesToCreate(template);
            for (const path of filePaths) {
                for (const blocked of this.config.blocked_paths) {
                    if (this.matchPath(path, blocked)) {
                        return {
                            canExecute: false,
                            reason: `Path blocked: ${path}`,
                            details: [`Path matches blocked pattern: ${blocked}`],
                        };
                    }
                }
            }
        }
        return { canExecute: true };
    }
    /**
     * 路径匹配（简单的 glob 匹配）
     */
    matchPath(path, pattern) {
        if (pattern.includes('**')) {
            const parts = pattern.split('**');
            if (parts.length === 2) {
                return path.includes(parts[1].replace(/^\//, ''));
            }
        }
        return false;
    }
    /**
     * 模拟暂存
     */
    simulateStaging(template, compiled) {
        return this.getFilesToCreate(template);
    }
    /**
     * 暂存修改
     */
    async stageChanges(template, compiled) {
        const stagedFiles = [];
        const filesToCreate = this.getFilesToCreate(template);
        for (const filePath of filesToCreate) {
            const content = this.getFileContent(filePath, template, compiled);
            const id = `${template.command}:${filePath}`;
            const stagedChange = {
                id,
                feature_id: template.command,
                type: this.getFileType(filePath),
                file_path: filePath,
                content,
                action: 'create',
                staged_at: new Date().toISOString(),
                validated: true,
            };
            this.stagedChanges.set(id, stagedChange);
            stagedFiles.push(filePath);
        }
        return stagedFiles;
    }
    /**
     * 应用修改
     */
    async applyChanges(template, compiled) {
        // 先暂存
        const stagedFiles = await this.stageChanges(template, compiled);
        // 然后应用
        await this.applyStaged(template.command);
        return stagedFiles;
    }
    /**
     * 获取要创建的文件列表
     */
    getFilesToCreate(template) {
        const files = [];
        // 后端文件
        for (const service of template.backend.services) {
            files.push(`backend/app/services/${this.toKebabCase(service.name)}.py`);
        }
        // CRUD 文件
        if (template.backend.curds) {
            for (const curd of template.backend.curds) {
                files.push(`backend/app/cruds/${this.toKebabCase(curd.model_name)}_crud.py`);
            }
        }
        // 路由文件
        files.push(`backend/app/api/${this.toKebabCase(template.feature_name)}.py`);
        // 模型文件
        for (const model of template.backend.models) {
            files.push(`backend/app/models/${this.toKebabCase(model.table_name)}.py`);
        }
        // Schema 文件
        for (const model of template.backend.models) {
            files.push(`backend/app/schemas/${this.toKebabCase(model.table_name)}.py`);
        }
        // 前端组件
        for (const component of template.frontend.components) {
            files.push(`frontend/src/components/${component.name}.tsx`);
        }
        // 前端 Hooks
        for (const hook of template.frontend.hooks) {
            files.push(`frontend/src/hooks/${this.toKebabCase(hook.name)}.ts`);
        }
        // 前端页面
        for (const page of template.frontend.pages) {
            files.push(`frontend/src/pages/${this.toKebabCase(page.name)}.tsx`);
        }
        // API 服务
        files.push(`frontend/src/services/${this.toKebabCase(template.feature_name)}.ts`);
        // 数据库迁移
        files.push(`database/migrations/${Date.now()}_create_${template.database.tables[0]?.name || 'table'}.sql`);
        return files;
    }
    /**
     * 获取要修改的文件列表
     */
    getFilesToModify(template) {
        const files = [];
        // 后端路由注册
        files.push('backend/app/api/router.py');
        // 后端模型注册
        files.push('backend/app/db/models.py');
        // 前端 App
        files.push('frontend/src/App.tsx');
        return files;
    }
    /**
     * 获取文件内容
     */
    getFileContent(filePath, template, compiled) {
        if (filePath.endsWith('.py')) {
            return compiled.code_patch.backend;
        }
        else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            return compiled.code_patch.frontend;
        }
        else if (filePath.endsWith('.sql')) {
            return compiled.code_patch.database;
        }
        return '';
    }
    /**
     * 获取文件类型
     */
    getFileType(filePath) {
        if (filePath.startsWith('backend'))
            return 'backend';
        if (filePath.startsWith('frontend'))
            return 'frontend';
        if (filePath.startsWith('database'))
            return 'database';
        return 'backend';
    }
    /**
     * 写入文件（仅在沙箱目录）
     */
    async writeFile(filePath, content) {
        // 注意：这里只是记录，实际写入需要通过外部的 fs 操作
        // 沙箱模式下，文件会写入 target_directory
        console.log(`[Sandbox] Would write to: ${filePath}`);
        console.log(`[Sandbox] Content length: ${content.length} chars`);
    }
    /**
     * 创建失败结果
     */
    createFailureResult(featureId, error, details) {
        return {
            success: false,
            mode: this.config.mode,
            applied: false,
            staged_files: [],
            executed_at: new Date().toISOString(),
            validation: {
                valid: false,
                errors: details?.map(d => ({
                    type: 'syntax',
                    location: 'sandbox',
                    message: d,
                    severity: 'error',
                })) || [],
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
            feature_id: featureId,
            error,
            stack_trace: details?.join('\n'),
        };
    }
    /**
     * 转换为 kebab-case
     */
    toKebabCase(s) {
        return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    // ============================================================================
    // 报告生成
    // ============================================================================
    /**
     * 生成 Sandbox 报告
     */
    generateReport() {
        let report = '\n🏖️  Execution Sandbox Report\n';
        report += '═'.repeat(60) + '\n';
        report += `\nMode: ${this.config.mode}\n`;
        report += `Staged changes: ${this.stagedChanges.size}\n`;
        report += `Total executions: ${this.changeHistory.length}\n`;
        if (this.stagedChanges.size > 0) {
            report += '\n📋 Staged Changes:\n';
            for (const change of this.stagedChanges.values()) {
                report += `  [${change.type}] ${change.file_path}\n`;
                report += `    Feature: ${change.feature_id}\n`;
                report += `    Action: ${change.action}\n`;
            }
        }
        if (this.changeHistory.length > 0) {
            report += '\n📜 Execution History:\n';
            for (const result of this.changeHistory.slice(-5)) {
                report += `  ${result.executed_at}: ${result.feature_id} - ${result.success ? '✅' : '❌'}\n`;
            }
        }
        return report;
    }
}
//# sourceMappingURL=sandbox.js.map