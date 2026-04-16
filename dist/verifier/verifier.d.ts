import { FeatureTemplate, GeneratedCode } from '../core/types.js';
import { VerificationResult, VerifyOptions } from './types.js';
/**
 * 验证器主类
 * 协调整个模块验证流程
 */
export declare class Verifier {
    private testGenerator;
    private testRunner;
    private linter;
    private typeChecker;
    private aiFixer;
    private options;
    private language;
    constructor(options?: VerifyOptions, language?: 'python' | 'typescript');
    /**
     * 验证模块
     */
    verify(template: FeatureTemplate, code: GeneratedCode): Promise<VerificationResult>;
    /**
     * 运行测试（带重试）
     */
    private runTestsWithRetry;
    /**
     * 处理测试失败
     */
    private handleTestFailures;
    /**
     * 运行 Lint 检查
     */
    private runLint;
    /**
     * 运行类型检查
     */
    private runTypeCheck;
    /**
     * 检查契约
     */
    private checkContracts;
    /**
     * 检查集成
     */
    private checkIntegration;
    /**
     * 计算验证是否成功
     */
    private calculateSuccess;
    /**
     * 转换测试错误为验证错误
     */
    private convertTestErrors;
    /**
     * 日志输出
     */
    private log;
}
/**
 * 便捷函数：验证模块
 */
export declare function verifyModule(template: FeatureTemplate, code: GeneratedCode, options?: VerifyOptions, language?: 'python' | 'typescript'): Promise<VerificationResult>;
//# sourceMappingURL=verifier.d.ts.map