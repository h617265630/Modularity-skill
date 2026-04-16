// ============================================================================
// 验证器类型定义 - Modularity-skill
// ============================================================================

import { FeatureTemplate } from '../core/types.js';

/**
 * 验证错误
 */
export interface VerificationError {
  type: 'test' | 'lint' | 'type_check' | 'contract' | 'syntax' | 'runtime';
  location: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
  code?: string;
}

/**
 * 测试结果
 */
export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  errors: TestError[];
  output: string;
  duration_ms: number;
}

/**
 * 测试错误
 */
export interface TestError {
  name: string;
  message: string;
  location?: string;
  stack?: string;
}

/**
 * Lint 结果
 */
export interface LintResult {
  success: boolean;
  errors: LintError[];
  warnings: LintWarning[];
  output: string;
}

/**
 * Lint 错误
 */
export interface LintError {
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: 'error' | 'warning';
}

/**
 * Lint 警告
 */
export interface LintWarning {
  line: number;
  column: number;
  message: string;
  rule: string;
}

/**
 * 类型检查结果
 */
export interface TypeCheckResult {
  success: boolean;
  errors: TypeError[];
  warnings: TypeWarning[];
  output: string;
}

/**
 * 类型错误
 */
export interface TypeError {
  line: number;
  column: number;
  message: string;
  file: string;
}

/**
 * 类型警告
 */
export interface TypeWarning {
  line: number;
  column: number;
  message: string;
  file: string;
}

/**
 * 验证结果
 */
export interface VerificationResult {
  success: boolean;
  feature_id: string;
  stage: VerificationStage;
  test_result?: TestResult;
  lint_result?: LintResult;
  type_check_result?: TypeCheckResult;
  contract_result?: ContractResult;
  integration_result?: IntegrationResult;
  errors: VerificationError[];
  warnings: VerificationError[];
  retry_count: number;
  duration_ms: number;
  timestamp: string;
}

/**
 * 验证阶段
 */
export type VerificationStage =
  | 'init'
  | 'generating_tests'
  | 'running_tests'
  | 'fixing_tests'
  | 'running_lint'
  | 'running_type_check'
  | 'checking_contracts'
  | 'checking_integration'
  | 'complete'
  | 'failed';

/**
 * 契约测试结果
 */
export interface ContractResult {
  success: boolean;
  routes_tested: number;
  routes_passed: number;
  routes_failed: number;
  errors: ContractError[];
}

/**
 * 契约错误
 */
export interface ContractError {
  route: string;
  method: string;
  expected_status: number;
  actual_status?: number;
  expected_schema?: boolean;
  actual_schema?: boolean;
  message: string;
}

/**
 * 集成测试结果
 */
export interface IntegrationResult {
  success: boolean;
  dependencies_tested: number;
  dependencies_passed: number;
  dependencies_failed: number;
  errors: IntegrationError[];
}

/**
 * 集成错误
 */
export interface IntegrationError {
  dependency: string;
  type: 'missing' | 'version_mismatch' | 'api_incompatible';
  message: string;
}

/**
 * 验证选项
 */
export interface VerifyOptions {
  skip_tests?: boolean;
  skip_lint?: boolean;
  skip_type_check?: boolean;
  skip_contracts?: boolean;
  skip_integration?: boolean;
  max_retries?: number;
  fix_enabled?: boolean;
  verbose?: boolean;
}

/**
 * 生成的代码
 */
export interface GeneratedCode {
  backend?: string;
  frontend?: string;
  database?: string;
  tests?: {
    backend?: string;
    frontend?: string;
  };
}

/**
 * 功能验收检查项
 */
export interface AcceptanceChecklist {
  feature_id: string;
  checks: AcceptanceCheck[];
  passed: boolean;
  checked_at: string;
}

/**
 * 验收检查项
 */
export interface AcceptanceCheck {
  id: string;
  description: string;
  passed: boolean;
  details?: string;
}

/**
 * AI 修复请求
 */
export interface FixRequest {
  code: string;
  language: 'python' | 'typescript';
  errors: VerificationError[];
  context?: {
    template?: FeatureTemplate;
    file_path?: string;
  };
}

/**
 * AI 修复响应
 */
export interface FixResponse {
  success: boolean;
  fixed_code: string;
  explanation?: string;
  errors_fixed: number;
}
