import { CompiledFeature, CompileContext, FeatureTemplate } from './types.js';
/**
 * Feature Compiler AI - 主类
 * 将功能命令转换为完整的全栈模块实现
 */
export declare class FeatureCompiler {
    private backendGenerator;
    private frontendGenerator;
    private databaseGenerator;
    constructor();
    /**
     * 编译功能命令
     * @param command 功能命令（如 '/comment-m'）
     * @param context 可选的编译上下文
     * @returns 编译后的完整功能模块
     */
    compile(command: string, context?: CompileContext): Promise<CompiledFeature>;
    /**
     * 获取所有支持的功能命令
     */
    getSupportedCommands(): string[];
    /**
     * 获取功能模板详情
     */
    getTemplateInfo(command: string): Promise<FeatureTemplate | null>;
    /**
     * 标准化命令格式
     */
    private normalizeCommand;
    /**
     * 获取功能模板
     */
    private getFeatureTemplate;
    /**
     * 获取默认技术栈
     */
    private getDefaultStack;
    /**
     * 构建后端变更描述
     */
    private buildBackendChanges;
    /**
     * 构建前端变更描述
     */
    private buildFrontendChanges;
    /**
     * 构建共享合约
     */
    private buildSharedContracts;
    /**
     * 生成风险提示
     */
    private generateRiskNotes;
    private mapTypeToTS;
    private mapTypeToPydantic;
}
/**
 * 导出便利函数
 */
export declare function compileFeature(command: string, context?: CompileContext): Promise<CompiledFeature>;
//# sourceMappingURL=compiler.d.ts.map