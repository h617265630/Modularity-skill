// ============================================================================
// 项目检测器模块 - Modularity-skill
// ============================================================================

export { ProjectDetector, detectProject } from './project-detector.js';
export type { DetectedProject, ProjectStructure } from './project-detector.js';
export { FrontendAnalyzer, matchFrontendToBackend } from './frontend-analyzer.js';
export type {
  DetectedFrontendCode,
  DetectedHook,
  DetectedComponent,
  DetectedApiService,
  HookEndpoint,
  ResponseShape,
  TypeField,
  IntegrationMatchResult,
  IntegrationStrategy,
  MatchedEndpoint,
  MismatchedEndpoint,
  EndpointDifference,
  FrontendAnalysisOptions,
} from '../core/types.js';
