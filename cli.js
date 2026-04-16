#!/usr/bin/env node
// ============================================================================
// Modularity-skill CLI
// 命令行工具 - Feature Compiler AI
// ============================================================================

import { compileFeature } from './dist/index.js';
import { detectProject } from './dist/detector/project-detector.js';
import { FileWriter, generateFilePatches } from './dist/writer/file-writer.js';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const command = args[0];
const options = parseOptions(args.slice(1));

if (!command) {
  showHelp();
  process.exit(0);
}

async function main() {
  try {
    // 自动检测项目
    console.log('\n🔍 Detecting project structure...\n');
    const project = await detectProject();

    console.log(`   Type: ${project.type}`);
    console.log(`   Language: ${project.language}`);
    if (project.frontend) console.log(`   Frontend: ${project.frontend}`);
    console.log(`   Backend path: ${project.structure.backend_path || '.'}`);
    if (project.structure.frontend_path) {
      console.log(`   Frontend path: ${project.structure.frontend_path}`);
    }

    console.log(`\n🚀 Compiling feature: ${command}\n`);

    const result = await compileFeature(command, {
      verify: options.verify,
      language: project.language,
    });

    console.log('='.repeat(60));
    console.log(`Feature: ${result.feature_name}`);
    console.log(`Description: ${result.description}`);
    console.log('='.repeat(60));

    // 输出变更摘要
    console.log('\n📦 Backend Changes:');
    console.log('  New Files:', result.backend_changes.new_files.join(', '));
    console.log('  Modified:', result.backend_changes.modified_files.join(', '));
    console.log('  API Routes:', result.backend_changes.api_routes.map(r => `${r.method} ${r.path}`).join(', '));
    console.log('  DB Tables:', result.backend_changes.database_changes.map(d => d.table_name).join(', '));

    console.log('\n🖥️  Frontend Changes:');
    console.log('  New Components:', result.frontend_changes.new_components.map(c => c.name).join(', '));
    console.log('  State Changes:', result.frontend_changes.state_changes.length);

    console.log('\n📋 Integration Steps:');
    result.integration_steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

    console.log('\n⚠️  Risk Notes:');
    result.risk_notes.forEach(note => console.log(`  • ${note}`));

    // 如果有验证结果
    if (result.verification) {
      console.log('\n✅ Verification:');
      console.log(`  Success: ${result.verification.success}`);
      console.log(`  Duration: ${result.verification.duration_ms}ms`);
      if (result.verification.test_result) {
        console.log(`  Tests: ${result.verification.test_result.passed} passed, ${result.verification.test_result.failed} failed`);
      }
    }

    // 文件写入选项
    if (options.write) {
      console.log('\n📝 Writing files...\n');

      const backendPath = project.structure.backend_path || '.';
      const frontendPath = project.structure.frontend_path || '.';

      // 写入后端代码 - 直接根据模板信息写入
      if (result.code_patch.backend) {
        const backendFiles = await writeBackendCode(result.code_patch.backend, backendPath, options.dryRun, result.feature_name);
        console.log(`  Backend: ${backendFiles.length} files`);
        backendFiles.forEach(f => console.log(`    - ${f}`));
      }

      // 写入前端代码
      if (result.code_patch.frontend) {
        const frontendFiles = await writeFrontendCode(result.code_patch.frontend, frontendPath, options.dryRun, result.feature_name);
        console.log(`  Frontend: ${frontendFiles.length} files`);
        frontendFiles.forEach(f => console.log(`    - ${f}`));
      }

      // 写入数据库迁移
      if (result.code_patch.database) {
        const dbPath = path.join(backendPath, 'migrations');
        if (!options.dryRun) {
          await fs.promises.mkdir(dbPath, { recursive: true });
          await fs.promises.writeFile(path.join(dbPath, `${result.feature_name}_migration.sql`), result.code_patch.database);
        }
        console.log(`  Database: migrations/${result.feature_name}_migration.sql`);
      }

      if (options.dryRun) {
        console.log('\n💡 Dry run mode - no files were actually written.');
        console.log('   Use --force to write files.');
      } else {
        console.log('\n✅ All files written successfully!');
      }
    } else {
      console.log('\n📄 Code Patches:');
      console.log(`  Backend: ${result.code_patch.backend.length} chars`);
      console.log(`  Frontend: ${result.code_patch.frontend.length} chars`);
      console.log(`  Database: ${result.code_patch.database.length} chars`);

      console.log('\n💡 Use --write to write files to your project.');
      console.log('   Use --dry-run to preview changes first.\n');
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {
    verify: false,
    write: false,
    dryRun: true,
    verbose: false,
    language: 'python',
    frontend: 'react',
  };

  for (const arg of args) {
    if (arg === '--verify' || arg === '-v') {
      options.verify = true;
    } else if (arg === '--write' || arg === '-w') {
      options.write = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.dryRun = false;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--language=')) {
      options.language = arg.split('=')[1];
    } else if (arg.startsWith('--frontend=')) {
      options.frontend = arg.split('=')[1];
    }
  }

  return options;
}

// 辅助函数：写入后端代码（按 # File: 标记拆分）
async function writeBackendCode(code, basePath, dryRun, featureName) {
  const files = [];
  const lines = code.split('\n');
  let currentFile = null;
  let currentContent = [];

  for (const line of lines) {
    const fileMatch = line.match(/^# File:\s*(.+)$/);
    if (fileMatch) {
      // 保存上一个文件
      if (currentFile && currentContent.length > 0) {
        const filePath = path.join(basePath, currentFile);
        files.push(currentFile);
        if (!dryRun) {
          await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
          await fs.promises.writeFile(filePath, currentContent.join('\n'));
        }
      }
      currentFile = fileMatch[1].trim();
      currentContent = [];
    } else if (currentFile !== null) {
      currentContent.push(line);
    }
  }

  // 保存最后一个文件
  if (currentFile && currentContent.length > 0) {
    const filePath = path.join(basePath, currentFile);
    files.push(currentFile);
    if (!dryRun) {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, currentContent.join('\n'));
    }
  }

  return files;
}

// 辅助函数：写入前端代码（按 // File: 标记拆分）
async function writeFrontendCode(code, basePath, dryRun, featureName) {
  const files = [];
  const lines = code.split('\n');
  let currentFile = null;
  let currentContent = [];

  for (const line of lines) {
    const fileMatch = line.match(/^\/\/ File:\s*(.+)$/);
    if (fileMatch) {
      if (currentFile && currentContent.length > 0) {
        const filePath = path.join(basePath, currentFile);
        files.push(currentFile);
        if (!dryRun) {
          await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
          await fs.promises.writeFile(filePath, currentContent.join('\n'));
        }
      }
      currentFile = fileMatch[1].trim();
      currentContent = [];
    } else if (currentFile !== null) {
      currentContent.push(line);
    }
  }

  if (currentFile && currentContent.length > 0) {
    const filePath = path.join(basePath, currentFile);
    files.push(currentFile);
    if (!dryRun) {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, currentContent.join('\n'));
    }
  }

  return files;
}

function showHelp() {
  console.log(`
🎯 Modularity-skill - AI全栈模块编译器

Usage:
  npx modularity-skill <command> [options]

Commands:
  /comment-m      Multi-level comment system
  /like           Like/unlike functionality
  /follow         User follow system
  /notification   Notification system
  /user-m         User management system
  /post-m         Post/article system

Options:
  --verify        Run code verification (lint + tests)
  --write         Write files to project (default: dry-run)
  --dry-run       Preview changes without writing (default)
  --force         Actually write files (same as --write --no-dry-run)
  --verbose       Show detailed output
  --language=<py|ts>   Backend language (default: auto-detect)
  --frontend=<react|vue>  Frontend framework (default: auto-detect)

Examples:
  npx modularity-skill /comment-m
  npx modularity-skill /like --verify
  npx modularity-skill /follow --write
  npx modularity-skill /notification --verify --write --force

Project Auto-Detection:
  The CLI automatically detects your project type:
  - FastAPI + React (Python backend + React frontend)
  - Express + Vue (Node.js backend + Vue frontend)
  - Next.js (full-stack Next.js)
  - Nuxt (full-stack Nuxt)

Output:
  Returns complete JSON with backend, frontend, and database code patches.
  Use --write to automatically modify your project files.
`);
}

main();
