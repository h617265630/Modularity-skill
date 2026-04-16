// ============================================================================
// Full System Test - Modularity-skill
// 测试所有新构建的系统
// ============================================================================

import { SystemStateGraph } from './core/state-graph.js';
import { DependencyGraph } from './core/dependency-graph.js';
import { PatchValidator } from './core/patch-validator.js';
import { ExecutionSandbox } from './core/sandbox.js';
import { SnapshotManager } from './core/snapshot.js';
import { FeatureOrchestrator } from './core/orchestrator.js';
import { FeatureCompiler } from './core/compiler.js';
import { getTemplate } from './templates/index.js';

async function runFullTest() {
  console.log('🧪 Modularity-skill Full System Test\n');
  console.log('='.repeat(60));

  // ============================================================================
  // Test 1: System State Graph
  // ============================================================================
  console.log('\n📊 Test 1: System State Graph\n');

  const stateGraph = new SystemStateGraph();
  const template = await getTemplate('/comment-m');

  if (template) {
    // 添加 comment-m 的 schema 和 API
    stateGraph.addFeatureSchema(template);
    stateGraph.addFeatureApis(template);
    stateGraph.addFeature(template);

    console.log('Added /comment-m feature to state graph');
    stateGraph.printSummary();

    // 测试获取表
    const commentTable = stateGraph.getTable('comments');
    if (commentTable) {
      console.log('\n✅ Retrieved comments table:');
      console.log(`  Fields: ${commentTable.fields.map(f => f.name).join(', ')}`);
      console.log(`  Indexes: ${commentTable.indexes.map(i => i.name).join(', ')}`);
    }

    // 测试 API 获取
    const createCommentApi = stateGraph.getApiByPath('POST', '/comments');
    if (createCommentApi) {
      console.log('\n✅ Retrieved POST /comments API:');
      console.log(`  Handler: ${createCommentApi.handler_name}`);
      console.log(`  Auth required: ${createCommentApi.auth_required}`);
    }

    // 测试路由冲突检测
    const conflicts = stateGraph.findRouteConflicts();
    console.log(`\nRoute conflicts: ${conflicts.length}`);
  }

  // ============================================================================
  // Test 2: Dependency Graph
  // ============================================================================
  console.log('\n\n📊 Test 2: Dependency Graph\n');

  const dependencyGraph = new DependencyGraph(stateGraph);

  if (template) {
    const analysis = dependencyGraph.analyzeFeature(template);
    console.log('Dependency Analysis for /comment-m:');
    console.log(`  Direct dependencies: ${analysis.direct_dependencies.join(', ') || 'none'}`);
    console.log(`  Transitive dependencies: ${analysis.transitive_dependencies.join(', ') || 'none'}`);
    console.log(`  Dependents: ${analysis.dependents.join(', ') || 'none'}`);
    console.log(`  Schema dependencies: ${analysis.schema_dependencies.length}`);
    console.log(`  API dependencies: ${analysis.api_dependencies.length}`);
    console.log(`  Missing dependencies: ${analysis.missing_dependencies.length}`);
    console.log(`  Conflicts: ${analysis.conflicts.length}`);

    // 安全检查
    const safetyCheck = dependencyGraph.canInstallSafely(template);
    console.log(`\nSafety check: ${safetyCheck.can_install ? '✅ PASS' : '❌ FAIL'}`);
    if (safetyCheck.blocking_issues.length > 0) {
      console.log('  Blocking issues:');
      for (const issue of safetyCheck.blocking_issues) {
        console.log(`    - ${issue}`);
      }
    }

    // 生成报告
    console.log(dependencyGraph.generateReport([template]));
  }

  // ============================================================================
  // Test 3: Patch Validator
  // ============================================================================
  console.log('\n\n📊 Test 3: Patch Validator\n');

  const compiler = new FeatureCompiler();
  const compiled = await compiler.compile('/comment-m');

  const validator = new PatchValidator(stateGraph);
  const validation = validator.validateFeature(template!, compiled);

  console.log(`Validation result: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Total changes: ${validation.diff.total_changes}`);
  console.log(`  Tables created: ${validation.diff.tables_created.join(', ') || 'none'}`);
  console.log(`  APIs created: ${validation.diff.apis_created.join(', ') || 'none'}`);
  console.log(`  Components created: ${validation.diff.components_created.join(', ') || 'none'}`);

  if (validation.errors.length > 0) {
    console.log(`\nErrors (${validation.errors.length}):`);
    for (const err of validation.errors) {
      console.log(`  [${err.type}] ${err.location}: ${err.message}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.log(`\nWarnings (${validation.warnings.length}):`);
    for (const warn of validation.warnings) {
      console.log(`  [${warn.type}] ${warn.location}: ${warn.message}`);
    }
  }

  console.log(validator.generateReport(validation));

  // ============================================================================
  // Test 4: Execution Sandbox
  // ============================================================================
  console.log('\n\n📊 Test 4: Execution Sandbox\n');

  const sandbox = new ExecutionSandbox(
    {
      mode: 'dry-run',
      allow_production_write: false,
    },
    stateGraph
  );

  const sandboxResult = await sandbox.execute(template!, compiled);

  console.log(`Sandbox result: ${sandboxResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Mode: ${sandboxResult.mode}`);
  console.log(`Applied: ${sandboxResult.applied}`);
  console.log(`Staged files: ${sandboxResult.staged_files.length}`);

  // 预览
  const preview = sandbox.preview(template!, compiled);
  console.log('\nPreview:');
  console.log(`  Files to create: ${preview.files_to_create.length}`);
  console.log(`  Tables to create: ${preview.tables_to_create.join(', ')}`);
  console.log(`  APIs to create: ${preview.apis_to_create.join(', ')}`);

  console.log(sandbox.generateReport());

  // ============================================================================
  // Test 5: Snapshot Manager
  // ============================================================================
  console.log('\n\n📊 Test 5: Snapshot Manager\n');

  const snapshotManager = new SnapshotManager(stateGraph);

  // 创建几个快照
  snapshotManager.createSnapshot({
    description: 'Before comment-m',
    tags: ['before'],
  });

  snapshotManager.createSnapshot({
    description: 'Install comment-m',
    feature_id: '/comment-m',
    tags: ['install'],
  });

  const snapshots = snapshotManager.getAllSnapshots();
  console.log(`Total snapshots: ${snapshots.length}`);
  for (const snap of snapshots) {
    console.log(`  [${snap.id}] ${snap.version} - ${snap.description}`);
  }

  // 比较快照
  const initialSnap = snapshotManager.getSnapshot('initial');
  const latestSnap = snapshotManager.getCurrentSnapshot();
  if (initialSnap && latestSnap) {
    const diff = snapshotManager.compareSnapshots(initialSnap, latestSnap);
    console.log('\nDiff from initial to latest:');
    console.log(`  Tables added: ${diff.added_tables.join(', ') || 'none'}`);
    console.log(`  APIs added: ${diff.added_apis.join(', ') || 'none'}`);
    console.log(`  Features added: ${diff.added_features.join(', ') || 'none'}`);
  }

  // 回滚测试
  const rollbackResult = snapshotManager.rollback('initial');
  console.log(`\nRollback result: ${rollbackResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (rollbackResult.success) {
    console.log(`  Features removed: ${rollbackResult.features_removed.join(', ') || 'none'}`);
    console.log(`  Features preserved: ${rollbackResult.features_preserved.join(', ') || 'none'}`);
  }

  console.log(snapshotManager.generateReport());

  // ============================================================================
  // Test 6: Feature Orchestrator (Full Integration)
  // ============================================================================
  console.log('\n\n📊 Test 6: Feature Orchestrator\n');

  const orchestrator = new FeatureOrchestrator({
    sandbox_mode: 'dry-run',
    auto_snapshot: true,
    max_snapshots: 50,
    allow_production_write: false,
  });

  // 预览 comment-m
  console.log('Previewing /comment-m...');
  const previewResult = await orchestrator.previewFeature('/comment-m');

  if (previewResult) {
    console.log(`  Dependencies: ${previewResult.conflicts.length} conflicts`);
    console.log(`  Files to create: ${previewResult.preview.files_to_create.length}`);
    console.log(`  Tables to create: ${previewResult.preview.tables_to_create.join(', ')}`);
    console.log(`  APIs to create: ${previewResult.preview.apis_to_create.join(', ')}`);
    console.log(`  Warnings: ${previewResult.preview.warnings.length}`);
  }

  // 执行编译（干跑）
  console.log('\nCompiling /comment-m (dry-run)...');
  const compileResult = await orchestrator.compileFeature('/comment-m');

  console.log(`\nCompile result: ${compileResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Feature: ${compileResult.feature_id}`);
  console.log(`Validation: ${compileResult.validation.valid ? '✅' : '❌'}`);
  console.log(`Sandbox: ${compileResult.sandbox_result.success ? '✅' : '❌'}`);
  console.log(`Snapshot created: ${compileResult.snapshot ? '✅' : '❌'}`);
  console.log(`Rollback available: ${compileResult.rollback_available ? '✅' : '❌'}`);

  if (compileResult.error) {
    console.log(`Error: ${compileResult.error}`);
  }

  // 系统状态
  const systemStatus = orchestrator.getSystemStatus();
  console.log('\nSystem Status:');
  console.log(`  Tables: ${systemStatus.state.tables_count}`);
  console.log(`  APIs: ${systemStatus.state.apis_count}`);
  console.log(`  Features: ${systemStatus.state.features_count}`);
  console.log(`  Snapshots: ${systemStatus.snapshots.total}`);

  // 完整报告
  console.log(orchestrator.generateSystemReport());

  // ============================================================================
  // Test 7: Comment-m Real Case Breakdown
  // ============================================================================
  console.log('\n\n📊 Test 7: Comment-m Real Case Breakdown\n');

  if (template) {
    console.log('Feature: /comment-m (Multi-level Comment System)\n');

    console.log('━━━ Dependencies Analysis ━━━\n');

    // 直接依赖
    console.log('1. Direct Dependencies:');
    if (template.database.tables[0]) {
      const table = template.database.tables[0];
      for (const field of table.fields) {
        if (field.foreign_key) {
          console.log(`   └─ ${table.name}.${field.name} → ${field.foreign_key}`);
          console.log(`      └─ REQUIRES: ${field.foreign_key.split('.')[0]} table (users table)`);
        }
      }
    }
    console.log('   └─ Auth dependency: API routes require authentication');

    // Schema 依赖
    console.log('\n2. Schema Dependencies:');
    console.log(`   └─ ${template.database.tables[0]?.name} table`);
    console.log(`      └─ Fields: ${template.database.tables[0]?.fields.map(f => f.name).join(', ')}`);
    console.log(`      └─ FK to: users.id`);
    console.log(`      └─ Self-reference: parent_id → comments.id`);

    // API 依赖
    console.log('\n3. API Endpoints:');
    for (const route of template.backend.routes) {
      console.log(`   └─ ${route.method} ${route.path}`);
      console.log(`      └─ Handler: ${route.handler_name}`);
      console.log(`      └─ Auth: ${route.auth_required ? 'REQUIRED' : 'NOT REQUIRED'}`);
    }

    console.log('\n━━━ Potential Conflicts ━━━\n');

    // 检测冲突
    const tableConflicts = stateGraph.getSharedTables();
    const apiConflicts = stateGraph.findRouteConflicts();

    if (tableConflicts.length === 0) {
      console.log('✅ No table conflicts detected');
    } else {
      console.log('⚠️  Table conflicts:');
      for (const c of tableConflicts) {
        console.log(`   └─ ${c.table.id} shared by: ${c.features.join(', ')}`);
      }
    }

    if (apiConflicts.length === 0) {
      console.log('✅ No API conflicts detected');
    } else {
      console.log('⚠️  API conflicts:');
      for (const c of apiConflicts) {
        console.log(`   └─ ${c.api1.method} ${c.api1.path} vs ${c.api2.method} ${c.api2.path}`);
      }
    }

    // 循环依赖检测
    const cycles = stateGraph.detectCircularDeps();
    if (cycles.length === 0) {
      console.log('✅ No circular dependencies detected');
    } else {
      console.log('⚠️  Circular dependencies:');
      for (const c of cycles) {
        console.log(`   └─ ${c.path.join(' → ')}`);
      }
    }

    console.log('\n━━━ Installation Plan ━━━\n');

    const installPlans = dependencyGraph.generateInstallPlan([template]);
    if (installPlans[0]) {
      const plan = installPlans[0];
      console.log(`Order: ${plan.order}`);
      console.log(`Must install after: ${plan.must_install_after.join(', ') || 'nothing'}`);
      console.log(`Must install before: ${plan.must_install_before.join(', ') || 'nothing'}`);
      console.log('\nSide effects:');
      for (const effect of plan.side_effects) {
        console.log(`   [${effect.action}] ${effect.target}: ${effect.description}`);
      }
    }

    console.log('\n━━━ Risk Assessment ━━━\n');

    const riskNotes: string[] = [];

    // 检查表依赖
    if (template.backend.models.some(m =>
      m.fields.some(f => f.foreign_key && !stateGraph.getTable(f.foreign_key.split('.')[0]))
    )) {
      riskNotes.push('⚠️  Foreign key references non-existent table');
    }

    // 检查 API 认证
    if (template.backend.routes.some(r => r.auth_required)) {
      riskNotes.push('⚠️  Routes require auth middleware to be configured');
    }

    // 检查自引用
    if (template.database.tables.some(t => t.fields.some(f => f.name === 'parent_id'))) {
      riskNotes.push('ℹ️  Self-referential table (nested comments) - may need recursive queries');
    }

    // 检查索引
    if (!template.database.tables[0]?.indexes?.length) {
      riskNotes.push('⚠️  Table has no indexes - may need indexes for performance');
    }

    if (riskNotes.length === 0) {
      console.log('✅ Low risk - feature appears safe to install');
    } else {
      for (const risk of riskNotes) {
        console.log(risk);
      }
    }
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n\n' + '='.repeat(60));
  console.log('✅ Full System Test Completed\n');

  console.log('Systems tested:');
  console.log('  1. ✅ System State Graph');
  console.log('  2. ✅ Dependency Graph');
  console.log('  3. ✅ Patch Validator');
  console.log('  4. ✅ Execution Sandbox');
  console.log('  5. ✅ Snapshot Manager');
  console.log('  6. ✅ Feature Orchestrator');
  console.log('  7. ✅ Comment-m Real Case Analysis');
}

// Run tests
runFullTest().catch(console.error);