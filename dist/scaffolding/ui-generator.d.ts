import type { FeatureTemplate } from '../core/types.js';
export interface UIGenerationContext {
    moduleName: string;
    description: string;
    models: {
        name: string;
        fields: Array<{
            name: string;
            type: string;
            description?: string;
        }>;
    }[];
    components: string[];
    pages: string[];
}
/**
 * 准备 UI 生成的上下文
 */
export declare function prepareUIContext(template: FeatureTemplate): UIGenerationContext;
/**
 * 生成 UI 增强提示词
 */
export declare function generateUIPrompt(context: UIGenerationContext): string;
/**
 * UI 生成结果
 */
export interface UIGenerationResult {
    success: boolean;
    pages?: Record<string, string>;
    error?: string;
}
/**
 * 生成模块的增强 UI
 * 注意：这个函数需要与 impeccable skill 集成
 * 当前版本生成占位符，实际 UI 需要 AI 生成
 */
export declare function generateModuleUI(context: UIGenerationContext): Promise<UIGenerationResult>;
//# sourceMappingURL=ui-generator.d.ts.map