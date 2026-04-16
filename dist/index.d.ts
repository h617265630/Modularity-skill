export { FeatureCompiler, compileFeature, compileWithFrontendAwareness } from './core/compiler.js';
export type { CompiledFeature, CompileContext, FeatureTemplate, TechStack, BackendChanges, FrontendChanges, SharedContracts, ApiRoute, DatabaseChange, ComponentRef, StateChange, ApiCallRef, TypeDefinition, SchemaDefinition, GeneratedCode, } from './core/types.js';
export { verifyModule, Verifier } from './verifier/index.js';
export type { VerificationResult, VerificationError, VerifyOptions, TestResult, LintResult, TypeCheckResult, } from './verifier/index.js';
export { detectProject, ProjectDetector } from './detector/index.js';
export type { DetectedProject, ProjectStructure } from './detector/index.js';
export { FileWriter, writeCode, generateFilePatches } from './writer/index.js';
export type { WriteResult, FilePatch } from './writer/index.js';
export declare function compile(command: string): Promise<import("./core/types.js").CompiledFeature>;
export declare function listCommands(): Promise<string[]>;
export declare function getTemplateInfo(command: string): Promise<import("./core/types.js").FeatureTemplate | null>;
//# sourceMappingURL=index.d.ts.map