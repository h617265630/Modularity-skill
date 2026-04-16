// ============================================================================
// 验证器主流程 - Modularity-skill
// 协调整个验证流程
// ============================================================================
import { TestGenerator } from './test-generator.js';
import { TestRunner } from './test-runner.js';
import { Linter, TypeChecker } from './linter.js';
import { AIFixer } from './ai-fixer.js';
/**
 * 验证器主类
 * 协调整个模块验证流程
 */
export class Verifier {
    testGenerator;
    testRunner;
    linter;
    typeChecker;
    aiFixer;
    options;
    language;
    constructor(options = {}, language = 'python') {
        this.testGenerator = new TestGenerator();
        this.testRunner = new TestRunner(language);
        this.linter = new Linter(language);
        this.typeChecker = new TypeChecker(language);
        this.aiFixer = new AIFixer(undefined, 'claude-sonnet-4-6', language);
        this.options = {
            max_retries: 3,
            fix_enabled: true,
            verbose: false,
            ...options,
        };
        this.language = language;
    }
    /**
     * 验证模块
     */
    async verify(template, code) {
        const startTime = Date.now();
        const result = {
            success: false,
            feature_id: template.command || template.feature_name,
            stage: 'init',
            errors: [],
            warnings: [],
            retry_count: 0,
            duration_ms: 0,
            timestamp: new Date().toISOString(),
        };
        try {
            // 阶段 1: 生成测试
            result.stage = 'generating_tests';
            this.log('Generating tests...');
            const tests = this.testGenerator.generate(template, code);
            if (!this.options.skip_tests) {
                // 阶段 2: 运行测试
                result.stage = 'running_tests';
                this.log('Running tests...');
                let testResult = await this.runTestsWithRetry(tests, code, result);
                result.test_result = testResult;
                if (!testResult.success && this.options.fix_enabled) {
                    // 阶段 3: 修复测试
                    result.stage = 'fixing_tests';
                    this.log('Fixing test failures...');
                    await this.handleTestFailures(code, tests, result);
                }
            }
            // 阶段 4: Lint 检查
            if (!this.options.skip_lint) {
                result.stage = 'running_lint';
                this.log('Running lint...');
                result.lint_result = await this.runLint(code, this.language);
            }
            // 阶段 5: 类型检查
            if (!this.options.skip_type_check) {
                result.stage = 'running_type_check';
                this.log('Running type check...');
                result.type_check_result = await this.runTypeCheck(code, this.language);
            }
            // 阶段 6: 契约测试
            if (!this.options.skip_contracts) {
                result.stage = 'checking_contracts';
                this.log('Checking contracts...');
                result.contract_result = await this.checkContracts(template, code);
            }
            // 阶段 7: 集成测试
            if (!this.options.skip_integration) {
                result.stage = 'checking_integration';
                this.log('Checking integration...');
                result.integration_result = await this.checkIntegration(template, code);
            }
            // 计算最终结果
            result.stage = 'complete';
            result.success = this.calculateSuccess(result);
            result.duration_ms = Date.now() - startTime;
            this.log(`Verification ${result.success ? 'PASSED' : 'FAILED'} in ${result.duration_ms}ms`);
            return result;
        }
        catch (error) {
            result.stage = 'failed';
            result.errors.push({
                type: 'runtime',
                location: 'Verifier.verify',
                message: error.message || 'Verification failed',
                severity: 'error',
            });
            result.duration_ms = Date.now() - startTime;
            return result;
        }
    }
    /**
     * 运行测试（带重试）
     */
    async runTestsWithRetry(tests, code, result) {
        let lastResult = null;
        for (let i = 0; i < (this.options.max_retries || 1); i++) {
            result.retry_count = i;
            // 运行后端测试
            const backendResult = tests.backend
                ? await this.testRunner.run(tests.backend, 'python')
                : { success: true, passed: 0, failed: 0, errors: [], output: '', duration_ms: 0 };
            // 运行前端测试
            const frontendResult = tests.frontend
                ? await this.testRunner.run(tests.frontend, 'typescript')
                : { success: true, passed: 0, failed: 0, errors: [], output: '', duration_ms: 0 };
            lastResult = {
                success: backendResult.success && frontendResult.success,
                passed: backendResult.passed + frontendResult.passed,
                failed: backendResult.failed + frontendResult.failed,
                errors: [...backendResult.errors, ...frontendResult.errors],
                output: `Backend:\n${backendResult.output}\nFrontend:\n${frontendResult.output}`,
                duration_ms: backendResult.duration_ms + frontendResult.duration_ms,
            };
            if (lastResult.success) {
                return lastResult;
            }
            // 如果失败且启用了修复，尝试修复
            if (this.options.fix_enabled && code.backend) {
                this.log(`Test failed (attempt ${i + 1}), trying to fix...`);
                const fixResult = await this.aiFixer.fix(code.backend, this.convertTestErrors(lastResult.errors));
                if (fixResult.success) {
                    code.backend = fixResult.fixed_code;
                }
            }
        }
        return lastResult;
    }
    /**
     * 处理测试失败
     */
    async handleTestFailures(code, tests, result) {
        if (!result.test_result || result.test_result.errors.length === 0) {
            return;
        }
        const errors = this.convertTestErrors(result.test_result.errors);
        // 修复后端代码
        if (code.backend) {
            const backendFixResult = await this.aiFixer.fix(code.backend, errors);
            if (backendFixResult.success && backendFixResult.fixed_code !== code.backend) {
                code.backend = backendFixResult.fixed_code;
                result.warnings.push({
                    type: 'runtime',
                    location: 'backend',
                    message: 'Backend code auto-fixed',
                    severity: 'warning',
                });
            }
        }
    }
    /**
     * 运行 Lint 检查
     */
    async runLint(code, language) {
        const backendLint = code.backend
            ? await this.linter.runLint(code.backend)
            : { success: true, errors: [], warnings: [], output: '' };
        const frontendLint = code.frontend
            ? await this.linter.runLint(code.frontend)
            : { success: true, errors: [], warnings: [], output: '' };
        return {
            success: backendLint.success && frontendLint.success,
            errors: [...backendLint.errors, ...frontendLint.errors],
            warnings: [...backendLint.warnings, ...frontendLint.warnings],
            output: `Backend:\n${backendLint.output}\nFrontend:\n${frontendLint.output}`,
        };
    }
    /**
     * 运行类型检查
     */
    async runTypeCheck(code, language) {
        const backendCheck = code.backend
            ? await this.typeChecker.run(code.backend)
            : { success: true, errors: [], warnings: [], output: '' };
        const frontendCheck = code.frontend
            ? await this.typeChecker.run(code.frontend)
            : { success: true, errors: [], warnings: [], output: '' };
        return {
            success: backendCheck.success && frontendCheck.success,
            errors: [...backendCheck.errors, ...frontendCheck.errors],
            warnings: [...backendCheck.warnings, ...frontendCheck.warnings],
            output: `Backend:\n${backendCheck.output}\nFrontend:\n${frontendCheck.output}`,
        };
    }
    /**
     * 检查契约
     */
    async checkContracts(template, code) {
        const routes = template.backend?.routes || [];
        const errors = [];
        // 简单契约检查：验证路由定义
        for (const route of routes) {
            if (!route.path || !route.method) {
                errors.push({
                    route: route.path || 'unknown',
                    method: route.method || 'unknown',
                    expected_status: 200,
                    message: 'Invalid route definition',
                });
            }
        }
        return {
            success: errors.length === 0,
            routes_tested: routes.length,
            routes_passed: routes.length - errors.length,
            routes_failed: errors.length,
            errors: errors,
        };
    }
    /**
     * 检查集成
     */
    async checkIntegration(template, code) {
        const integration = template.integration || { steps: [] };
        const errors = [];
        // 简单集成检查：验证集成步骤
        if (!integration.steps || integration.steps.length === 0) {
            errors.push({
                dependency: 'integration',
                type: 'missing',
                message: 'No integration steps defined',
            });
        }
        return {
            success: errors.length === 0,
            dependencies_tested: integration.steps?.length || 0,
            dependencies_passed: errors.length === 0 ? (integration.steps?.length || 0) : 0,
            dependencies_failed: errors.length,
            errors: errors,
        };
    }
    /**
     * 计算验证是否成功
     */
    calculateSuccess(result) {
        if (result.test_result && !result.test_result.success) {
            return false;
        }
        if (result.lint_result && !result.lint_result.success) {
            return false;
        }
        if (result.type_check_result && !result.type_check_result.success) {
            return false;
        }
        if (result.contract_result && !result.contract_result.success) {
            return false;
        }
        if (result.integration_result && !result.integration_result.success) {
            return false;
        }
        return true;
    }
    /**
     * 转换测试错误为验证错误
     */
    convertTestErrors(testErrors) {
        return testErrors.map((err) => ({
            type: 'test',
            location: err.name,
            message: err.message,
            severity: 'error',
        }));
    }
    /**
     * 日志输出
     */
    log(message) {
        if (this.options.verbose) {
            console.log(`[Verifier] ${message}`);
        }
    }
}
/**
 * 便捷函数：验证模块
 */
export async function verifyModule(template, code, options, language = 'python') {
    const verifier = new Verifier(options, language);
    return verifier.verify(template, code);
}
//# sourceMappingURL=verifier.js.map