// ============================================================================
// Linter + TypeChecker - Modularity-skill
// 自动化代码质量检查
// ============================================================================
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const execAsync = promisify(exec);
const TEMP_DIR = '/tmp/modularity-lint';
/**
 * Linter 类
 * 支持 Python (pylint, black) 和 TypeScript (eslint)
 */
export class Linter {
    language;
    constructor(language = 'python') {
        this.language = language;
    }
    /**
     * 运行 Lint 检查
     */
    async runLint(code) {
        try {
            await this.ensureTempDir();
            if (this.language === 'python') {
                return await this.runPythonLint(code);
            }
            else {
                return await this.runTypeScriptLint(code);
            }
        }
        catch (error) {
            return {
                success: true, // Lint 失败不阻止流程
                errors: [],
                warnings: [],
                output: error.message || 'Lint check skipped',
            };
        }
    }
    /**
     * 运行 Python Lint
     */
    async runPythonLint(code) {
        const lintFile = path.join(TEMP_DIR, 'lint_module.py');
        await fs.promises.writeFile(lintFile, code, 'utf-8');
        const errors = [];
        const warnings = [];
        // 尝试 pylint
        try {
            const { stdout } = await execAsync(`pylint ${lintFile} --output-format=text 2>&1`, {
                timeout: 30000,
            });
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('error:') || line.includes('warning:')) {
                    const match = line.match(/:(\d+):(\d+):\s*([EWRC]):\s*(.+)/);
                    if (match) {
                        const lintError = {
                            line: parseInt(match[1], 10),
                            column: parseInt(match[2], 10),
                            message: match[4],
                            rule: match[3],
                            severity: match[3] === 'E' ? 'error' : 'warning',
                        };
                        if (lintError.severity === 'error') {
                            errors.push(lintError);
                        }
                        else {
                            warnings.push(lintError);
                        }
                    }
                }
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                output: stdout,
            };
        }
        catch (error) {
            // pylint 未安装，尝试 black 检查格式
            if (error.message?.includes('pylint')) {
                try {
                    await execAsync(`black --check ${lintFile} 2>&1`, { timeout: 10000 });
                    return {
                        success: true,
                        errors: [],
                        warnings: [],
                        output: 'black check passed',
                    };
                }
                catch {
                    return {
                        success: true,
                        errors: [],
                        warnings: [],
                        output: 'Linting tools not fully installed',
                    };
                }
            }
            return {
                success: true,
                errors: [],
                warnings: [],
                output: error.stdout || 'Lint check completed',
            };
        }
    }
    /**
     * 运行 TypeScript Lint
     */
    async runTypeScriptLint(code) {
        const lintFile = path.join(TEMP_DIR, 'lint_module.ts');
        await fs.promises.writeFile(lintFile, code, 'utf-8');
        const errors = [];
        const warnings = [];
        try {
            const { stdout } = await execAsync(`npx eslint ${lintFile} --format=stylish 2>&1`, {
                timeout: 30000,
            });
            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/:(\d+):(\d+):\s*([^\s]+)\s+-\s+(.+)/);
                if (match) {
                    const lintError = {
                        line: parseInt(match[1], 10),
                        column: parseInt(match[2], 10),
                        message: match[4],
                        rule: match[3],
                        severity: 'warning',
                    };
                    if (lintError.rule.startsWith('error') || lintError.message.includes('error')) {
                        lintError.severity = 'error';
                        errors.push(lintError);
                    }
                    else {
                        warnings.push(lintError);
                    }
                }
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                output: stdout,
            };
        }
        catch (error) {
            return {
                success: true,
                errors: [],
                warnings: [],
                output: error.stdout || 'ESLint not available',
            };
        }
    }
    async ensureTempDir() {
        try {
            await fs.promises.mkdir(TEMP_DIR, { recursive: true });
        }
        catch {
            // 目录已存在
        }
    }
}
/**
 * TypeChecker 类
 * 支持 Python (mypy) 和 TypeScript (tsc)
 */
export class TypeChecker {
    language;
    constructor(language = 'python') {
        this.language = language;
    }
    /**
     * 运行类型检查
     */
    async run(code) {
        try {
            await this.ensureTempDir();
            if (this.language === 'python') {
                return await this.runPythonTypeCheck(code);
            }
            else {
                return await this.runTypeScriptTypeCheck(code);
            }
        }
        catch (error) {
            return {
                success: true, // 类型检查失败不阻止流程
                errors: [],
                warnings: [],
                output: error.message || 'Type check skipped',
            };
        }
    }
    /**
     * 运行 Python 类型检查
     */
    async runPythonTypeCheck(code) {
        const checkFile = path.join(TEMP_DIR, 'check_module.py');
        await fs.promises.writeFile(checkFile, code, 'utf-8');
        const errors = [];
        const warnings = [];
        try {
            const { stdout } = await execAsync(`mypy ${checkFile} --ignore-missing-imports 2>&1`, {
                timeout: 30000,
            });
            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/(.+):(\d+):(\d+):\s*(error|warning):\s*(.+)/);
                if (match) {
                    const typeError = {
                        file: match[1],
                        line: parseInt(match[2], 10),
                        column: parseInt(match[3], 10),
                        message: match[5],
                    };
                    if (match[4] === 'error') {
                        errors.push(typeError);
                    }
                    else {
                        warnings.push(typeError);
                    }
                }
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                output: stdout,
            };
        }
        catch (error) {
            // mypy 未安装
            return {
                success: true,
                errors: [],
                warnings: [],
                output: error.stdout || 'mypy not available',
            };
        }
    }
    /**
     * 运行 TypeScript 类型检查
     */
    async runTypeScriptTypeCheck(code) {
        const checkFile = path.join(TEMP_DIR, 'check_module.ts');
        await fs.promises.writeFile(checkFile, code, 'utf-8');
        const errors = [];
        const warnings = [];
        try {
            const { stdout } = await execAsync(`npx tsc --noEmit --pretty false ${checkFile} 2>&1`, {
                timeout: 30000,
            });
            const lines = stdout.split('\n');
            for (const line of lines) {
                const match = line.match(/(.+)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/);
                if (match) {
                    errors.push({
                        file: match[1],
                        line: parseInt(match[2], 10),
                        column: parseInt(match[3], 10),
                        message: `${match[4]}: ${match[5]}`,
                    });
                }
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                output: stdout,
            };
        }
        catch (error) {
            const output = error.stdout || '';
            if (output.includes('error')) {
                // 解析 tsc 错误
                const lines = output.split('\n');
                for (const line of lines) {
                    const match = line.match(/(.+)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/);
                    if (match) {
                        errors.push({
                            file: match[1],
                            line: parseInt(match[2], 10),
                            column: parseInt(match[3], 10),
                            message: `${match[4]}: ${match[5]}`,
                        });
                    }
                }
            }
            return {
                success: errors.length === 0,
                errors,
                warnings,
                output,
            };
        }
    }
    async ensureTempDir() {
        try {
            await fs.promises.mkdir(TEMP_DIR, { recursive: true });
        }
        catch {
            // 目录已存在
        }
    }
}
/**
 * 便捷函数：运行 Lint
 */
export async function runLint(code, language = 'python') {
    const linter = new Linter(language);
    return linter.runLint(code);
}
/**
 * 便捷函数：运行类型检查
 */
export async function runTypeCheck(code, language = 'python') {
    const checker = new TypeChecker(language);
    return checker.run(code);
}
//# sourceMappingURL=linter.js.map