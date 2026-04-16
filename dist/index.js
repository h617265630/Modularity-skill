// ============================================================================
// Modularity-skill - Feature Compiler AI
// 入口文件
// ============================================================================
export { FeatureCompiler, compileFeature, compileWithFrontendAwareness } from './core/compiler.js';
// 验证模块
export { verifyModule, Verifier } from './verifier/index.js';
// 项目检测模块
export { detectProject, ProjectDetector } from './detector/index.js';
// 文件写入模块
export { FileWriter, writeCode, generateFilePatches } from './writer/index.js';
// 便捷函数
export async function compile(command) {
    const { compileFeature } = await import('./core/compiler.js');
    return compileFeature(command);
}
// 列出所有支持的命令
export async function listCommands() {
    const { getSupportedCommands } = await import('./templates/index.js');
    return getSupportedCommands();
}
// 获取模板信息
export async function getTemplateInfo(command) {
    const { getTemplate } = await import('./templates/index.js');
    return getTemplate(command);
}
//# sourceMappingURL=index.js.map