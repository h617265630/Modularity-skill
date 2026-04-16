#!/usr/bin/env node
// ============================================================================
// Modularity-skill CLI
// 命令行工具 - AI全栈模块编译器
// ============================================================================

import { compileWithFrontendAwareness } from './dist/index.js';
import { detectProject } from './dist/detector/project-detector.js';
import { FileWriter, generateFilePatches } from './dist/writer/file-writer.js';
import { scaffoldProject } from './dist/scaffolding/index.js';
import { ensureShadcnComponents } from './dist/scaffolding/shadcn.js';
import { generateModuleUI, prepareUIContext } from './dist/scaffolding/ui-generator.js';
import { runProject } from './dist/scaffolding/project-runner.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const args = process.argv.slice(2);
const command = args[0];
const options = parseOptions(args.slice(1));

if (!command) {
  showHelp();
  process.exit(0);
}

async function main() {
  try {
    // 处理 init 命令
    if (command === 'init') {
      await handleInit();
      return;
    }

    // 处理 attach-um 命令（检测并接入已有前端代码）
    if (command === '/attach-um') {
      await handleAttachUM();
      return;
    }

    // 处理模块安装命令（如 /comment-m, /user-m）
    if (command.startsWith('/')) {
      await handleModuleInstall(command);
      return;
    }

    // 未知命令
    showHelp();
    process.exit(1);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 处理 init 命令 - 创建新项目
 */
async function handleInit() {
  const projectName = options.projectName || 'myapp';
  const projectPath = options.target || process.cwd();

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  🏗️  Creating New Project                     ║
╠══════════════════════════════════════════════════════════════╣
║  Project Name: ${projectName.padEnd(43)}║
║  Target Path:  ${projectPath.padEnd(43)}║
╚══════════════════════════════════════════════════════════════╝
  `);

  await scaffoldProject({
    projectName,
    projectPath,
    frontend: 'nextjs',
    backend: 'fastapi',
    database: 'postgresql',
    uiLibrary: 'shadcn',
  });

  // 创建 README
  const readme = `# ${projectName}

A modern full-stack application built with:
- **Frontend**: Next.js 14 + shadcn/ui + TypeScript
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Auth**: JWT Authentication

## Quick Start

\`\`\`bash
# Start PostgreSQL
docker-compose up -d

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development servers
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn app.main:app --reload
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── frontend/          # Next.js frontend
│   └── src/
│       ├── app/       # Pages and layouts
│       ├── components/ # UI components
│       ├── hooks/      # React hooks
│       └── services/  # API services
├── backend/           # FastAPI backend
│   └── app/
│       ├── api/       # API routes
│       ├── models/    # Database models
│       ├── schemas/   # Pydantic schemas
│       └── cruds/     # CRUD operations
└── docker-compose.yml # Docker services
\`\`\`

## Adding Modules

Add features using modularity-skill:

\`\`\`bash
npx modularity-skill /comment-m --write
\`\`\`
`;

  await fs.promises.writeFile(
    path.join(projectPath, 'README.md'),
    readme
  );

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  ✅ Project Created Successfully!             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Next steps:                                                 ║
║                                                              ║
║    1. cd ${projectName.padEnd(47)}║
║    2. docker-compose up -d    (start PostgreSQL)              ║
║    3. cd frontend && npm install                             ║
║    4. cd backend && pip install -r requirements.txt           ║
║    5. alembic upgrade head    (run migrations)               ║
║    6. npm run dev    (start frontend on :3000)               ║
║    7. uvicorn app.main:app --reload  (start backend :8000)  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

/**
 * 处理 /attach-um 命令 - 检测并接入已有前端代码
 */
async function handleAttachUM() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🔍 Attaching Unconnected Modules                  ║
╠══════════════════════════════════════════════════════════════╣
║  Scanning frontend code to find modules without backend...  ║
╚══════════════════════════════════════════════════════════════╝
  `);

  // 自动检测项目
  console.log('🔍 Detecting project structure...\n');
  const project = await detectProject();

  console.log(`   Type: ${project.type}`);
  console.log(`   Language: ${project.language}`);
  if (project.frontend) console.log(`   Frontend: ${project.frontend}`);
  console.log(`   Backend path: ${project.structure.backend_path || '.'}`);
  if (project.structure.frontend_path) {
    console.log(`   Frontend path: ${project.structure.frontend_path}`);
  }

  // 确定项目路径
  const projectPath = project.structure.backend_path || project.structure.frontend_path || '.';

  // 检查是否是新项目
  const isNewProject = isEmptyDirectory(project.structure.backend_path || '.');

  if (isNewProject) {
    console.log('\n⚠️  No project detected.');
    console.log('   Run "npx modularity-skill init" first to create a new project.\n');
    return;
  }

  // 构建前端分析选项
  const frontendAnalysis = {};
  if (options.hooksDir) {
    frontendAnalysis.hooks_dir = options.hooksDir;
    console.log(`   📂 Custom hooks dir: ${options.hooksDir}`);
  }
  if (options.componentsDir) {
    frontendAnalysis.components_dir = options.componentsDir;
    console.log(`   📂 Custom components dir: ${options.componentsDir}`);
  }
  if (options.apiDir) {
    frontendAnalysis.api_services_dir = options.apiDir;
    console.log(`   📂 Custom API dir: ${options.apiDir}`);
  }

  // 扫描项目
  const scanner = new (await import('./dist/core/compiler.js')).ProjectScanner || (await import('./dist/index.js')).FeatureCompiler;
  const { ProjectScanner } = await import('./dist/index.js');
  const scannerInstance = new ProjectScanner();
  const projectStructure = scannerInstance.scan(projectPath);

  if (!projectStructure.frontend) {
    console.log('\n⚠️  No frontend structure detected.');
    console.log('   /attach-um requires a frontend project.\n');
    return;
  }

  // 导入前端分析器
  const { FrontendAnalyzer } = await import('./dist/detector/frontend-analyzer.js');

  // 支持的模块列表
  const supportedModules = [
    { name: 'comment', patterns: ['comment', 'Comment'] },
    { name: 'like', patterns: ['like', 'Like'] },
    { name: 'follow', patterns: ['follow', 'Follow'] },
    { name: 'post', patterns: ['post', 'Post'] },
    { name: 'notification', patterns: ['notification', 'Notification'] },
    { name: 'user', patterns: ['user', 'User'] },
    { name: 'message', patterns: ['message', 'Message'] },
    { name: 'search', patterns: ['search', 'Search'] },
  ];

  // 扫描所有模块
  const analyzerOptions = Object.keys(frontendAnalysis).length > 0 ? frontendAnalysis : undefined;
  const analyzer = new FrontendAnalyzer(projectStructure.frontend, analyzerOptions);

  const detectedModules = [];

  console.log('\n🔍 Scanning for frontend code...\n');

  for (const mod of supportedModules) {
    const detected = await analyzer.analyzeFeature(mod.name);
    if (detected && (detected.hooks.length > 0 || detected.components.length > 0)) {
      detectedModules.push({
        moduleName: mod.name,
        detected,
      });
      console.log(`   📦 Found ${mod.name}: ${detected.hooks.length} hooks, ${detected.components.length} components`);
    }
  }

  if (detectedModules.length === 0) {
    console.log('\n⚠️  No module frontend code detected.');
    console.log('   Make sure you have hooks or components for supported modules.\n');
    return;
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   📋 Detected Modules                        ║
╠══════════════════════════════════════════════════════════════╣`);

  for (const { moduleName, detected } of detectedModules) {
    console.log(`║  ${moduleName.padEnd(15)} - ${detected.hooks.length} hooks, ${detected.components.length} components`.padEnd(64) + '║');
  }
  console.log(`╚══════════════════════════════════════════════════════════════╝`);

  // 为每个模块生成后端
  console.log('\n🚀 Generating backend code for detected modules...\n');

  for (const { moduleName, detected } of detectedModules) {
    const moduleCommand = `/${moduleName}-m`;
    console.log(`\n   Processing ${moduleCommand}...`);

    // 导入编译功能
    const { compileWithFrontendAwareness } = await import('./dist/index.js');

    try {
      const result = await compileWithFrontendAwareness(moduleCommand, {
        verify: false,
        language: project.language,
        projectPath,
        frontendAnalysis: analyzerOptions,
      });

      console.log(`   ✅ ${moduleName}: ${result.backend_changes.api_routes.length} API routes`);

      // 显示检测到的代码位置
      if (detected.hooks.length > 0) {
        for (const hook of detected.hooks) {
          console.log(`      - ${hook.name}: ...${hook.file_path.slice(-40)}`);
        }
      }

      // 如果有 adapter 代码
      if (result.code_patch.adapter) {
        console.log(`   🔄 Adapter generated for API compatibility`);
      }

      // 写入文件
      if (options.write) {
        console.log(`   📝 Writing files...`);
        await writeModuleCode(result, projectPath, moduleName);
      }

    } catch (error) {
      console.log(`   ⚠️  ${moduleName}: ${error.message}`);
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  ✅ Scan Complete!                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Next steps:                                                 ║
║    1. Review the generated backend code                      ║
║    2. Use --write to actually write files                    ║
║    3. Run /attach-um --write to write all at once           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

/**
 * 处理模块安装命令
 */
async function handleModuleInstall(moduleCommand) {
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

  // 检查是否是新项目（没有任何文件）
  const isNewProject = isEmptyDirectory(project.structure.backend_path || '.');

  if (isNewProject) {
    console.log('\n⚠️  No project detected.');
    console.log('   Run "npx modularity-skill init" first to create a new project.\n');
    return;
  }

  console.log(`\n🚀 Installing module: ${moduleCommand}\n`);

  // 确定项目路径
  const projectPath = project.structure.backend_path || project.structure.frontend_path || '.';

  // 构建前端分析选项
  const frontendAnalysis = {};
  if (options.hooksDir) {
    frontendAnalysis.hooks_dir = options.hooksDir;
    console.log(`   📂 Custom hooks dir: ${options.hooksDir}`);
  }
  if (options.componentsDir) {
    frontendAnalysis.components_dir = options.componentsDir;
    console.log(`   📂 Custom components dir: ${options.componentsDir}`);
  }
  if (options.apiDir) {
    frontendAnalysis.api_services_dir = options.apiDir;
    console.log(`   📂 Custom API dir: ${options.apiDir}`);
  }

  const result = await compileWithFrontendAwareness(moduleCommand, {
    verify: options.verify,
    language: project.language,
    projectPath,
    frontendAnalysis: Object.keys(frontendAnalysis).length > 0 ? frontendAnalysis : undefined,
  });

  console.log('='.repeat(60));
  console.log(`Feature: ${result.feature_name}`);
  console.log(`Description: ${result.description}`);
  console.log('='.repeat(60));

  // 输出变更摘要
  console.log('\n📦 Backend Changes:');
  console.log('  New Files:', result.backend_changes.new_files.join(', ') || 'None');
  console.log('  Modified:', result.backend_changes.modified_files.join(', ') || 'None');
  console.log('  API Routes:', result.backend_changes.api_routes.map(r => `${r.method} ${r.path}`).join(', ') || 'None');
  console.log('  DB Tables:', result.backend_changes.database_changes.map(d => d.table_name).join(', ') || 'None');

  console.log('\n🖥️  Frontend Changes:');
  console.log('  New Components:', result.frontend_changes.new_components.map(c => c.name).join(', ') || 'None');
  console.log('  State Changes:', result.frontend_changes.state_changes.length || 0);

  console.log('\n📋 Integration Steps:');
  result.integration_steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

  if (result.risk_notes.length > 0) {
    console.log('\n⚠️  Risk Notes:');
    result.risk_notes.forEach(note => console.log(`  • ${note}`));
  }

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

    // 写入后端代码
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

      // 安装 shadcn/ui 组件
      if (frontendPath && frontendPath !== '.') {
        console.log('\n🎨 Checking shadcn/ui components...');
        await ensureShadcnComponents(frontendPath, moduleCommand);
      }

      // 生成增强 UI
      if (frontendPath && frontendPath !== '.' && result.frontend_changes.new_components.length > 0) {
        console.log('\n🎨 Generating enhanced UI...');
        try {
          const uiContext = prepareUIContext({
            feature_name: result.feature_name,
            description: result.description,
            backend: { models: [], routes: [], services: [] },
            frontend: {
              components: result.frontend_changes.new_components,
              hooks: [],
              pages: [],
              state_changes: [],
            },
          });
          await generateModuleUI(uiContext);
        } catch (e) {
          console.warn('   ⚠️  UI generation skipped:', e.message);
        }
      }

      // 如果有 run 选项，启动服务
      if (options.run) {
        await handleRun(project.structure.backend_path || '.');
      }
    }
  } else {
    console.log('\n📄 Code Patches:');
    console.log(`  Backend: ${result.code_patch.backend.length} chars`);
    console.log(`  Frontend: ${result.code_patch.frontend.length} chars`);
    console.log(`  Database: ${result.code_patch.database.length} chars`);

    console.log('\n💡 Use --write to write files to your project.');
    console.log('   Use --dry-run to preview changes first.\n');
  }
}

/**
 * 检查目录是否为空
 */
function isEmptyDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.length === 0;
  } catch {
    return true;
  }
}

