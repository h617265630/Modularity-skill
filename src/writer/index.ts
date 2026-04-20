// ============================================================================
// 文件写入器模块 - Modularity-skill
// ============================================================================

export { FileWriter, writeCode, generateFilePatches } from './file-writer.js';
export type { WriteResult, FilePatch } from './file-writer.js';

// 代码修改器 - 修改现有前端文件对接后端 API
export {
  CodeModifier,
  AICodeModifier,
  modifyExistingFrontendCode,
  findAndModifyAuthFiles,
} from './code-modifier.js';
export type { FileModification, ModificationChange, AdapterMapping } from './code-modifier.js';
