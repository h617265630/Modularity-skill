import { LintResult, TypeCheckResult } from './types.js';
/**
 * Linter 类
 * 支持 Python (pylint, black) 和 TypeScript (eslint)
 */
export declare class Linter {
    private language;
    constructor(language?: 'python' | 'typescript');
    /**
     * 运行 Lint 检查
     */
    runLint(code: string): Promise<LintResult>;
    /**
     * 运行 Python Lint
     */
    private runPythonLint;
    /**
     * 运行 TypeScript Lint
     */
    private runTypeScriptLint;
    private ensureTempDir;
}
/**
 * TypeChecker 类
 * 支持 Python (mypy) 和 TypeScript (tsc)
 */
export declare class TypeChecker {
    private language;
    constructor(language?: 'python' | 'typescript');
    /**
     * 运行类型检查
     */
    run(code: string): Promise<TypeCheckResult>;
    /**
     * 运行 Python 类型检查
     */
    private runPythonTypeCheck;
    /**
     * 运行 TypeScript 类型检查
     */
    private runTypeScriptTypeCheck;
    private ensureTempDir;
}
/**
 * 便捷函数：运行 Lint
 */
export declare function runLint(code: string, language?: 'python' | 'typescript'): Promise<LintResult>;
/**
 * 便捷函数：运行类型检查
 */
export declare function runTypeCheck(code: string, language?: 'python' | 'typescript'): Promise<TypeCheckResult>;
//# sourceMappingURL=linter.d.ts.map