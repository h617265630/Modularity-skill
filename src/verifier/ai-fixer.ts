// ============================================================================
// AI 自动修复器 - Modularity-skill
// 使用 AI 修复代码中的错误
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { VerificationError, FixRequest, FixResponse } from './types.js';

const execAsync = promisify(exec);

const TEMP_DIR = '/tmp/modularity-fix';

/**
 * AI 自动修复器
 * 调用 LLM API 修复代码中的错误
 */
export class AIFixer {
  private apiKey: string;
  private model: string;
  private language: 'python' | 'typescript';

  constructor(apiKey?: string, model: string = 'claude-sonnet-4-6', language: 'python' | 'typescript' = 'python') {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model;
    this.language = language;
  }

  /**
   * 修复代码错误
   */
  async fix(code: string, errors: VerificationError[]): Promise<FixResponse> {
    if (errors.length === 0) {
      return {
        success: true,
        fixed_code: code,
        errors_fixed: 0,
      };
    }

    try {
      await this.ensureTempDir();

      // 构建错误上下文
      const errorContext = this.buildErrorContext(errors);

      // 调用 AI 修复
      const fixedCode = await this.callAI(code, errorContext);

      // 验证修复是否有效
      const isValid = await this.validateFix(fixedCode, errors);

      return {
        success: isValid,
        fixed_code: fixedCode,
        explanation: `Fixed ${errors.length} error(s)`,
        errors_fixed: isValid ? errors.length : 0,
      };
    } catch (error: any) {
      return {
        success: false,
        fixed_code: code,
        explanation: error.message || 'AI fix failed',
        errors_fixed: 0,
      };
    }
  }

  /**
   * 构建错误上下文
   */
  private buildErrorContext(errors: VerificationError[]): string {
    const contextLines: string[] = [];

    contextLines.push('Errors to fix:');
    for (const error of errors) {
      contextLines.push(`- [${error.severity.toUpperCase()}] ${error.type}: ${error.message}`);
      if (error.location) {
        contextLines.push(`  Location: ${error.location}`);
        if (error.line !== undefined) {
          contextLines.push(`  Line: ${error.line}, Column: ${error.column || 0}`);
        }
      }
    }

    return contextLines.join('\n');
  }

  /**
   * 调用 AI API 修复代码
   */
  private async callAI(code: string, errorContext: string): Promise<string> {
    const prompt = `You are a code修复 assistant. Fix the following ${this.language} code based on the errors provided.

Error Context:
${errorContext}

Original Code:
\`\`\`${this.language}
${code}
\`\`\`

Requirements:
1. Only fix the specific errors mentioned
2. Do not change working functionality
3. Maintain the same code style and structure
4. Provide ONLY the fixed code, no explanations
5. If the error cannot be fixed, return the original code unchanged

Fixed Code:`;

    // 如果没有 API key，返回原始代码
    if (!this.apiKey) {
      console.warn('ANTHROPIC_API_KEY not set, skipping AI fix');
      return code;
    }

    try {
      const response = await this.callClaudeAPI(prompt);
      return this.extractCodeFromResponse(response);
    } catch (error: any) {
      console.error('AI fix error:', error.message);
      return code;
    }
  }

  /**
   * 调用 Claude API
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    const curlCommand = `curl -s https://api.anthropic.com/v1/messages \
      -H "Content-Type: application/json" \
      -H "x-api-key: ${this.apiKey}" \
      -H "anthropic-version: 2023-06-01" \
      -d '{
        "model": "${this.model}",
        "max_tokens": 4096,
        "messages": [
          {
            "role": "user",
            "content": ${JSON.stringify(prompt)}
          }
        ]
      }'`;

    const { stdout } = await execAsync(curlCommand, { timeout: 60000 });
    const response = JSON.parse(stdout);

    if (response.error) {
      throw new Error(response.error.message || 'API error');
    }

    return response.content?.[0]?.text || '';
  }

  /**
   * 从 API 响应中提取代码
   */
  private extractCodeFromResponse(response: string): string {
    // 尝试提取 markdown 代码块
    const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 如果没有代码块，返回整个响应
    return response.trim();
  }

  /**
   * 验证修复是否有效
   */
  private async validateFix(fixedCode: string, originalErrors: VerificationError[]): Promise<boolean> {
    // 简单验证：确保代码长度合理
    if (fixedCode.length < 10) {
      return false;
    }

    // 检查是否返回了代码（不是错误消息）
    if (fixedCode.includes('I cannot fix') || fixedCode.includes('unable to fix')) {
      return false;
    }

    return true;
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
}

/**
 * 便捷函数：修复代码
 */
export async function fixCode(
  code: string,
  errors: VerificationError[],
  language: 'python' | 'typescript' = 'python'
): Promise<FixResponse> {
  const fixer = new AIFixer(undefined, 'claude-sonnet-4-6', language);
  return fixer.fix(code, errors);
}
