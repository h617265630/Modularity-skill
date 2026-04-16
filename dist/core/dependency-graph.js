// ============================================================================
// Feature Dependency Graph - Feature Compiler AI
// 特征依赖图 - 分析和管理 feature 之间的依赖关系
// ============================================================================
// ============================================================================
// Feature Dependency Graph 主类
// ============================================================================
export class DependencyGraph {
    stateGraph;
    constructor(stateGraph) {
        this.stateGraph = stateGraph;
    }
    // ============================================================================
    // 核心分析方法
    // ============================================================================
    /**
     * 分析单个 feature 的依赖
     */
    analyzeFeature(template) {
        const direct_deps = this.findDirectDependencies(template);
        const transitive_deps = this.findTransitiveDependencies(direct_deps);
        const schema_deps = this.findSchemaDependencies(template);
        const api_deps = this.findApiDependencies(template);
        const missing_deps = this.findMissingDependencies(template, schema_deps, api_deps);
        const conflicts = this.findConflicts(template);
        const dependents = this.findDependents(template.command);
        return {
            feature_id: template.command,
            direct_dependencies: direct_deps,
            transitive_dependencies: transitive_deps,
            dependents,
            transitive_dependents: this.findTransitiveDependents(template.command),
            schema_dependencies: schema_deps,
            api_dependencies: api_deps,
            missing_dependencies: missing_deps,
            installation_order: this.suggestInstallationOrder(template.command, direct_deps),
            conflicts,
        };
    }
    /**
     * 批量分析多个 features
     */
    analyzeFeatures(templates) {
        return templates.map(t => this.analyzeFeature(t));
    }
    /**
     * 检查是否可以安全安装
     */
    canInstallSafely(template) {
        const analysis = this.analyzeFeature(template);
        const blocking_issues = [];
        const warnings = [];
        // 检查缺失依赖
        for (const missing of analysis.missing_dependencies) {
            if (missing.type === 'feature') {
                blocking_issues.push(`Missing feature dependency: ${missing.name}`);
            }
            else if (missing.type === 'schema') {
                blocking_issues.push(`Missing schema: ${missing.name} (required by ${missing.required_by})`);
            }
        }
        // 检查冲突
        for (const conflict of analysis.conflicts) {
            if (conflict.severity === 'error') {
                blocking_issues.push(`Conflict: ${conflict.description}`);
            }
            else {
                warnings.push(`Warning: ${conflict.description}`);
            }
        }
        // 检查循环依赖
        const cycles = this.stateGraph.detectCircularDeps();
        if (cycles.some(c => c.path.includes(template.command))) {
            blocking_issues.push('Circular dependency detected');
        }
        return {
            can_install: blocking_issues.length === 0,
            blocking_issues,
            warnings,
        };
    }
    /**
     * 生成安装计划
     */
    generateInstallPlan(templates) {
        const plans = [];
        // 先分析所有 features
        const analyses = templates.map(t => ({
            template: t,
            analysis: this.analyzeFeature(t),
        }));
        // 确定安装顺序
        const sorted = this.topologicalSortWithFeatures(templates);
        for (const template of sorted) {
            const analysis = this.analyzeFeature(template);
            const must_install_before = [];
            const must_install_after = [];
            const side_effects = [];
            // 找出必须在此之前安装的
            for (const dep of analysis.direct_dependencies) {
                must_install_after.push(dep);
            }
            // 找出依赖此 feature 的
            for (const dep of analysis.dependents) {
                must_install_before.push(dep);
            }
            // 生成副作用
            for (const table of template.database.tables) {
                const existing = this.stateGraph.getTable(table.name);
                side_effects.push({
                    target: 'schema',
                    action: existing ? 'extend' : 'create',
                    description: existing
                        ? `Extend table ${table.name} with ${table.fields.length} fields`
                        : `Create table ${table.name}`,
                });
            }
            for (const route of template.backend.routes) {
                const apiKey = `${route.method} ${route.path}`;
                const existing = this.stateGraph.getApiByPath(route.method, route.path);
                side_effects.push({
                    target: 'api',
                    action: existing ? 'extend' : 'create',
                    description: existing
                        ? `Extend API ${apiKey} (handler: ${route.handler_name})`
                        : `Create API ${apiKey}`,
                });
            }
            // 确定优先级
            let order = 'normal';
            if (analysis.direct_dependencies.length === 0 && analysis.dependents.length > 0) {
                order = 'first';
            }
            else if (analysis.dependents.length === 0 && analysis.direct_dependencies.length > 0) {
                order = 'last';
            }
            plans.push({
                feature_id: template.command,
                order,
                must_install_before,
                must_install_after,
                side_effects,
                warnings: analysis.conflicts.map(c => c.description),
            });
        }
        return plans;
    }
    // ============================================================================
    // 私有分析方法
    // ============================================================================
    /**
     * 查找直接依赖
     */
    findDirectDependencies(template) {
        const deps = [];
        // 检查 schema 依赖
        for (const table of template.database.tables) {
            for (const field of table.fields) {
                if (field.foreign_key) {
                    const [refTable] = field.foreign_key.split('.');
                    const tableNode = this.stateGraph.getTable(refTable);
                    if (tableNode) {
                        for (const featureId of tableNode.features) {
                            if (!deps.includes(featureId) && featureId !== template.command) {
                                deps.push(featureId);
                            }
                        }
                    }
                }
            }
        }
        // 检查 API 依赖
        for (const route of template.backend.routes) {
            if (route.auth_required) {
                // 需要认证 - 可能依赖 auth feature
                const authFeature = this.inferAuthFeature();
                if (authFeature && !deps.includes(authFeature)) {
                    deps.push(authFeature);
                }
            }
        }
        // 检查 service 依赖
        for (const service of template.backend.services) {
            const inferredDep = this.inferServiceDependency(service.name);
            if (inferredDep && !deps.includes(inferredDep)) {
                deps.push(inferredDep);
            }
        }
        return deps;
    }
    /**
     * 查找传递依赖
     */
    findTransitiveDependencies(directDeps) {
        const transitive = [];
        const visited = new Set();
        const traverse = (depId) => {
            if (visited.has(depId))
                return;
            visited.add(depId);
            const featureNode = this.stateGraph.getFeature(depId);
            if (featureNode) {
                for (const subDep of featureNode.dependencies) {
                    if (!transitive.includes(subDep)) {
                        transitive.push(subDep);
                    }
                    traverse(subDep);
                }
            }
        };
        for (const dep of directDeps) {
            traverse(dep);
        }
        return transitive;
    }
    /**
     * 查找依赖此 feature 的所有 features
     */
    findDependents(featureId) {
        const dependents = [];
        for (const node of this.stateGraph.getAllFeatures()) {
            if (node.dependencies.includes(featureId)) {
                dependents.push(node.id);
            }
        }
        return dependents;
    }
    /**
     * 查找传递依赖者
     */
    findTransitiveDependents(featureId) {
        const transitive = [];
        const visited = new Set();
        const traverse = (depId) => {
            if (visited.has(depId))
                return;
            visited.add(depId);
            const dependents = this.findDependents(depId);
            for (const dep of dependents) {
                if (!transitive.includes(dep)) {
                    transitive.push(dep);
                }
                traverse(dep);
            }
        };
        traverse(featureId);
        return transitive;
    }
    /**
     * 查找 Schema 依赖
     */
    findSchemaDependencies(template) {
        const deps = [];
        for (const table of template.database.tables) {
            for (const field of table.fields) {
                if (field.foreign_key) {
                    const [refTable, refColumn = 'id'] = field.foreign_key.split('.');
                    deps.push({
                        table: refTable,
                        columns: [refColumn],
                        required_by: `${table.name}.${field.name}`,
                    });
                }
            }
        }
        return deps;
    }
    /**
     * 查找 API 依赖
     */
    findApiDependencies(template) {
        const deps = [];
        // 查找是否有其他 feature 提供了类似的 API
        for (const route of template.backend.routes) {
            // 检查是否有相同路径的 API
            const existing = this.stateGraph.getApiByPath(route.method, route.path);
            if (existing) {
                for (const featureId of existing.features) {
                    if (featureId !== template.command) {
                        deps.push({
                            method: route.method,
                            path: route.path,
                            required_by: featureId,
                        });
                    }
                }
            }
        }
        return deps;
    }
    /**
     * 查找缺失的依赖
     */
    findMissingDependencies(template, schemaDeps, apiDeps) {
        const missing = [];
        // 检查 schema 依赖
        for (const dep of schemaDeps) {
            const tableNode = this.stateGraph.getTable(dep.table);
            if (!tableNode) {
                missing.push({
                    type: 'schema',
                    name: dep.table,
                    required_by: dep.required_by,
                    suggestion: `Install a feature that provides the "${dep.table}" table`,
                });
            }
        }
        // 检查 feature 依赖
        const directDeps = this.findDirectDependencies(template);
        for (const dep of directDeps) {
            const featureNode = this.stateGraph.getFeature(dep);
            if (!featureNode) {
                missing.push({
                    type: 'feature',
                    name: dep,
                    required_by: template.command,
                    suggestion: `Install "${dep}" before installing "${template.command}"`,
                });
            }
        }
        return missing;
    }
    /**
     * 查找冲突
     */
    findConflicts(template) {
        const conflicts = [];
        // 检查表冲突
        for (const table of template.database.tables) {
            const existing = this.stateGraph.getTable(table.name);
            if (existing) {
                // 检查字段类型冲突
                for (const field of table.fields) {
                    const existingField = existing.fields.find(f => f.name === field.name);
                    if (existingField && existingField.type !== field.type) {
                        conflicts.push({
                            type: 'field',
                            name: `${table.name}.${field.name}`,
                            features: [template.command, ...existing.features],
                            description: `Field type mismatch: ${existingField.type} vs ${field.type}`,
                            severity: 'error',
                        });
                    }
                }
                // 检查外键冲突
                for (const fk of existing.foreign_keys) {
                    const newFk = table.fields.find(f => f.name === fk.column)?.foreign_key;
                    if (!newFk) {
                        conflicts.push({
                            type: 'schema',
                            name: table.name,
                            features: existing.features,
                            description: `Table ${table.name} has foreign key ${fk.column} -> ${fk.reference_table} that may conflict`,
                            severity: 'warning',
                        });
                    }
                }
            }
        }
        // 检查 API 冲突
        const existingApis = this.stateGraph.getAllApis();
        for (const route of template.backend.routes) {
            const conflicting = existingApis.find(api => api.path === route.path &&
                api.method === route.method &&
                !api.features.includes(template.command));
            if (conflicting) {
                conflicts.push({
                    type: 'api',
                    name: `${route.method} ${route.path}`,
                    features: [template.command, ...conflicting.features],
                    description: `API route conflict with ${conflicting.handler_name}`,
                    severity: 'error',
                });
            }
        }
        return conflicts;
    }
    /**
     * 建议安装顺序
     */
    suggestInstallationOrder(featureId, directDependencies) {
        const order = [];
        const visited = new Set();
        const visit = (id) => {
            if (visited.has(id))
                return;
            visited.add(id);
            const featureNode = this.stateGraph.getFeature(id);
            if (featureNode) {
                for (const dep of featureNode.dependencies) {
                    visit(dep);
                }
            }
            order.push(id);
        };
        for (const dep of directDependencies) {
            visit(dep);
        }
        order.push(featureId);
        return order;
    }
    /**
     * 拓扑排序（考虑 features）
     */
    topologicalSortWithFeatures(templates) {
        const sorted = [];
        const visited = new Set();
        const inStack = new Set();
        const visit = (template) => {
            if (visited.has(template.command))
                return;
            if (inStack.has(template.command))
                return; // 循环依赖
            inStack.add(template.command);
            // 先访问依赖
            const deps = this.findDirectDependencies(template);
            for (const depId of deps) {
                const depTemplate = templates.find(t => t.command === depId);
                if (depTemplate) {
                    visit(depTemplate);
                }
            }
            inStack.delete(template.command);
            visited.add(template.command);
            sorted.push(template);
        };
        for (const template of templates) {
            visit(template);
        }
        return sorted;
    }
    // ============================================================================
    // 推断方法
    // ============================================================================
    /**
     * 推断认证 feature
     */
    inferAuthFeature() {
        // 检查是否已有 auth 相关的 feature
        for (const feature of this.stateGraph.getAllFeatures()) {
            if (feature.name.includes('auth') || feature.id.includes('auth')) {
                return feature.id;
            }
        }
        return null;
    }
    /**
     * 推断 service 依赖
     */
    inferServiceDependency(serviceName) {
        const servicePatterns = {
            'UserService': '/user',
            'NotificationService': '/notification',
            'PaymentService': '/payment',
            'AuthService': '/auth',
        };
        for (const [pattern, featureId] of Object.entries(servicePatterns)) {
            if (serviceName.includes(pattern)) {
                const exists = this.stateGraph.getFeature(featureId);
                if (exists)
                    return featureId;
            }
        }
        return null;
    }
    // ============================================================================
    // 导出和分析报告
    // ============================================================================
    /**
     * 生成完整的依赖报告
     */
    generateReport(templates) {
        const analyses = this.analyzeFeatures(templates);
        const plans = this.generateInstallPlan(templates);
        let report = '\n📋 Feature Dependency Report\n';
        report += '═'.repeat(60) + '\n\n';
        for (const analysis of analyses) {
            report += `🔹 ${analysis.feature_id}\n`;
            report += `   Direct deps: ${analysis.direct_dependencies.length > 0 ? analysis.direct_dependencies.join(', ') : 'none'}\n`;
            report += `   Transitive deps: ${analysis.transitive_dependencies.length > 0 ? analysis.transitive_dependencies.join(', ') : 'none'}\n`;
            report += `   Dependents: ${analysis.dependents.length > 0 ? analysis.dependents.join(', ') : 'none'}\n`;
            report += `   Schema deps: ${analysis.schema_dependencies.length}\n`;
            report += `   API deps: ${analysis.api_dependencies.length}\n`;
            if (analysis.missing_dependencies.length > 0) {
                report += `   ⚠️  Missing:\n`;
                for (const missing of analysis.missing_dependencies) {
                    report += `      - [${missing.type}] ${missing.name}\n`;
                }
            }
            if (analysis.conflicts.length > 0) {
                report += `   ❌ Conflicts:\n`;
                for (const conflict of analysis.conflicts) {
                    report += `      - ${conflict.description} (${conflict.severity})\n`;
                }
            }
            report += '\n';
        }
        report += '📦 Installation Plan\n';
        report += '═'.repeat(60) + '\n';
        for (const plan of plans) {
            report += `\n🔸 ${plan.feature_id} (${plan.order})\n`;
            if (plan.must_install_after.length > 0) {
                report += `   Install after: ${plan.must_install_after.join(', ')}\n`;
            }
            if (plan.must_install_before.length > 0) {
                report += `   Install before: ${plan.must_install_before.join(', ')}\n`;
            }
            if (plan.side_effects.length > 0) {
                report += `   Side effects:\n`;
                for (const effect of plan.side_effects) {
                    report += `      - ${effect.action} ${effect.target}: ${effect.description}\n`;
                }
            }
        }
        return report;
    }
}
//# sourceMappingURL=dependency-graph.js.map