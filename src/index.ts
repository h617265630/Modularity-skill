// ============================================================================
// Modularity-skill - Feature Compiler AI
// 入口文件
// ============================================================================

export { FeatureCompiler, compileFeature } from './core/compiler.js';
export type {
  CompiledFeature,
  CompileContext,
  FeatureTemplate,
  TechStack,
  BackendChanges,
  FrontendChanges,
  SharedContracts,
  ApiRoute,
  DatabaseChange,
  ComponentRef,
  StateChange,
  ApiCallRef,
  TypeDefinition,
  SchemaDefinition,
  GeneratedCode,
} from './core/types.js';

// 验证模块
export { verifyModule, Verifier } from './verifier/index.js';
export type {
  VerificationResult,
  VerificationError,
  VerifyOptions,
  TestResult,
  LintResult,
  TypeCheckResult,
} from './verifier/index.js';

// 项目检测模块
export { detectProject, ProjectDetector } from './detector/index.js';
export type { DetectedProject, ProjectStructure } from './detector/index.js';

// 文件写入模块
export { FileWriter, writeCode, generateFilePatches } from './writer/index.js';
export type { WriteResult, FilePatch } from './writer/index.js';

// 便捷函数
export async function compile(command: string) {
  const { compileFeature } = await import('./core/compiler.js');
  return compileFeature(command);
}

// 列出所有支持的命令
export async function listCommands() {
  const { getSupportedCommands } = await import('./templates/index.js');
  return getSupportedCommands();
}

// 获取模板信息
export async function getTemplateInfo(command: string) {
  const { getTemplate } = await import('./templates/index.js');
  return getTemplate(command);
}