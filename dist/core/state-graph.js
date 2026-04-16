// ============================================================================
// System State Graph - Feature Compiler AI
// 系统状态图 - 记录 schema/API/feature 的全局状态
// ============================================================================
// ============================================================================
// System State Graph 主类
// ============================================================================
export class SystemStateGraph {
    schema_nodes = new Map();
    api_nodes = new Map();
    feature_nodes = new Map();
    edges = [];
    constructor() { }
    // ============================================================================
    // Schema Graph 操作
    // ============================================================================
    /**
     * 添加表到 schema graph
     */
    addTable(table) {
        const fields = table.fields.map(f => {
            const field = {
                name: f.name,
                type: f.type,
                nullable: f.nullable ?? true,
                default: f.default,
                is_primary_key: f.name === 'id',
                is_foreign_key: !!f.foreign_key,
            };
            if (f.foreign_key) {
                const [refTable, refColumn] = f.foreign_key.split('.');
                field.foreign_key_ref = {
                    column: f.name,
                    reference_table: refTable,
                    reference_column: refColumn || 'id',
                    on_delete: 'CASCADE',
                };
            }
            return field;
        });
        const foreign_keys = fields
            .filter(f => f.is_foreign_key && f.foreign_key_ref)
            .map(f => f.foreign_key_ref);
        const indexes = (table.indexes || []).map(idx => ({
            name: idx.name,
            columns: idx.columns,
            unique: idx.unique || false,
        }));
        const node = {
            id: table.name,
            type: 'table',
            table_name: table.name,
            fields,
            indexes,
            foreign_keys,
            features: table.feature_id ? [table.feature_id] : [],
        };
        this.schema_nodes.set(table.name, node);
        return node;
    }
    /**
     * 从 FeatureTemplate 添加完整的 schema
     */
    addFeatureSchema(template) {
        const nodes = [];
        for (const table of template.database.tables) {
            const existing = this.schema_nodes.get(table.name);
            if (existing) {
                // 表已存在，合并字段
                this.mergeTableSchema(table.name, table.fields, template.command);
            }
            else {
                // 新建表
                const node = this.addTable({
                    name: table.name,
                    fields: table.fields.map(f => ({
                        name: f.name,
                        type: f.type,
                        nullable: f.nullable,
                        default: f.default,
                        foreign_key: f.foreign_key,
                    })),
                    indexes: table.indexes?.map(idx => ({
                        name: idx.name,
                        columns: idx.columns,
                        unique: idx.unique,
                    })),
                    feature_id: template.command,
                });
                nodes.push(node);
            }
        }
        return nodes;
    }
    /**
     * 合并已存在的表 schema
     */
    mergeTableSchema(tableName, newFields, featureId) {
        const existing = this.schema_nodes.get(tableName);
        if (!existing)
            return;
        // 添加 feature 引用
        if (!existing.features.includes(featureId)) {
            existing.features.push(featureId);
        }
        // 检查字段冲突
        for (const newField of newFields) {
            const existingField = existing.fields.find(f => f.name === newField.name);
            if (existingField) {
                // 字段类型不一致警告
                if (existingField.type !== newField.type) {
                    console.warn(`[StateGraph] Field type mismatch for ${tableName}.${newField.name}: ${existingField.type} vs ${newField.type}`);
                }
            }
        }
    }
    /**
     * 获取表节点
     */
    getTable(tableName) {
        return this.schema_nodes.get(tableName);
    }
    /**
     * 获取所有表
     */
    getAllTables() {
        return Array.from(this.schema_nodes.values());
    }
    /**
     * 检查表是否被多个 features 使用（潜在冲突）
     */
    getSharedTables() {
        const shared = [];
        for (const node of this.schema_nodes.values()) {
            if (node.features.length > 1) {
                shared.push({ table: node, features: node.features });
            }
        }
        return shared;
    }
    // ============================================================================
    // API Graph 操作
    // ============================================================================
    /**
     * 添加 API 端点
     */
    addApiEndpoint(endpoint) {
        const id = `${endpoint.method} ${endpoint.path}`;
        const node = {
            id,
            method: endpoint.method,
            path: endpoint.path,
            handler_name: endpoint.handler_name,
            auth_required: endpoint.auth_required || false,
            request_schema: endpoint.request_schema,
            response_schema: endpoint.response_schema,
            features: endpoint.feature_id ? [endpoint.feature_id] : [],
        };
        this.api_nodes.set(id, node);
        return node;
    }
    /**
     * 从 FeatureTemplate 添加 API
     */
    addFeatureApis(template) {
        const nodes = [];
        for (const route of template.backend.routes) {
            const existing = this.getApiByPath(route.method, route.path);
            if (existing) {
                // API 已存在，检查冲突
                if (!existing.features.includes(template.command)) {
                    existing.features.push(template.command);
                }
            }
            else {
                const node = this.addApiEndpoint({
                    method: route.method,
                    path: route.path,
                    handler_name: route.handler_name,
                    auth_required: route.auth_required,
                    feature_id: template.command,
                });
                nodes.push(node);
            }
        }
        return nodes;
    }
    /**
     * 通过路径查找 API
     */
    getApiByPath(method, path) {
        return this.api_nodes.get(`${method} ${path}`);
    }
    /**
     * 获取所有 API
     */
    getAllApis() {
        return Array.from(this.api_nodes.values());
    }
    /**
     * 查找路由冲突
     */
    findRouteConflicts() {
        const conflicts = [];
        const apis = this.getAllApis();
        for (let i = 0; i < apis.length; i++) {
            for (let j = i + 1; j < apis.length; j++) {
                const api1 = apis[i];
                const api2 = apis[j];
                // 完全相同的路径
                if (api1.path === api2.path && api1.method === api2.method) {
                    conflicts.push({ api1, api2, type: 'exact' });
                }
                // 路径模式冲突 (如 /comments/{id} vs /comments/new)
                else if (this.pathsConflict(api1.path, api2.path)) {
                    conflicts.push({ api1, api2, type: 'pattern' });
                }
            }
        }
        return conflicts;
    }
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
    pathsConflict(path1, path2) {
        const segs1 = path1.split('/').filter(s => s);
        const segs2 = path2.split('/').filter(s => s);
        if (segs1.length !== segs2.length)
            return false;
        // 找到第一个参数的位置
        const firstParamPos1 = segs1.findIndex(s => s.startsWith('{'));
        const firstParamPos2 = segs2.findIndex(s => s.startsWith('{'));
        // 情况1：两个路径都没有参数
        // 只有完全相同的静态路径才冲突（这种情况在上面已经处理了）
        if (firstParamPos1 === -1 && firstParamPos2 === -1) {
            return false; // /comments vs /likes 等不同静态路径不冲突
        }
        // 情况2：只有一个路径有参数
        if (firstParamPos1 === -1 || firstParamPos2 === -1) {
            // 例如 /comments vs /comments/{id}
            // 它们不会冲突，因为一个是精确静态匹配，一个是参数化匹配
            return false;
        }
        // 情况3：两个路径都有参数
        // 获取静态前缀
        const staticPrefix1 = segs1.slice(0, firstParamPos1);
        const staticPrefix2 = segs2.slice(0, firstParamPos2);
        // 静态前缀不同？→ 不冲突（不同资源）
        if (staticPrefix1.length !== staticPrefix2.length ||
            !staticPrefix1.every((s, i) => s === staticPrefix2[i])) {
            return false;
        }
        // 静态前缀相同，现在检查从第一个参数开始的段
        // 如果一个路由在某位置有参数，而另一个有不同静态值，则冲突
        for (let i = firstParamPos1; i < segs1.length; i++) {
            const s1 = segs1[i];
            const s2 = segs2[i];
            // 调整位置以处理第二个路由参数位置不同的情况
            const adjustedI = i - firstParamPos1 + firstParamPos2;
            if (adjustedI >= segs2.length)
                break;
            const isParam1 = s1.startsWith('{');
            const isParam2 = segs2[adjustedI].startsWith('{');
            if (isParam1 && isParam2) {
                // 都是参数，不冲突
                continue;
            }
            if (isParam1 !== isParam2) {
                // 一个是参数，一个静态值？检查静态前缀是否相同
                const prefix1 = segs1.slice(0, i);
                const prefix2 = segs2.slice(0, adjustedI);
                if (prefix1.length === prefix2.length &&
                    prefix1.every((s, j) => s === prefix2[j])) {
                    return true; // 冲突！
                }
            }
            // 两个都是静态值？不同则冲突
            if (!isParam1 && !isParam2 && s1 !== segs2[adjustedI]) {
                return true;
            }
        }
        return false;
    }
    // ============================================================================
    // Feature Graph 操作
    // ============================================================================
    /**
     * 添加 Feature 节点
     */
    addFeature(template) {
        const node = {
            id: template.command,
            name: template.feature_name,
            description: template.description,
            version: '1.0.0',
            installed_at: new Date().toISOString(),
            dependencies: this.inferDependencies(template),
            schema_nodes: template.database.tables.map(t => t.name),
            api_nodes: template.backend.routes.map(r => `${r.method} ${r.path}`),
            frontend_components: template.frontend.components.map(c => c.name),
            backend_services: template.backend.services.map(s => s.name),
        };
        this.feature_nodes.set(template.command, node);
        return node;
    }
    /**
     * 推断 feature 依赖
     */
    inferDependencies(template) {
        const deps = [];
        // 检查外键依赖
        for (const table of template.database.tables) {
            for (const field of table.fields) {
                if (field.foreign_key) {
                    const [refTable] = field.foreign_key.split('.');
                    // 查找是否已有表定义了 refTable
                    if (this.schema_nodes.has(refTable)) {
                        // 查找哪个 feature 创建了这个表
                        const tableNode = this.schema_nodes.get(refTable);
                        if (tableNode && tableNode.features.length > 0) {
                            for (const featureId of tableNode.features) {
                                if (!deps.includes(featureId) && featureId !== template.command) {
                                    deps.push(featureId);
                                }
                            }
                        }
                    }
                }
            }
        }
        return deps;
    }
    /**
     * 获取 Feature 节点
     */
    getFeature(featureId) {
        return this.feature_nodes.get(featureId);
    }
    /**
     * 获取所有 Features
     */
    getAllFeatures() {
        return Array.from(this.feature_nodes.values());
    }
    /**
     * 获取 Feature 依赖链
     */
    getDependencyChain(featureId) {
        const chain = [];
        const visited = new Set();
        const traverse = (id) => {
            const node = this.feature_nodes.get(id);
            if (!node)
                return;
            for (const dep of node.dependencies) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    chain.push(dep);
                    traverse(dep);
                }
            }
        };
        traverse(featureId);
        return chain;
    }
    // ============================================================================
    // 依赖边操作
    // ============================================================================
    /**
     * 添加依赖边
     */
    addEdge(edge) {
        // 避免重复边
        const exists = this.edges.some(e => e.source === edge.source && e.target === edge.target && e.type === edge.type);
        if (!exists) {
            this.edges.push(edge);
        }
    }
    /**
     * 获取所有边
     */
    getAllEdges() {
        return [...this.edges];
    }
    /**
     * 获取 Feature 的所有出边
     */
    getOutgoingEdges(featureId) {
        return this.edges.filter(e => e.source === featureId);
    }
    /**
     * 获取 Feature 的所有入边
     */
    getIncomingEdges(featureId) {
        return this.edges.filter(e => e.target === featureId);
    }
    // ============================================================================
    // 图分析
    // ============================================================================
    /**
     * 检测循环依赖
     */
    detectCircularDeps() {
        const cycles = [];
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            const node = this.feature_nodes.get(nodeId);
            if (node) {
                for (const dep of node.dependencies) {
                    if (!visited.has(dep)) {
                        if (dfs(dep, [...path])) {
                            return true;
                        }
                    }
                    else if (recursionStack.has(dep)) {
                        // 发现循环
                        const cycleStart = path.indexOf(dep);
                        cycles.push({
                            feature: dep,
                            path: [...path.slice(cycleStart), dep],
                        });
                        return true;
                    }
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };
        for (const featureId of this.feature_nodes.keys()) {
            if (!visited.has(featureId)) {
                dfs(featureId, []);
            }
        }
        return cycles;
    }
    /**
     * 拓扑排序（用于确定安装顺序）
     */
    topologicalSort() {
        const result = [];
        const visited = new Set();
        const temp = new Set();
        const dfs = (nodeId) => {
            if (temp.has(nodeId))
                return false; // 循环依赖
            if (visited.has(nodeId))
                return true;
            temp.add(nodeId);
            const node = this.feature_nodes.get(nodeId);
            if (node) {
                for (const dep of node.dependencies) {
                    if (!dfs(dep))
                        return false;
                }
            }
            temp.delete(nodeId);
            visited.add(nodeId);
            result.push(nodeId);
            return true;
        };
        for (const featureId of this.feature_nodes.keys()) {
            if (!visited.has(featureId)) {
                if (!dfs(featureId)) {
                    return null; // 有循环依赖
                }
            }
        }
        return result.reverse();
    }
    // ============================================================================
    // 序列化 / 导出
    // ============================================================================
    /**
     * 导出完整图状态
     */
    export() {
        return {
            schema_nodes: Array.from(this.schema_nodes.values()),
            api_nodes: Array.from(this.api_nodes.values()),
            feature_nodes: Array.from(this.feature_nodes.values()),
            edges: [...this.edges],
        };
    }
    /**
     * 导入图状态
     */
    import(data) {
        this.schema_nodes = new Map(data.schema_nodes.map(n => [n.id, n]));
        this.api_nodes = new Map(data.api_nodes.map(n => [n.id, n]));
        this.feature_nodes = new Map(data.feature_nodes.map(n => [n.id, n]));
        this.edges = [...data.edges];
    }
    /**
     * 清空图
     */
    clear() {
        this.schema_nodes.clear();
        this.api_nodes.clear();
        this.feature_nodes.clear();
        this.edges = [];
    }
    /**
     * 打印图摘要
     */
    printSummary() {
        console.log('\n📊 System State Graph Summary');
        console.log('─'.repeat(50));
        console.log(`Tables: ${this.schema_nodes.size}`);
        console.log(`API Endpoints: ${this.api_nodes.size}`);
        console.log(`Features: ${this.feature_nodes.size}`);
        console.log(`Edges: ${this.edges.length}`);
        if (this.schema_nodes.size > 0) {
            console.log('\n📋 Tables:');
            for (const node of this.schema_nodes.values()) {
                console.log(`  - ${node.id} (${node.fields.length} fields) <- [${node.features.join(', ')}]`);
            }
        }
        if (this.api_nodes.size > 0) {
            console.log('\n🔗 APIs:');
            for (const node of this.api_nodes.values()) {
                console.log(`  - ${node.method} ${node.path} <- [${node.features.join(', ')}]`);
            }
        }
        if (this.feature_nodes.size > 0) {
            console.log('\n🧩 Features:');
            for (const node of this.feature_nodes.values()) {
                console.log(`  - ${node.id}: ${node.name}`);
                if (node.dependencies.length > 0) {
                    console.log(`    depends on: [${node.dependencies.join(', ')}]`);
                }
            }
        }
        const cycles = this.detectCircularDeps();
        if (cycles.length > 0) {
            console.log('\n⚠️  Circular Dependencies:');
            for (const c of cycles) {
                console.log(`  ${c.path.join(' -> ')}`);
            }
        }
    }
}
//# sourceMappingURL=state-graph.js.map