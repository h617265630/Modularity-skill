import { AICodeRequest, GenerationConfig } from '../core/types.js';
/**
 * AI 代码生成结果
 */
export interface AICodeResult {
    code: string;
    success: boolean;
    explanation?: string;
    error?: string;
}
/**
 * AI 代码生成器
 * 复用 AIFixer 的 Claude API 调用能力
 */
export declare class AICodeGenerator {
    private apiKey;
    private config;
    private requestQueue;
    private lastRequestTime;
    constructor(apiKey?: string, config?: Partial<GenerationConfig>);
    /**
     * 生成代码
     */
    generate(request: AICodeRequest): Promise<AICodeResult>;
    /**
     * 批量生成代码
     */
    generateBatch(requests: AICodeRequest[]): Promise<AICodeResult[]>;
    /**
     * 构建生成 prompt
     */
    private buildPrompt;
    /**
     * 调用 Claude API
     */
    private callClaudeAPI;
    /**
     * 从 API 响应中提取代码
     */
    private extractCode;
    /**
     * 生成占位符代码（当没有 API key 时）
     */
    private generatePlaceholder;
    /**
     * 从 purpose 中提取方法名
     */
    private extractMethodName;
    /**
     * Rate limiting 处理
     */
    private handleRateLimit;
    /**
     * 睡眠工具
     */
    private sleep;
}
/**
 * 便捷函数：生成代码
 */
export declare function generateCode(request: AICodeRequest, apiKey?: string): Promise<AICodeResult>;
//# sourceMappingURL=ai-code-generator.d.ts.map