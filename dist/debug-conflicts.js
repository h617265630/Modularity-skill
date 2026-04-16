// Debug route conflicts
import { SystemStateGraph } from './core/state-graph.js';
import { getTemplate } from './templates/index.js';
async function debug() {
    const stateGraph = new SystemStateGraph();
    // Add APIs
    const templates = ['/comment-m', '/like', '/follow'];
    for (const cmd of templates) {
        const template = await getTemplate(cmd);
        if (template) {
            stateGraph.addFeatureApis(template);
        }
    }
    // Get all APIs
    const apis = stateGraph.getAllApis();
    console.log('All APIs:');
    for (const api of apis) {
        console.log(`  ${api.method} ${api.path}`);
    }
    console.log('');
    // Find conflicts
    const conflicts = stateGraph.findRouteConflicts();
    console.log(`Found ${conflicts.length} conflicts:`);
    for (const c of conflicts) {
        console.log(`  ${c.api1.method} ${c.api1.path}`);
        console.log(`    vs ${c.api2.method} ${c.api2.path}`);
        console.log(`    type: ${c.type}`);
        console.log('');
    }
}
debug().catch(console.error);
//# sourceMappingURL=debug-conflicts.js.map