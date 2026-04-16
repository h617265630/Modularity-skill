// ============================================================================
// Coupling Analysis - 检查模块耦合问题
// ============================================================================
import { SystemStateGraph } from './core/state-graph.js';
import { DependencyGraph } from './core/dependency-graph.js';
import { FeatureCompiler } from './core/compiler.js';
import { getTemplate } from './templates/index.js';
async function analyzeCoupling() {
    console.log('🔍 Coupling Analysis - 模块耦合问题检查\n');
    console.log('='.repeat(60));
    const stateGraph = new SystemStateGraph();
    const dependencyGraph = new DependencyGraph(stateGraph);
    const compiler = new FeatureCompiler();
    // ============================================================================
    // 1. 检查 comment-m 的依赖
    // ============================================================================
    console.log('\n📋 1. Comment-m 模块依赖分析\n');
    const commentTemplate = await getTemplate('/comment-m');
    const commentCompiled = await compiler.compile('/comment-m');
    if (commentTemplate) {
        // 添加到状态图
        stateGraph.addFeatureSchema(commentTemplate);
        stateGraph.addFeatureApis(commentTemplate);
        stateGraph.addFeature(commentTemplate);
        console.log('Schema 依赖:');
        for (const table of commentTemplate.database.tables) {
            for (const field of table.fields) {
                if (field.foreign_key) {
                    const [refTable] = field.foreign_key.split('.');
                    console.log(`  ⚠️  ${table.name}.${field.name} → ${field.foreign_key}`);
                    console.log(`     问题: 外键引用 '${refTable}' 表可能不存在`);
                }
            }
        }
        console.log('\nAPI 依赖:');
        for (const route of commentTemplate.backend.routes) {
            if (route.auth_required) {
                console.log(`  ⚠️  ${route.method} ${route.path} 需要认证`);
                console.log(`     问题: 需要 auth middleware 和 users 表`);
            }
        }
    }
    // ============================================================================
    // 2. 检查集成点问题
    // ============================================================================
    console.log('\n\n📋 2. 集成点问题分析\n');
    // 模拟多个 feature 安装
    console.log('模拟安装 /comment-m, /like, /follow:\n');
    // 添加 like
    const likeTemplate = await getTemplate('/like');
    if (likeTemplate) {
        stateGraph.addFeatureSchema(likeTemplate);
        stateGraph.addFeatureApis(likeTemplate);
        stateGraph.addFeature(likeTemplate);
    }
    // 添加 follow
    const followTemplate = await getTemplate('/follow');
    if (followTemplate) {
        stateGraph.addFeatureSchema(followTemplate);
        stateGraph.addFeatureApis(followTemplate);
        stateGraph.addFeature(followTemplate);
    }
    // 检查共享表
    const sharedTables = stateGraph.getSharedTables();
    console.log('共享表检查:');
    if (sharedTables.length === 0) {
        console.log('  ✅ 没有共享表 - 各模块表独立');
    }
    else {
        for (const st of sharedTables) {
            console.log(`  ⚠️  ${st.table.id} 被多个 feature 使用:`);
            console.log(`     ${st.features.join(', ')}`);
        }
    }
    // 检查路由冲突
    const routeConflicts = stateGraph.findRouteConflicts();
    console.log('\n路由冲突检查:');
    if (routeConflicts.length === 0) {
        console.log('  ✅ 没有路由冲突');
    }
    else {
        for (const c of routeConflicts) {
            console.log(`  ❌ ${c.api1.method} ${c.api1.path} vs ${c.api2.method} ${c.api2.path}`);
        }
    }
    // 检查循环依赖
    const cycles = stateGraph.detectCircularDeps();
    console.log('\n循环依赖检查:');
    if (cycles.length === 0) {
        console.log('  ✅ 没有循环依赖');
    }
    else {
        for (const c of cycles) {
            console.log(`  ❌ ${c.path.join(' → ')}`);
        }
    }
    // ============================================================================
    // 3. 前端集成问题
    // ============================================================================
    console.log('\n\n📋 3. 前端集成问题\n');
    console.log('API Contract 一致性:');
    for (const route of commentTemplate?.backend.routes || []) {
        const handlerName = route.handler_name;
        const hasCorrespondingApi = commentCompiled.backend_changes.api_routes.some(r => r.description.includes(handlerName));
        if (hasCorrespondingApi) {
            console.log(`  ✅ ${handlerName} 有对应 API`);
        }
        else {
            console.log(`  ⚠️  ${handlerName} 缺少对应 API`);
        }
    }
    // ============================================================================
    // 4. 完整依赖图分析
    // ============================================================================
    console.log('\n\n📋 4. 完整依赖图分析\n');
    if (commentTemplate) {
        const analysis = dependencyGraph.analyzeFeature(commentTemplate);
        console.log('Feature: /comment-m');
        console.log(`  直接依赖: ${analysis.direct_dependencies.join(', ') || 'none'}`);
        console.log(`  传递依赖: ${analysis.transitive_dependencies.join(', ') || 'none'}`);
        console.log(`  依赖此模块: ${analysis.dependents.join(', ') || 'none'}`);
        console.log(`  缺失依赖: ${analysis.missing_dependencies.length}`);
        if (analysis.missing_dependencies.length > 0) {
            console.log('  缺失依赖详情:');
            for (const dep of analysis.missing_dependencies) {
                console.log(`    - [${dep.type}] ${dep.name}`);
                console.log(`      需要: ${dep.suggestion}`);
            }
        }
        console.log('\n  冲突检测:');
        if (analysis.conflicts.length === 0) {
            console.log('    ✅ 无冲突');
        }
        else {
            for (const c of analysis.conflicts) {
                console.log(`    ⚠️  [${c.severity}] ${c.description}`);
            }
        }
        console.log('\n  风险评估:');
        for (const note of commentCompiled.risk_notes) {
            console.log(`    ⚠️  ${note}`);
        }
    }
    // ============================================================================
    // 5. 实际代码生成检查
    // ============================================================================
    console.log('\n\n📋 5. 代码生成完整性检查\n');
    console.log('Backend 代码检查:');
    console.log(`  Backend patch 长度: ${commentCompiled.code_patch.backend.length} chars`);
    // 检查关键代码是否存在
    const backendCode = commentCompiled.code_patch.backend;
    const checks = [
        { name: 'Router 定义', pattern: /router.*=.*APIRouter/ },
        { name: 'create_comment handler', pattern: /def.*create_comment/ },
        { name: 'get_comment handler', pattern: /def.*get_comment/ },
        { name: 'update_comment handler', pattern: /def.*update_comment/ },
        { name: 'delete_comment handler', pattern: /def.*delete_comment/ },
        { name: 'Comment CRUD', pattern: /comment_crud/ },
        { name: 'Comment Model', pattern: /class Comment/ },
        { name: 'get_db dependency', pattern: /get_db/ },
        { name: '认证依赖', pattern: /get_current_user/ },
    ];
    for (const check of checks) {
        const found = check.pattern.test(backendCode);
        console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    }
    console.log('\nDatabase 代码检查:');
    console.log(`  Database patch 长度: ${commentCompiled.code_patch.database.length} chars`);
    const dbCode = commentCompiled.code_patch.database;
    const dbChecks = [
        { name: 'CREATE TABLE', pattern: /CREATE TABLE/ },
        { name: 'comments 表定义', pattern: /comments/ },
        { name: 'id 主键', pattern: /PRIMARY KEY/ },
        { name: 'user_id 外键', pattern: /user_id.*REFERENCES/ },
        { name: 'parent_id 自引用', pattern: /parent_id.*REFERENCES.*comments/ },
        { name: '索引定义', pattern: /CREATE INDEX/ },
    ];
    for (const check of dbChecks) {
        const found = check.pattern.test(dbCode);
        console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    }
    // ============================================================================
    // 总结
    // ============================================================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 耦合问题总结\n');
    const issues = [];
    const recommendations = [];
    // 问题1: 缺少 users 表
    issues.push('❌ 所有模块依赖不存在的 users 表');
    recommendations.push('✅ 需要创建 /user-m 模块或确保 users 表存在');
    // 问题2: 认证中间件
    if (commentTemplate?.backend.routes.some(r => r.auth_required)) {
        recommendations.push('✅ 需要配置 JWT auth middleware');
    }
    // 问题3: API 路由冲突
    if (routeConflicts.length > 0) {
        issues.push(`❌ 发现 ${routeConflicts.length} 个路由冲突`);
    }
    // 问题4: 循环依赖
    if (cycles.length > 0) {
        issues.push(`❌ 发现 ${cycles.length} 个循环依赖`);
    }
    if (issues.length === 0) {
        console.log('✅ 未发现严重耦合问题\n');
    }
    else {
        console.log('发现以下问题:\n');
        for (const issue of issues) {
            console.log(`  ${issue}`);
        }
    }
    console.log('建议:\n');
    for (const rec of recommendations) {
        console.log(`  ${rec}`);
    }
    console.log('\n');
}
analyzeCoupling().catch(console.error);
//# sourceMappingURL=test-coupling.js.map