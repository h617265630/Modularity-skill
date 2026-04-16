import { FeatureTemplate } from './types.js';
/**
 * Schema 节点 - 代表一个数据库表
 */
export interface SchemaNode {
    id: string;
    type: 'table' | 'column';
    table_name?: string;
    column_name?: string;
    fields: SchemaField[];
    indexes: IndexDefinition[];
    foreign_keys: ForeignKeyRef[];
    features: string[];
}
/**
 * Schema 字段
 */
export interface SchemaField {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    is_primary_key: boolean;
    is_foreign_key: boolean;
    foreign_key_ref?: ForeignKeyRef;
}
/**
 * 索引定义
 */
export interface IndexDefinition {
    name: string;
    columns: string[];
    unique: boolean;
}
/**
 * 外键引用
 */
export interface ForeignKeyRef {
    column: string;
    reference_table: string;
    reference_column: string;
    on_delete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}
/**
 * API 节点 - 代表一个 API 端点
 */
export interface ApiNode {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    handler_name: string;
    auth_required: boolean;
    request_schema?: string;
    response_schema?: string;
    features: string[];
}
/**
 * Feature 节点 - 代表一个已安装的 feature
 */
export interface FeatureNode {
    id: string;
    name: string;
    description: string;
    version: string;
    installed_at: string;
    dependencies: string[];
    schema_nodes: string[];
    api_nodes: string[];
    frontend_components: string[];
    backend_services: string[];
}
/**
 * Feature 依赖边
 */
export interface FeatureEdge {
    source: string;
    target: string;
    type: 'requires' | 'provides' | 'conflicts';
    description?: string;
}
export declare class SystemStateGraph {
    private schema_nodes;
    private api_nodes;
    private feature_nodes;
    private edges;
    constructor();
    /**
     * 添加表到 schema graph
     */
    addTable(table: {
        name: string;
        fields: Array<{
            name: string;
            type: string;
            nullable?: boolean;
            default?: string;
            foreign_key?: string;
        }>;
        indexes?: Array<{
            name: string;
            columns: string[];
            unique?: boolean;
        }>;
        feature_id?: string;
    }): SchemaNode;
    /**
     * 从 FeatureTemplate 添加完整的 schema
     */
    addFeatureSchema(template: FeatureTemplate): SchemaNode[];
    /**
     * 合并已存在的表 schema
     */
    private mergeTableSchema;
    /**
     * 获取表节点
     */
    getTable(tableName: string): SchemaNode | undefined;
    /**
     * 获取所有表
     */
    getAllTables(): SchemaNode[];
    /**
     * 检查表是否被多个 features 使用（潜在冲突）
     */
    getSharedTables(): Array<{
        table: SchemaNode;
        features: string[];
    }>;
    /**
     * 添加 API 端点
     */
    addApiEndpoint(endpoint: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path: string;
        handler_name: string;
        auth_required?: boolean;
        request_schema?: string;
        response_schema?: string;
        feature_id?: string;
    }): ApiNode;
    /**
     * 从 FeatureTemplate 添加 API
     */
    addFeatureApis(template: FeatureTemplate): ApiNode[];
    /**
     * 通过路径查找 API
     */
    getApiByPath(method: string, path: string): ApiNode | undefined;
    /**
     * 获取所有 API
     */
    getAllApis(): ApiNode[];
    /**
     * 查找路由冲突
     */
    findRouteConflicts(): Array<{
        api1: ApiNode;
        api2: ApiNode;
        type: 'exact' | 'pattern';
    }>;
    /**
     * 检查两个路径是否冲突
     * 冲突定义：两个路由会匹配相同的 URL
     *
     * 原则：只有当两个路由有相同的静态前缀，且在某个位置一个路由有参数而另一个有不同静态值时，才算冲突
     *
     * 例如：
     * - /comments/{id} vs /comments/new - 冲突（都会匹配 /comments/new）
     * - /comments/{id} vs /likes/{id} - 不冲突（base path 不同：comments vs likes）
     * - /follows/following/{user_id} vs /follows/{user_id} - 不冲突（following 是静态段）
     * - /comments vs /likes - 不冲突（完全不同的静态路径）
     */
    private pathsConflict;
    /**
     * 添加 Feature 节点
     */
    addFeature(template: FeatureTemplate): FeatureNode;
    /**
     * 推断 feature 依赖
     */
    private inferDependencies;
    /**
     * 获取 Feature 节点
     */
    getFeature(featureId: string): FeatureNode | undefined;
    /**
     * 获取所有 Features
     */
    getAllFeatures(): FeatureNode[];
    /**
     * 获取 Feature 依赖链
     */
    getDependencyChain(featureId: string): string[];
    /**
     * 添加依赖边
     */
    addEdge(edge: FeatureEdge): void;
    /**
     * 获取所有边
     */
    getAllEdges(): FeatureEdge[];
    /**
     * 获取 Feature 的所有出边
     */
    getOutgoingEdges(featureId: string): FeatureEdge[];
    /**
     * 获取 Feature 的所有入边
     */
    getIncomingEdges(featureId: string): FeatureEdge[];
    /**
     * 检测循环依赖
     */
    detectCircularDeps(): Array<{
        feature: string;
        path: string[];
    }>;
    /**
     * 拓扑排序（用于确定安装顺序）
     */
    topologicalSort(): string[] | null;
    /**
     * 导出完整图状态
     */
    export(): {
        schema_nodes: SchemaNode[];
        api_nodes: ApiNode[];
        feature_nodes: FeatureNode[];
        edges: FeatureEdge[];
    };
    /**
     * 导入图状态
     */
    import(data: ReturnType<SystemStateGraph['export']>): void;
    /**
     * 清空图
     */
    clear(): void;
    /**
     * 打印图摘要
     */
    printSummary(): void;
}
//# sourceMappingURL=state-graph.d.ts.map