/**
 * 处理 --run 选项
 */
async function handleRun(projectPath) {
  console.log('\n🚀 Starting services...\n');

  try {
    const result = await runProject({
      projectPath,
      skipInstall: false,
    });

    if (result.success) {
      console.log('\n✅ Services started successfully!');
      console.log('   Started:', result.startedServices.join(', '));
    } else {
      console.log('\n⚠️  Some services failed to start:');
      result.errors.forEach(e => console.log('   -', e));
    }
  } catch (error) {
    console.warn('   ⚠️  Could not start services:', error.message);
    console.warn('   You may need to start them manually.');
  }

  console.log('\n📍 Service URLs:');
  console.log('   Frontend: http://localhost:3000');
  console.log('   Backend:  http://localhost:8000');
  console.log('   API Docs: http://localhost:8000/docs\n');
}

/**
 * 解析命令行选项
 */
function parseOptions(args) {
  const options = {
    verify: false,
    write: false,
    dryRun: true,
    verbose: false,
    language: 'python',
    frontend: 'react',
    run: false,
    target: process.cwd(),
    projectName: 'myapp',
    hooksDir: null,
    componentsDir: null,
    apiDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--verify' || arg === '-v') {
      options.verify = true;
    } else if (arg === '--write' || arg === '-w') {
      options.write = true;
      options.dryRun = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.dryRun = false;
    } else if (arg === '--run' || arg === '-r') {
      options.run = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--target=')) {
      options.target = arg.split('=')[1];
    } else if (arg.startsWith('--project-name=')) {
      options.projectName = arg.split('=')[1];
    } else if (arg.startsWith('--language=')) {
      options.language = arg.split('=')[1];
    } else if (arg.startsWith('--frontend=')) {
      options.frontend = arg.split('=')[1];
    } else if (arg.startsWith('--hooks-dir=')) {
      options.hooksDir = arg.split('=')[1];
    } else if (arg.startsWith('--components-dir=')) {
      options.componentsDir = arg.split('=')[1];
    } else if (arg.startsWith('--api-dir=')) {
      options.apiDir = arg.split('=')[1];
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

// 辅助函数：写入模块代码（attach-um 使用）
async function writeModuleCode(result, projectPath, moduleName) {
  const backendPath = projectPath;
  const frontendPath = projectPath;

  // 写入后端代码
  if (result.code_patch.backend) {
    const backendFiles = await writeBackendCode(result.code_patch.backend, backendPath, false, moduleName);
    console.log(`      Backend: ${backendFiles.length} files written`);
  }

  // 写入前端代码（通常是 adapter）
  if (result.code_patch.frontend) {
    const frontendFiles = await writeFrontendCode(result.code_patch.frontend, frontendPath, false, moduleName);
    console.log(`      Frontend: ${frontendFiles.length} files written`);
  }

  // 写入 adapter 代码
  if (result.code_patch.adapter) {
    const adapterFiles = await writeAdapterCode(result.code_patch.adapter, frontendPath, false, moduleName);
    console.log(`      Adapter: ${adapterFiles.length} files written`);
  }
}

// 辅助函数：写入 adapter 代码（按 # File: 标记拆分）
async function writeAdapterCode(code, basePath, dryRun, featureName) {
  const files = [];
  if (!code) return files;

  const lines = code.split('\n');
  let currentFile = null;
  let currentContent = [];

  for (const line of lines) {
    const fileMatch = line.match(/^# File:\s*(.+)$/);
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
  init                           Create a new full-stack project
  /comment-m                     Install comment module
  /like                          Install like module
  /follow                        Install follow module
  /user-m                        Install user management module
  /post-m                        Install post module
  /notification                  Install notification module
  /attach-um                     Detect frontend code and attach backend modules

Options:
  --write, -w                    Write files to project (default: dry-run)
  --dry-run                       Preview changes without writing (default)
  --force                         Actually write files
  --verify, -v                   Run code verification (lint + tests)
  --run, -r                      Write files and start services
  --verbose                       Show detailed output
  --target=<path>                Target project path (default: current directory)
  --project-name=<name>          Project name for init command
  --hooks-dir=<path>             Custom hooks directory for frontend analysis
  --components-dir=<path>        Custom components directory for frontend analysis
  --api-dir=<path>               Custom API services directory for frontend analysis

Examples:

  # Create a new project
  npx modularity-skill init --project-name=myapp

  # Preview module changes
  npx modularity-skill /comment-m

  # Install module to existing project
  npx modularity-skill /comment-m --write

  # Install with verification
  npx modularity-skill /comment-m --verify --write

  # Install and run
  npx modularity-skill /comment-m --write --run

  # Specify custom frontend directories for existing code detection
  npx modularity-skill /comment-m --write --hooks-dir=src/store/hooks --components-dir=src/features/comments/components

  # Detect and attach all found frontend modules to backend
  npx modularity-skill /attach-um

  # Detect and write all found frontend modules
  npx modularity-skill /attach-um --write

Project Auto-Detection:
  The CLI automatically detects your project type:
  - FastAPI + Next.js (Python backend + React frontend)
  - Express + Vue (Node.js backend + Vue frontend)
  - Next.js (full-stack Next.js)

Output:
  Returns complete JSON with backend, frontend, and database code patches.
  Use --write to automatically modify your project files.
`);
}

main();
