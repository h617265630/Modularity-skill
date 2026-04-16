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
    adapter?: string;
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
    handler_logic?: HandlerLogic;
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
 * 代码生成模式
 */
export type GenerationMode = 'template' | 'ai' | 'hybrid';
/**
 * AI 代码生成请求
 */
export interface AICodeRequest {
    purpose: string;
    context?: {
        model_fields?: FieldTemplate[];
        related_services?: string[];
        business_rules?: string[];
        existing_code?: string;
    };
    constraints: {
        language: 'python' | 'typescript';
        max_tokens?: number;
        temperature?: number;
    };
}
/**
 * AI 生成配置
 */
export interface GenerationConfig {
    default_mode: GenerationMode;
    ai_provider: 'claude' | 'openai' | 'local';
    ai_model: string;
    max_tokens: number;
    temperature?: number;
    rate_limit?: {
        requests_per_minute: number;
        retry_delay_ms: number;
    };
}
export declare const DEFAULT_GENERATION_CONFIG: GenerationConfig;
/**
 * 方法模板
 */
export interface MethodTemplate {
    name: string;
    description: string;
    async: boolean;
    logic?: MethodLogic;
}
/**
 * 方法业务逻辑定义
 */
export interface MethodLogic {
    type: GenerationMode;
    impl?: string;
    ai_request?: AICodeRequest;
}
/**
 * 路由处理器逻辑定义
 */
export interface HandlerLogic {
    type: GenerationMode;
    ai_request?: AICodeRequest;
}
/**
 * Hook 实现逻辑定义
 */
export interface HookImpl {
    type: GenerationMode;
    impl?: string;
    ai_request?: AICodeRequest;
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
    impl?: HookImpl;
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
    /**
     * 前端代码分析选项（手动指定扫描路径）
     */
    frontendAnalysis?: {
        hooks_dir?: string;
        components_dir?: string;
        api_services_dir?: string;
    };
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
    adapter?: string;
    tests?: {
        backend?: string;
        frontend?: string;
    };
}
/**
 * 检测到的前端代码（用于已有项目的集成）
 */
export interface DetectedFrontendCode {
    feature_name: string;
    hooks: DetectedHook[];
    components: DetectedComponent[];
    api_services: DetectedApiService[];
}
/**
 * 检测到的 Hook
 */
export interface DetectedHook {
    name: string;
    file_path: string;
    endpoints_called: HookEndpoint[];
    expected_response_shape: ResponseShape | null;
    auth_headers: string[];
}
/**
 * Hook 中调用的 API 端点
 */
export interface HookEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    has_auth: boolean;
    query_params: string[];
    request_body_type: string | null;
}
/**
 * 期望的 Response 数据结构
 */
export interface ResponseShape {
    type_name: string;
    fields: TypeField[];
    is_array: boolean;
    is_paginated: boolean;
    pagination_fields?: {
        cursor: string;
        has_more: string;
        items: string;
    };
}
/**
 * TypeScript 类型字段
 */
export interface TypeField {
    name: string;
    type: string;
    optional: boolean;
    nested_type?: string;
}
/**
 * 检测到的组件
 */
export interface DetectedComponent {
    name: string;
    file_path: string;
    props_type: string | null;
    hooks_used: string[];
}
/**
 * 检测到的 API Service 文件
 */
export interface DetectedApiService {
    file_path: string;
    base_url: string;
    endpoints: ServiceEndpoint[];
}
/**
 * Service 中的端点定义
 */
export interface ServiceEndpoint {
    method: string;
    path: string;
    function_name: string;
}
/**
 * 集成策略
 */
export type IntegrationStrategy = 'adapter' | 'backend-first' | 'frontend-first' | 'exact';
/**
 * 匹配结果
 */
export interface IntegrationMatchResult {
    strategy: IntegrationStrategy;
    matched_endpoints: MatchedEndpoint[];
    mismatched_endpoints: MismatchedEndpoint[];
    adapter_code: string | null;
    backend_patch_suggestions: string[];
    frontend_patch_suggestions: string[];
}
/**
 * 匹配的端点
 */
export interface MatchedEndpoint {
    frontend_path: string;
    backend_path: string;
    method: string;
    compatibility: 'exact' | 'compatible';
}
/**
 * 不匹配的端点
 */
export interface MismatchedEndpoint {
    frontend_path: string;
    backend_path: string | null;
    method: string;
    differences: EndpointDifference[];
    suggested_resolution: 'add-backend' | 'add-adapter' | 'update-frontend';
}
/**
 * 端点差异
 */
export interface EndpointDifference {
    aspect: 'path' | 'method' | 'response_shape' | 'auth' | 'pagination';
    frontend_expectation: string;
    backend_actual: string;
}
/**
 * 前端分析选项
 */
export interface FrontendAnalysisOptions {
    hooks_dir?: string;
    components_dir?: string;
    api_services_dir?: string;
    scan_depth?: 'shallow' | 'deep';
    infer_types?: boolean;
}
//# sourceMappingURL=types.d.ts.map