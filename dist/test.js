// ============================================================================
// 测试文件 - Modularity-skill
// ============================================================================
import { FeatureCompiler } from './core/compiler.js';
import { getSupportedCommands } from './templates/index.js';
async function runTests() {
    console.log('🧪 Running Modularity-skill tests...\n');
    // Test 1: List supported commands
    console.log('Test 1: Get supported commands');
    const commands = getSupportedCommands();
    console.log(`  ✅ Supported commands: ${commands.join(', ')}\n`);
    // Test 2: Compile comment-m feature
    console.log('Test 2: Compile /comment-m feature');
    const compiler = new FeatureCompiler();
    try {
        const result = await compiler.compile('/comment-m');
        console.log(`  ✅ Feature name: ${result.feature_name}`);
        console.log(`  ✅ Description: ${result.description}`);
        console.log(`  ✅ Backend files: ${result.backend_changes.new_files.join(', ')}`);
        console.log(`  ✅ API routes: ${result.backend_changes.api_routes.map(r => `${r.method} ${r.path}`).join(', ')}`);
        console.log(`  ✅ Frontend components: ${result.frontend_changes.new_components.map(c => c.name).join(', ')}`);
        console.log(`  ✅ Database tables: ${result.backend_changes.database_changes.map(d => d.table_name).join(', ')}`);
        console.log(`  ✅ Risk notes: ${result.risk_notes.length} items`);
        console.log(`  ✅ Integration steps: ${result.integration_steps.length} steps\n`);
        // Show code patch preview
        console.log('  📄 Code patch preview:');
        console.log('  Backend patch length:', result.code_patch.backend.length, 'chars');
        console.log('  Frontend patch length:', result.code_patch.frontend.length, 'chars');
        console.log('  Database patch length:', result.code_patch.database.length, 'chars');
    }
    catch (error) {
        console.log('  ❌ Error:', error.message);
    }
    console.log('\n✅ All tests completed!');
}
// Run tests
runTests().catch(console.error);
//# sourceMappingURL=test.js.map