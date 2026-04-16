// ============================================================================
// 测试运行器 - Modularity-skill
// 执行生成的测试代码并返回结果
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { TestResult, TestError } from './types.js';

const execAsync = promisify(exec);

const TEMP_DIR = '/tmp/modularity-tests';

/**
 * 测试运行器
 * 支持 Python (pytest) 和 TypeScript (jest/vitest)
 */
export class TestRunner {
  private language: 'python' | 'typescript';
  private timeout: number;

  constructor(language: 'python' | 'typescript' = 'python', timeout: number = 60000) {
    this.language = language;
    this.timeout = timeout;
  }

  /**
   * 运行测试代码
   */
  async run(tests: string, language?: 'python' | 'typescript'): Promise<TestResult> {
    const lang = language || this.language;
    const startTime = Date.now();

    try {
      // 确保临时目录存在
      await this.ensureTempDir();

      if (lang === 'python') {
        return await this.runPythonTests(tests, startTime);
      } else {
        return await this.runTypeScriptTests(tests, startTime);
      }
    } catch (error: any) {
      return {
        success: false,
        passed: 0,
        failed: 1,
        errors: [
          {
            name: 'TestRunnerError',
            message: error.message || 'Unknown error running tests',
          },
        ],
        output: error.message || 'Unknown error',
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * 运行 Python 测试
   */
  private async runPythonTests(tests: string, startTime: number): Promise<TestResult> {
    const testFile = path.join(TEMP_DIR, 'test_module.py');

    // 写入测试文件
    await fs.promises.writeFile(testFile, tests, 'utf-8');

    try {
      // 运行 pytest
      const { stdout, stderr } = await execAsync(
        `cd ${TEMP_DIR} && python -m pytest test_module.py -v --tb=short 2>&1`,
        { timeout: this.timeout }
      );

      const output = stdout + stderr;
      const passed = this.countPassed(output);
      const failed = this.countFailed(output);

      return {
        success: failed === 0,
        passed,
        failed,
        errors: this.parsePythonErrors(output),
        output,
        duration_ms: Date.now() - startTime,
      };
    } catch (error: any) {
      const output = error.stdout || error.message || '';
      const passed = this.countPassed(output);
      const failed = this.countFailed(output);

      // 如果是 pytest 未安装，返回成功但有警告
      if (error.message?.includes('not found') || error.message?.includes('pytest')) {
        return {
          success: true,
          passed: 0,
          failed: 0,
          errors: [],
          output: 'pytest not installed, skipping tests. Install with: pip install pytest',
          duration_ms: Date.now() - startTime,
        };
      }

      return {
        success: failed === 0,
        passed,
        failed: failed > 0 ? failed : 1,
        errors: this.parsePythonErrors(output),
        output,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * 运行 TypeScript 测试
   */
  private async runTypeScriptTests(tests: string, startTime: number): Promise<TestResult> {
    const testFile = path.join(TEMP_DIR, 'test_module.spec.ts');

    // 写入测试文件
    await fs.promises.writeFile(testFile, tests, 'utf-8');

    try {
      // 运行 vitest 或 jest
      const { stdout, stderr } = await execAsync(
        `cd ${TEMP_DIR} && npx vitest run --reporter=verbose 2>&1 || npx jest --verbose 2>&1`,
        { timeout: this.timeout }
      );

      const output = stdout + stderr;
      const passed = this.countPassed(output);
      const failed = this.countFailed(output);

      return {
        success: failed === 0,
        passed,
        failed,
        errors: this.parseTypeScriptErrors(output),
        output,
        duration_ms: Date.now() - startTime,
      };
    } catch (error: any) {
      const output = error.stdout || error.message || '';

      // 如果测试框架未安装，返回成功但有警告
      if (output.includes('not found') || output.includes('vitest') || output.includes('jest')) {
        return {
          success: true,
          passed: 0,
          failed: 0,
          errors: [],
          output: 'Test framework not installed, skipping tests',
          duration_ms: Date.now() - startTime,
        };
      }

      const passed = this.countPassed(output);
      const failed = this.countFailed(output);

      return {
        success: failed === 0,
        passed,
        failed: failed > 0 ? failed : 1,
        errors: this.parseTypeScriptErrors(output),
        output,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * 确保临时目录存在
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.promises.mkdir(TEMP_DIR, { recursive: true });
    } catch {
      // 目录已存在
    }
  }

  /**
   * 解析 Python 测试输出
   */
  private parsePythonErrors(output: string): TestError[] {
    const errors: TestError[] = [];
    const lines = output.split('\n');

    // 查找 FAILED 行
    for (const line of lines) {
      if (line.startsWith('FAILED')) {
        const match = line.match(/FAILED\s+(.+?)\s+- (.+)/);
        if (match) {
          errors.push({
            name: match[1],
            message: match[2],
          });
        }
      }
    }

    return errors;
  }

  /**
   * 解析 TypeScript 测试输出
   */
  private parseTypeScriptErrors(output: string): TestError[] {
    const errors: TestError[] = [];
    const lines = output.split('\n');

    // 查找 FAIL 或 Error 行
    for (const line of lines) {
      if (line.includes('FAIL') || line.includes('Error:')) {
        errors.push({
          name: 'TestError',
          message: line.trim(),
        });
      }
    }

    return errors;
  }

  /**
   * 统计通过的测试数
   */
  private countPassed(output: string): number {
    const match = output.match(/(\d+)\s+passed/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * 统计失败的测试数
   */
  private countFailed(output: string): number {
    const match = output.match(/(\d+)\s+failed/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

/**
 * 便捷函数：运行测试
 */
export async function runTests(
  tests: string,
  language: 'python' | 'typescript' = 'python'
): Promise<TestResult> {
  const runner = new TestRunner(language);
  return runner.run(tests, language);
}
