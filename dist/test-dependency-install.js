// Test: Full installation order with user-m first
import { SystemStateGraph } from './core/state-graph.js';
import { DependencyGraph } from './core/dependency-graph.js';
import { getTemplate } from './templates/index.js';
async function testFullInstallOrder() {
    console.log('🔍 Testing Installation Order with /user-m\n');
    console.log('='.repeat(60));
    const stateGraph = new SystemStateGraph();
    const dependencyGraph = new DependencyGraph(stateGraph);
    // Install order: user-m → comment-m → like → follow → notification
    const installOrder = ['/user-m', '/comment-m', '/like', '/follow', '/notification'];
    console.log('Planned install order:', installOrder.join(' → '));
    console.log('');
    for (const cmd of installOrder) {
        const template = await getTemplate(cmd);
        if (!template) {
            console.log(`❌ Template not found: ${cmd}`);
            continue;
        }
        console.log(`\n📦 Installing ${cmd}...`);
        // Add to state graph
        stateGraph.addFeatureSchema(template);
        stateGraph.addFeatureApis(template);
        stateGraph.addFeature(template);
        // Analyze dependencies
        const analysis = dependencyGraph.analyzeFeature(template);
        if (analysis.missing_dependencies.length > 0) {
            console.log(`   ⚠️  Missing dependencies:`);
            for (const dep of analysis.missing_dependencies) {
                console.log(`      - [${dep.type}] ${dep.name}`);
            }
        }
        else {
            console.log(`   ✅ All dependencies satisfied`);
        }
        if (analysis.direct_dependencies.length > 0) {
            console.log(`   📎 Direct deps: ${analysis.direct_dependencies.join(', ')}`);
        }
    }
    // Final state check
    console.log('\n\n📊 Final State:');
    console.log('-'.repeat(40));
    console.log(`Tables: ${stateGraph.getAllTables().map(t => t.id).join(', ')}`);
    console.log(`APIs: ${stateGraph.getAllApis().length}`);
    console.log(`Features: ${stateGraph.getAllFeatures().map(f => f.id).join(', ')}`);
    // Check for conflicts
    const routeConflicts = stateGraph.findRouteConflicts();
    const cycles = stateGraph.detectCircularDeps();
    const sharedTables = stateGraph.getSharedTables();
    console.log('\n🔍 Conflict Check:');
    console.log(`  Route conflicts: ${routeConflicts.length}`);
    console.log(`  Circular deps: ${cycles.length}`);
    console.log(`  Shared tables: ${sharedTables.length}`);
    if (routeConflicts.length === 0 && cycles.length === 0) {
        console.log('\n✅ All systems go! No conflicts detected.');
    }
    // Generate installation plan
    console.log('\n\n📋 Generated Installation Plan:');
    const templates = await Promise.all(installOrder.map(cmd => getTemplate(cmd)));
    const validTemplates = templates.filter(t => t !== null);
    const plans = dependencyGraph.generateInstallPlan(validTemplates);
    for (const plan of plans) {
        console.log(`\n🔸 ${plan.feature_id} (${plan.order})`);
        if (plan.must_install_after.length > 0) {
            console.log(`   After: ${plan.must_install_after.join(', ')}`);
        }
        if (plan.must_install_before.length > 0) {
            console.log(`   Before: ${plan.must_install_before.join(', ')}`);
        }
        if (plan.side_effects.length > 0) {
            console.log(`   Side effects:`);
            for (const effect of plan.side_effects) {
                console.log(`     - ${effect.action} ${effect.target}: ${effect.description}`);
            }
        }
    }
}
testFullInstallOrder().catch(console.error);
//# sourceMappingURL=test-dependency-install.js.map