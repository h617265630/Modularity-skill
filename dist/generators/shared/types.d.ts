/**
 * 支持的编程语言
 */
export type Language = 'python' | 'typescript' | 'javascript' | 'php';
/**
 * 支持的前端框架
 */
export type FrontendFramework = 'react' | 'vue' | 'angular' | 'svelte' | 'nextjs' | 'nuxt';
/**
 * 支持的后端框架
 */
export type BackendFramework = 'fastapi' | 'express' | 'django' | 'laravel' | 'nestjs';
/**
 * 支持的数据库
 */
export type Database = 'postgresql' | 'mysql' | 'mongodb' | 'sqlite';
/**
 * 项目类型
 */
export interface ProjectType {
    frontend?: {
        framework: FrontendFramework;
        language: Language;
    };
    backend?: {
        framework: BackendFramework;
        language: Language;
    };
    database?: Database;
}
/**
 * 生成的文件补丁
 */
export interface FilePatch {
    path: string;
    content: string;
    action: 'create' | 'modify' | 'skip';
}
/**
 * 生成结果
 */
export interface GenerationResult {
    files: FilePatch[];
    warnings: string[];
    errors: string[];
}
/**
 * 模板字段类型
 */
export type FieldType = 'string' | 'text' | 'integer' | 'boolean' | 'datetime' | 'json' | 'float' | 'uuid' | 'email' | 'url';
/**
 * API 方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
/**
 * CRUD 操作类型
 */
export type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list' | 'search';
/**
 * 组件类型
 */
export type ComponentType = 'atom' | 'molecule' | 'organism' | 'template' | 'page';
/**
 * 验证规则
 */
export interface ValidationRule {
    type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'custom';
    value?: string | number;
    message?: string;
}
/**
 * 字段配置
 */
export interface FieldConfig {
    name: string;
    type: FieldType;
    nullable?: boolean;
    default?: string | number | boolean;
    foreign_key?: string;
    index?: boolean;
    unique?: boolean;
    validation?: ValidationRule[];
    description?: string;
}
/**
 * API 路由配置
 */
export interface RouteConfig {
    method: HttpMethod;
    path: string;
    handler_name: string;
    auth_required?: boolean;
    validation?: boolean;
    pagination?: boolean;
}
/**
 * 响应格式
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    meta?: {
        page?: number;
        page_size?: number;
        total?: number;
        has_more?: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map