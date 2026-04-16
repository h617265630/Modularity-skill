// ============================================================================
// 核心编译器 - Feature Compiler AI
// ============================================================================
import { BackendGenerator } from '../generators/backend.js';
import { FrontendGenerator } from '../generators/frontend.js';
import { DatabaseGenerator } from '../generators/database.js';
import { getTemplate } from '../templates/index.js';
import { verifyModule } from '../verifier/index.js';
/**
 * Feature Compiler AI - 主类
 * 将功能命令转换为完整的全栈模块实现
 */
export class FeatureCompiler {
    backendGenerator;
    frontendGenerator;
    databaseGenerator;
    constructor() {
        this.backendGenerator = new BackendGenerator();
        this.frontendGenerator = new FrontendGenerator();
        this.databaseGenerator = new DatabaseGenerator();
    }
    /**
     * 编译功能命令
     * @param command 功能命令（如 '/comment-m'）
     * @param context 可选的编译上下文
     * @returns 编译后的完整功能模块
     */
    async compile(command, context) {
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
        const result = {
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
            const generatedCode = {
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
            result.verification = verificationResult;
            if (!verificationResult.success) {
                console.warn(`Verification failed for ${command}: ${verificationResult.errors.length} error(s)`);
            }
        }
        return result;
    }
    /**
     * 获取所有支持的功能命令
     */
    getSupportedCommands() {
        return ['/comment-m', '/like', '/follow', '/notification'];
    }
    /**
     * 获取功能模板详情
     */
    async getTemplateInfo(command) {
        const normalized = this.normalizeCommand(command);
        return await getTemplate(normalized);
    }
    // ============================================================================
    // 私有方法
    // ============================================================================
    /**
     * 标准化命令格式
     */
    normalizeCommand(command) {
        const trimmed = command.trim();
        if (!trimmed.startsWith('/')) {
            return '/' + trimmed;
        }
        return trimmed;
    }
    /**
     * 获取功能模板
     */
    async getFeatureTemplate(command) {
        return await getTemplate(command);
    }
    /**
     * 获取默认技术栈
     */
    getDefaultStack() {
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
    buildBackendChanges(template, codePatch) {
        return {
            new_files: template.backend.services.map(s => `backend/app/services/${s.name}.py`),
            modified_files: ['backend/app/api/router.py', 'backend/app/db/models.py'],
            api_routes: template.backend.routes.map(r => ({
                method: r.method,
                path: r.path,
                description: `${r.method} ${r.path} - ${r.handler_name}`,
                auth_required: r.auth_required,
            })),
            database_changes: template.database.tables.map(t => ({
                type: 'CREATE_TABLE',
                table_name: t.name,
                description: `Create ${t.name} table`,
            })),
        };
    }
    /**
     * 构建前端变更描述
     */
    buildFrontendChanges(template, codePatch) {
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
    buildSharedContracts(template) {
        const types = template.backend.models.map(m => ({
            name: m.name,
            language: 'both',
            definition: `interface ${m.name} {\n${m.fields.map(f => `  ${f.name}: ${this.mapTypeToTS(f.type)};`).join('\n')}\n}`,
        }));
        const schemas = template.backend.models.map(m => ({
            name: m.name,
            framework: 'pydantic',
            definition: `class ${m.name}Base(BaseModel):\n${m.fields.map(f => `  ${f.name}: ${this.mapTypeToPydantic(f.type)}`).join('\n')}`,
        }));
        return { types, schemas };
    }
    /**
     * 生成风险提示
     */
    generateRiskNotes(template) {
        const notes = [];
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
    mapTypeToTS(pythonType) {
        const typeMap = {
            'str': 'string',
            'int': 'number',
            'float': 'number',
            'bool': 'boolean',
            'datetime': 'Date',
            'json': 'Record<string, any>',
        };
        return typeMap[pythonType] || pythonType;
    }
    mapTypeToPydantic(pythonType) {
        const typeMap = {
            'str': 'str',
            'int': 'int',
            'float': 'float',
            'bool': 'bool',
            'datetime': 'datetime',
            'json': 'dict',
        };
        return typeMap[pythonType] || pythonType;
    }
}
/**
 * 导出便利函数
 */
export async function compileFeature(command, context) {
    const compiler = new FeatureCompiler();
    return await compiler.compile(command, context);
}
//# sourceMappingURL=compiler.js.map