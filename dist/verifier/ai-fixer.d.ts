import { VerificationError, FixResponse } from './types.js';
/**
 * AI 自动修复器
 * 调用 LLM API 修复代码中的错误
 */
export declare class AIFixer {
    private apiKey;
    private model;
    private language;
    constructor(apiKey?: string, model?: string, language?: 'python' | 'typescript');
    /**
     * 修复代码错误
     */
    fix(code: string, errors: VerificationError[]): Promise<FixResponse>;
    /**
     * 构建错误上下文
     */
    private buildErrorContext;
    /**
     * 调用 AI API 修复代码
     */
    private callAI;
    /**
     * 调用 Claude API
     */
    private callClaudeAPI;
    /**
     * 从 API 响应中提取代码
     */
    private extractCodeFromResponse;
    /**
     * 验证修复是否有效
     */
    private validateFix;
    /**
     * 确保临时目录存在
     */
    private ensureTempDir;
}
/**
 * 便捷函数：修复代码
 */
export declare function fixCode(code: string, errors: VerificationError[], language?: 'python' | 'typescript'): Promise<FixResponse>;
//# sourceMappingURL=ai-fixer.d.ts.map