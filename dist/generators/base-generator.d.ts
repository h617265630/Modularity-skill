import type { FilePatch, GenerationResult, Language } from './shared/types.js';
import { kebabCase, pascalCase, camelCase, snakeCase } from './shared/strings.js';
export { kebabCase, pascalCase, camelCase, snakeCase };
import type { FeatureTemplate, TechStack } from '../core/types.js';
/**
 * 生成器配置
 */
export interface GeneratorConfig {
    projectPath: string;
    language: Language;
    framework: string;
    dryRun: boolean;
}
/**
 * 基类生成器
 */
export declare abstract class BaseGenerator {
    protected config: GeneratorConfig;
    protected template: FeatureTemplate | null;
    protected stack: TechStack | null;
    constructor(config: GeneratorConfig);
    /**
     * 设置模板
     */
    setTemplate(template: FeatureTemplate): void;
    /**
     * 设置技术栈
     */
    setStack(stack: TechStack): void;
    /**
     * 生成代码 - 子类必须实现
     */
    abstract generate(template: any, stack: any): Promise<string>;
    /**
     * 生成文件头注释
     */
    protected generateFileHeader(fileName: string, description: string, isPython?: boolean): string[];
    /**
     * 从模板生成代码
     */
    protected parseTemplateCode(code: string): FilePatch[];
    /**
     * 生成导入语句
     */
    protected generateImports(imports: string[], isPython?: boolean): string[];
    /**
     * 验证模板
     */
    protected validateTemplate(): void;
    /**
     * 获取语言
     */
    protected getLanguage(): Language;
    /**
     * 判断是否为 Python
     */
    protected isPython(): boolean;
    /**
     * 判断是否为 TypeScript
     */
    protected isTypeScript(): boolean;
    /**
     * 获取框架
     */
    protected getFramework(): string;
    /**
     * 创建空的生成结果
     */
    protected emptyResult(): GenerationResult;
    /**
     * 添加警告
     */
    protected addWarning(result: GenerationResult, warning: string): void;
    /**
     * 添加错误
     */
    protected addError(result: GenerationResult, error: string): void;
    /**
     * 添加文件
     */
    protected addFile(result: GenerationResult, path: string, content: string): void;
}
//# sourceMappingURL=base-generator.d.ts.map