// ============================================================================
// 类型定义 - Feature Compiler AI
// ============================================================================

/**
 * 功能编译结果 - 完整的 JSON 输出格式
 */
export interface CompiledFeature {
  feature_name: string;
  description: string;

  backend_changes: BackendChanges;
  frontend_changes: FrontendChanges;
  shared_contracts: SharedContracts;

  integration_steps: string[];
  code_patch: CodePatch;
  risk_notes: string[];
}

/**
 * 后端变更描述
 */
export interface BackendChanges {
  new_files: string[];
  modified_files: string[];
  api_routes: ApiRoute[];
  database_changes: DatabaseChange[];
}

/**
 * 前端变更描述
 */
export interface FrontendChanges {
  new_components: ComponentRef[];
  modified_components: (string | ComponentRef)[];
  state_changes: StateChange[];
  api_calls: ApiCallRef[];
}

/**
 * 共享合约（类型和 schema）
 */
export interface SharedContracts {
  types: TypeDefinition[];
  schemas: SchemaDefinition[];
}

/**
 * API 路由定义
 */
export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth_required: boolean;
}

/**
 * 数据库变更
 */
export interface DatabaseChange {
  type: 'CREATE_TABLE' | 'ALTER_TABLE' | 'ADD_COLUMN' | 'ADD_INDEX';
  table_name?: string;
  sql?: string;
  description: string;
}

/**
 * 组件引用
 */
export interface ComponentRef {
  name: string;
  path: string;
  description: string;
}

/**
 * 状态变更
 */
export interface StateChange {
  store?: 'Redux' | 'Zustand' | 'Context' | 'Recoil';
  type: string;
  description: string;
}

/**
 * API 调用引用
 */
export interface ApiCallRef {
  name: string;
  endpoint: string;
  method: string;
}

/**
 * 类型定义
 */
export interface TypeDefinition {
  name: string;
  language: 'typescript' | 'python' | 'both';
  definition: string;
}

/**
 * Schema 定义
 */
export interface SchemaDefinition {
  name: string;
  framework: 'pydantic' | 'zod' | 'both';
  definition: string;
}

/**
 * 代码补丁
 */
export interface CodePatch {
  backend: string;
  frontend: string;
  database: string;
}

/**
 * 功能模板
 */
export interface FeatureTemplate {
  command: string;
  feature_name: string;
  description: string;
  backend: BackendTemplate;
  frontend: FrontendTemplate;
  database: DatabaseTemplate;
  integration: IntegrationConfig;
}

/**
 * 后端模板
 */
export interface BackendTemplate {
  routes: RouteTemplate[];
  services: ServiceTemplate[];
  models: ModelTemplate[];
  curds?: CurdTemplate[];
}

/**
 * 路由模板
 */
export interface RouteTemplate {
  method: string;
  path: string;
  handler_name: string;
  auth_required: boolean;
}

/**
 * 服务模板
 */
export interface ServiceTemplate {
  name: string;
  description: string;
  methods: MethodTemplate[];
}

/**
 * 模型模板
 */
export interface ModelTemplate {
  name: string;
  table_name: string;
  fields: FieldTemplate[];
}

/**
 * 字段模板
 */
export interface FieldTemplate {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  foreign_key?: string;
  index?: boolean;
}

/**
 * 方法模板
 */
export interface MethodTemplate {
  name: string;
  description: string;
  async: boolean;
}

/**
 * CURD 模板
 */
export interface CurdTemplate {
  name: string;
  model_name: string;
  operations: ('create' | 'read' | 'update' | 'delete')[];
}

/**
 * 前端模板
 */
export interface FrontendTemplate {
  components: ComponentTemplate[];
  hooks: HookTemplate[];
  pages: PageTemplate[];
}

/**
 * 组件模板
 */
export interface ComponentTemplate {
  name: string;
  description: string;
  props?: PropTemplate[];
}

/**
 * Hook 模板
 */
export interface HookTemplate {
  name: string;
  description: string;
  returns: string;
}

/**
 * 页面模板
 */
export interface PageTemplate {
  name: string;
  route: string;
  description: string;
}

/**
 * Props 模板
 */
export interface PropTemplate {
  name: string;
  type: string;
  required?: boolean;
}

/**
 * 数据库模板
 */
export interface DatabaseTemplate {
  tables: TableTemplate[];
  migrations?: MigrationTemplate[];
}

/**
 * 表模板
 */
export interface TableTemplate {
  name: string;
  fields: FieldTemplate[];
  indexes?: IndexTemplate[];
}

/**
 * 索引模板
 */
export interface IndexTemplate {
  name: string;
  columns: string[];
  unique?: boolean;
}

/**
 * 迁移模板
 */
export interface MigrationTemplate {
  name: string;
  sql: string;
}

/**
 * 集成配置
 */
export interface IntegrationConfig {
  steps: string[];
  config_needed?: string[];
}

/**
 * 编译上下文
 */
export interface CompileContext {
  command: string;
  stack?: TechStack;
  existing_structure?: ProjectStructure;
  verify?: boolean;
  language?: 'python' | 'typescript';
}

/**
 * 技术栈
 */
export interface TechStack {
  frontend?: {
    framework: 'React' | 'Vue' | 'Angular';
    language?: 'TypeScript' | 'JavaScript';
    state?: 'Redux' | 'Zustand' | 'Context' | 'Recoil';
  };
  backend?: {
    framework: 'FastAPI' | 'Express' | 'Django' | 'Laravel';
    language?: 'Python' | 'JavaScript' | 'PHP';
  };
  database?: 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'SQLite';
}

/**
 * 项目结构
 */
export interface ProjectStructure {
  backend_path?: string;
  frontend_path?: string;
  api_base_url?: string;
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
