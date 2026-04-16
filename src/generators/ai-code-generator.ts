// ============================================================================
// AI 代码生成器 - Modularity-skill
// 利用 AI 生成业务逻辑代码
// ============================================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import { AICodeRequest, GenerationConfig, DEFAULT_GENERATION_CONFIG } from '../core/types.js';

const execAsync = promisify(exec);

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
export class AICodeGenerator {
  private apiKey: string;
  private config: GenerationConfig;
  private requestQueue: AICodeRequest[] = [];
  private lastRequestTime: number = 0;

  constructor(apiKey?: string, config?: Partial<GenerationConfig>) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.config = { ...DEFAULT_GENERATION_CONFIG, ...config };
  }

  /**
   * 生成代码
   */
  async generate(request: AICodeRequest): Promise<AICodeResult> {
    // 如果没有 API key，返回占位符代码
    if (!this.apiKey) {
      console.warn('ANTHROPIC_API_KEY not set, generating placeholder code');
      return this.generatePlaceholder(request);
    }

    try {
      // Rate limiting
      await this.handleRateLimit();

      // 构建 prompt
      const prompt = this.buildPrompt(request);

      // 调用 API
      const response = await this.callClaudeAPI(prompt);

      // 提取代码
      const code = this.extractCode(response);

      return {
        code,
        success: true,
        explanation: `AI-generated: ${request.purpose}`,
      };
    } catch (error: any) {
      const placeholder = this.generatePlaceholder(request);
      return {
        code: placeholder.code,
        success: false,
        error: error.message || 'AI generation failed',
      };
    }
  }

  /**
   * 批量生成代码
   */
  async generateBatch(requests: AICodeRequest[]): Promise<AICodeResult[]> {
    const results: AICodeResult[] = [];

    for (const request of requests) {
      const result = await this.generate(request);
      results.push(result);

      // 请求间隔
      if (this.config.rate_limit) {
        await this.sleep(this.config.rate_limit.retry_delay_ms);
      }
    }

    return results;
  }

  /**
   * 构建生成 prompt
   */
  private buildPrompt(request: AICodeRequest): string {
    const lines: string[] = [];

    lines.push(`You are an expert ${request.constraints.language} developer.`);
    lines.push('');
    lines.push('Task:');
    lines.push(request.purpose);
    lines.push('');

    if (request.context) {
      lines.push('Context:');

      if (request.context.model_fields?.length) {
        lines.push('Model fields:');
        for (const field of request.context.model_fields) {
          lines.push(`  - ${field.name}: ${field.type}${field.nullable ? ' (nullable)' : ''}`);
        }
        lines.push('');
      }

      if (request.context.business_rules?.length) {
        lines.push('Business rules:');
        for (const rule of request.context.business_rules) {
          lines.push(`  - ${rule}`);
        }
        lines.push('');
      }

      if (request.context.related_services?.length) {
        lines.push(`Related services: ${request.context.related_services.join(', ')}`);
        lines.push('');
      }
    }

    lines.push('Requirements:');
    lines.push(`1. Write ${request.constraints.language} code only`);
    lines.push('2. Follow best practices for the language');
    if (request.constraints.language === 'python') {
      lines.push('3. Use type hints');
      lines.push('4. Use sqlalchemy.orm.Session for database operations');
      lines.push('5. Include docstrings');
    } else {
      lines.push('3. Use TypeScript with proper types');
      lines.push('4. Follow React hooks best practices');
    }
    lines.push('');
    lines.push('Code:');

    return lines.join('\n');
  }

  /**
   * 调用 Claude API
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    const model = this.config.ai_model;
    const maxTokens = this.config.max_tokens;

    const curlCommand = `curl -s https://api.anthropic.com/v1/messages \\
      -H "Content-Type: application/json" \\
      -H "x-api-key: ${this.apiKey}" \\
      -H "anthropic-version: 2023-06-01" \\
      -d '${JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: this.config.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })}'`;

    const { stdout } = await execAsync(curlCommand, { timeout: 120000 });
    const response = JSON.parse(stdout);

    if (response.error) {
      throw new Error(response.error.message || 'API error');
    }

    return response.content?.[0]?.text || '';
  }

  /**
   * 从 API 响应中提取代码
   */
  private extractCode(response: string): string {
    // 尝试提取 markdown 代码块
    const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 如果没有代码块，返回整个响应
    return response.trim();
  }

  /**
   * 生成占位符代码（当没有 API key 时）
   */
  private generatePlaceholder(request: AICodeRequest): AICodeResult {
    const language = request.constraints?.language || 'python';
    const methodName = this.extractMethodName(request.purpose);

    if (language === 'python') {
      return {
        code: `def ${methodName}(self, *args, **kwargs):
    """${request.purpose}"""
    # TODO: Implement with AI code generation
    # Requires ANTHROPIC_API_KEY environment variable
    pass`,
        success: false,
        error: 'API key not available',
      };
    } else {
      return {
        code: `// ${request.purpose}
// TODO: Implement with AI code generation
// Requires ANTHROPIC_API_KEY environment variable
export function ${methodName}(*args: any[]): any {
  throw new Error('Not implemented');
}`,
        success: false,
        error: 'API key not available',
      };
    }
  }

  /**
   * 从 purpose 中提取方法名
   */
  private extractMethodName(purpose: string): string {
    // 移除标点，转为下划线格式
    const cleaned = purpose
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 4)
      .join('_')
      .toLowerCase();
    return cleaned || 'generated_method';
  }

  /**
   * Rate limiting 处理
   */
  private async handleRateLimit(): Promise<void> {
    if (!this.config.rate_limit) return;

    const now = Date.now();
    const minInterval = 60000 / this.config.rate_limit.requests_per_minute;
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < minInterval) {
      await this.sleep(minInterval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 睡眠工具
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 便捷函数：生成代码
 */
export async function generateCode(
  request: AICodeRequest,
  apiKey?: string
): Promise<AICodeResult> {
  const generator = new AICodeGenerator(apiKey);
  return generator.generate(request);
}
