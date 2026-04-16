// ============================================================================
// Test All Templates - Verify Backend API & Database Generation
// ============================================================================

import { FeatureCompiler } from './core/compiler.js';
import { getAllTemplates } from './templates/index.js';

async function testAllTemplates() {
  console.log('🧪 Testing All Templates - Backend API & Database Generation\n');
  console.log('='.repeat(60));

  const compiler = new FeatureCompiler();
  const templates = getAllTemplates();

  for (const [command] of Object.entries(templates)) {
    console.log(`\n📦 Testing: ${command}\n`);

    try {
      const result = await compiler.compile(command);

      console.log(`✅ Feature: ${result.feature_name}`);
      console.log(`   Description: ${result.description}`);

      // Backend API
      console.log(`\n   🔧 Backend API:`);
      console.log(`      Routes (${result.backend_changes.api_routes.length}):`);
      for (const route of result.backend_changes.api_routes) {
        console.log(`         ${route.method.padEnd(6)} ${route.path} (${route.description})`);
      }
      console.log(`      Services: ${result.backend_changes.new_files.filter(f => f.includes('service')).length}`);
      console.log(`      Models: ${result.backend_changes.database_changes.length} tables`);

      // Database
      console.log(`\n   🗄️  Database:`);
      for (const dbChange of result.backend_changes.database_changes) {
        console.log(`         ${dbChange.type}: ${dbChange.table_name}`);
      }

      // Frontend
      console.log(`\n   🎨 Frontend:`);
      console.log(`      Components: ${result.frontend_changes.new_components.length}`);
      for (const comp of result.frontend_changes.new_components) {
        console.log(`         - ${comp.name}`);
      }
      console.log(`      API Calls: ${result.frontend_changes.api_calls.length}`);

      // Code patches
      console.log(`\n   📄 Code Patches:`);
      console.log(`      Backend: ${result.code_patch.backend.length} chars`);
      console.log(`      Frontend: ${result.code_patch.frontend.length} chars`);
      console.log(`      Database: ${result.code_patch.database.length} chars`);

      // Risk notes
      console.log(`\n   ⚠️  Risk Notes: ${result.risk_notes.length}`);
      for (const note of result.risk_notes) {
        console.log(`         - ${note}`);
      }

      console.log('\n' + '-'.repeat(60));

    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All templates tested\n');
}

testAllTemplates().catch(console.error);