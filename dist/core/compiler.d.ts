import { CompiledFeature, CompileContext, FeatureTemplate } from './types.js';
import { ProjectStructure } from './project-scanner.js';
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
     * 扫描项目并检测前端代码（用于外部调用）
     */
    scanProject(projectPath: string): Promise<ProjectStructure>;
    /**
     * 带前端感知的编译
     * 自动检测现有前端代码并生成适配层
     * @param command 功能命令
     * @param context 编译上下文，包含 projectPath
     */
    compileWithFrontendAwareness(command: string, context?: CompileContext & {
        projectPath?: string;
    }): Promise<CompiledFeature>;
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
    /**
     * 缩短路径显示（去掉项目根路径前缀）
     */
    private shortenPath;
}
/**
 * 导出便利函数
 */
export declare function compileFeature(command: string, context?: CompileContext): Promise<CompiledFeature>;
/**
 * 带前端感知的编译便利函数
 */
export declare function compileWithFrontendAwareness(command: string, context?: CompileContext & {
    projectPath?: string;
}): Promise<CompiledFeature>;
//# sourceMappingURL=compiler.d.ts.map