import { TestResult } from './types.js';
/**
 * 测试运行器
 * 支持 Python (pytest) 和 TypeScript (jest/vitest)
 */
export declare class TestRunner {
    private language;
    private timeout;
    constructor(language?: 'python' | 'typescript', timeout?: number);
    /**
     * 运行测试代码
     */
    run(tests: string, language?: 'python' | 'typescript'): Promise<TestResult>;
    /**
     * 运行 Python 测试
     */
    private runPythonTests;
    /**
     * 运行 TypeScript 测试
     */
    private runTypeScriptTests;
    /**
     * 确保临时目录存在
     */
    private ensureTempDir;
    /**
     * 解析 Python 测试输出
     */
    private parsePythonErrors;
    /**
     * 解析 TypeScript 测试输出
     */
    private parseTypeScriptErrors;
    /**
     * 统计通过的测试数
     */
    private countPassed;
    /**
     * 统计失败的测试数
     */
    private countFailed;
}
/**
 * 便捷函数：运行测试
 */
export declare function runTests(tests: string, language?: 'python' | 'typescript'): Promise<TestResult>;
//# sourceMappingURL=test-runner.d.ts.map