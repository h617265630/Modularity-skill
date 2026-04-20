#!/usr/bin/env node
// ============================================================================
// Modularity-skill CLI
// 命令行工具 - AI全栈模块编译器
// ============================================================================

import { compileWithFrontendAwareness } from './dist/index.js';
import { detectProject } from './dist/detector/project-detector.js';
import { FileWriter, generateFilePatches } from './dist/writer/file-writer.js';
import { CodeModifier, findAndModifyAuthFiles, modifyExistingFrontendCode } from './dist/writer/code-modifier.js';
import { FrontendAnalyzer } from './dist/detector/frontend-analyzer.js';
import { ProjectScanner } from './dist/core/project-scanner.js';
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

  // ============================================================================
  // 检测并修改现有前端文件（登录/注册等）
  // ============================================================================
  let frontendModifications = [];
  if (project.structure.frontend_path) {
    try {
      const scanner = new ProjectScanner();
      const projectStructure = scanner.scan(projectPath);

      if (projectStructure.frontend) {
        const analyzer = new FrontendAnalyzer(projectStructure.frontend);
        const detected = await analyzer.analyzeFeature(result.feature_name);

        if (detected && (detected.hooks.length > 0 || detected.components.length > 0)) {
          console.log('\n🔗 Modifying existing frontend code to connect to new backend...\n');

          // 根据模块类型确定 API 端点
          const apiEndpoints = getApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

          // 查找并修改认证相关文件
          const modifier = new CodeModifier(projectPath);
          const authFiles = await modifier.findExistingAuthFiles();

          if (authFiles.loginForms.length > 0 || authFiles.registerForms.length > 0 ||
              authFiles.authHooks.length > 0 || authFiles.apiServices.length > 0) {

            console.log(`   Found existing auth files:`);
            console.log(`   - Login forms: ${authFiles.loginForms.length}`);
            console.log(`   - Register forms: ${authFiles.registerForms.length}`);
            console.log(`   - Auth hooks: ${authFiles.authHooks.length}`);
            console.log(`   - API services: ${authFiles.apiServices.length}`);

            // 修改找到的文件
            const loginEndpoint = apiEndpoints.login || '/api/users/login';
            const registerEndpoint = apiEndpoints.register || '/api/users/register';

            for (const file of authFiles.loginForms) {
              const mod = await modifier.modifyLoginForm(file, loginEndpoint);
              if (mod) {
                frontendModifications.push(mod);
                if (options.write && !options.dryRun) {
                  await modifier.writeModifiedFile(mod);
                  console.log(`   ✏️  Modified: ${path.basename(file)}`);
                }
              }
            }

            for (const file of authFiles.registerForms) {
              const mod = await modifier.modifyRegisterForm(file, registerEndpoint);
              if (mod) {
                frontendModifications.push(mod);
                if (options.write && !options.dryRun) {
                  await modifier.writeModifiedFile(mod);
                  console.log(`   ✏️  Modified: ${path.basename(file)}`);
                }
              }
            }

            for (const file of authFiles.authHooks) {
              const mod = await modifier.modifyAuthHook(file, apiEndpoints);
              if (mod) {
                frontendModifications.push(mod);
                if (options.write && !options.dryRun) {
                  await modifier.writeModifiedFile(mod);
                  console.log(`   ✏️  Modified: ${path.basename(file)}`);
                }
              }
            }

            for (const file of authFiles.apiServices) {
              const mod = await modifier.modifyApiService(file, { login: loginEndpoint, register: registerEndpoint });
              if (mod) {
                frontendModifications.push(mod);
                if (options.write && !options.dryRun) {
                  await modifier.writeModifiedFile(mod);
                  console.log(`   ✏️  Modified: ${path.basename(file)}`);
                }
              }
            }

            // ============================================================================
            // 修改导航栏 - 登录后显示用户名
            // ============================================================================
            if (authFiles.navbars.length > 0 && moduleCommand === '/user-m') {
              console.log(`   - Navbars: ${authFiles.navbars.length}`);

              // 查找认证 hook 文件作为参考
              let authHookPath = '';
              if (authFiles.authHooks.length > 0) {
                authHookPath = authFiles.authHooks[0].replace(projectPath, '').replace(/\\/g, '/').replace(/^\//, '');
              }

              for (const file of authFiles.navbars) {
                const mod = await modifier.modifyNavbar(file, {
                  authHookImport: authHookPath || '../hooks/useAuth',
                  userVarName: 'user',
                });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified navbar: ${path.basename(file)} (added user state)`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改帖子相关文件 - /post-m 模块
          // ============================================================================
          if (moduleCommand === '/post-m') {
            const postFiles = await modifier.findExistingPostFiles();

            if (postFiles.postLists.length > 0 || postFiles.postItems.length > 0 ||
                postFiles.postInputs.length > 0 || postFiles.postHooks.length > 0 ||
                postFiles.postApis.length > 0) {

              console.log('\n🔗 Modifying existing post-related frontend code...\n');
              console.log(`   Found post files:`);
              console.log(`   - Post lists: ${postFiles.postLists.length}`);
              console.log(`   - Post items: ${postFiles.postItems.length}`);
              console.log(`   - Post inputs: ${postFiles.postInputs.length}`);
              console.log(`   - Post hooks: ${postFiles.postHooks.length}`);
              console.log(`   - Post APIs: ${postFiles.postApis.length}`);

              // 获取帖子相关的 API 端点
              const postApiEndpoints = getPostApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              const listEndpoint = postApiEndpoints.list || '/api/posts';
              const createEndpoint = postApiEndpoints.create || '/api/posts';
              const detailEndpoint = postApiEndpoints.detail || '/api/posts/{id}';

              // 修改帖子列表
              for (const file of postFiles.postLists) {
                const mod = await modifier.modifyPostList(file, listEndpoint);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改帖子项
              for (const file of postFiles.postItems) {
                const mod = await modifier.modifyPostItem(file, detailEndpoint);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改发帖组件
              for (const file of postFiles.postInputs) {
                const mod = await modifier.modifyPostInput(file, createEndpoint);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改帖子 Hooks
              for (const file of postFiles.postHooks) {
                const mod = await modifier.modifyPostHook(file, postApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改帖子 API Services
              for (const file of postFiles.postApis) {
                const mod = await modifier.modifyPostApi(file, { list: listEndpoint, create: createEndpoint });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改评论相关文件 - /comment-m 模块
          // ============================================================================
          if (moduleCommand === '/comment-m') {
            const commentFiles = await modifier.findExistingCommentFiles();

            if (commentFiles.commentLists.length > 0 || commentFiles.commentItems.length > 0 ||
                commentFiles.commentInputs.length > 0 || commentFiles.commentHooks.length > 0 ||
                commentFiles.commentApis.length > 0) {

              console.log('\n🔗 Modifying existing comment-related frontend code...\n');
              console.log(`   Found comment files:`);
              console.log(`   - Comment lists: ${commentFiles.commentLists.length}`);
              console.log(`   - Comment items: ${commentFiles.commentItems.length}`);
              console.log(`   - Comment inputs: ${commentFiles.commentInputs.length}`);
              console.log(`   - Comment hooks: ${commentFiles.commentHooks.length}`);
              console.log(`   - Comment APIs: ${commentFiles.commentApis.length}`);

              const commentApiEndpoints = getCommentApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              const listEndpoint = commentApiEndpoints.list || '/api/comments';
              const createEndpoint = commentApiEndpoints.create || '/api/comments';

              // 修改评论列表
              for (const file of commentFiles.commentLists) {
                const mod = await modifier.modifyApiFile(file, 'comment', { list: listEndpoint, comments: listEndpoint });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改评论输入
              for (const file of commentFiles.commentInputs) {
                const mod = await modifier.modifyApiFile(file, 'comment', { create: createEndpoint, add: createEndpoint, reply: createEndpoint });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改评论 Hooks
              for (const file of commentFiles.commentHooks) {
                const mod = await modifier.modifyApiFile(file, 'comment', commentApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改评论 API Services
              for (const file of commentFiles.commentApis) {
                const mod = await modifier.modifyApiFile(file, 'comment', commentApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改点赞相关文件 - /like 模块
          // ============================================================================
          if (moduleCommand === '/like') {
            const likeFiles = await modifier.findExistingLikeFiles();

            if (likeFiles.likeButtons.length > 0 || likeFiles.likeCounts.length > 0 ||
                likeFiles.likeHooks.length > 0 || likeFiles.likeApis.length > 0) {

              console.log('\n🔗 Modifying existing like-related frontend code...\n');
              console.log(`   Found like files:`);
              console.log(`   - Like buttons: ${likeFiles.likeButtons.length}`);
              console.log(`   - Like counts: ${likeFiles.likeCounts.length}`);
              console.log(`   - Like hooks: ${likeFiles.likeHooks.length}`);
              console.log(`   - Like APIs: ${likeFiles.likeApis.length}`);

              const likeApiEndpoints = getLikeApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              // 修改点赞按钮
              for (const file of likeFiles.likeButtons) {
                const mod = await modifier.modifyApiFile(file, 'like', { like: likeApiEndpoints.toggle, toggle: likeApiEndpoints.toggle });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改点赞 Hooks
              for (const file of likeFiles.likeHooks) {
                const mod = await modifier.modifyApiFile(file, 'like', likeApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改点赞 API Services
              for (const file of likeFiles.likeApis) {
                const mod = await modifier.modifyApiFile(file, 'like', likeApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改关注相关文件 - /follow 模块
          // ============================================================================
          if (moduleCommand === '/follow') {
            const followFiles = await modifier.findExistingFollowFiles();

            if (followFiles.followButtons.length > 0 || followFiles.followersLists.length > 0 ||
                followFiles.followingLists.length > 0 || followFiles.followHooks.length > 0 ||
                followFiles.followApis.length > 0) {

              console.log('\n🔗 Modifying existing follow-related frontend code...\n');
              console.log(`   Found follow files:`);
              console.log(`   - Follow buttons: ${followFiles.followButtons.length}`);
              console.log(`   - Followers lists: ${followFiles.followersLists.length}`);
              console.log(`   - Following lists: ${followFiles.followingLists.length}`);
              console.log(`   - Follow hooks: ${followFiles.followHooks.length}`);
              console.log(`   - Follow APIs: ${followFiles.followApis.length}`);

              const followApiEndpoints = getFollowApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              // 修改关注按钮
              for (const file of followFiles.followButtons) {
                const mod = await modifier.modifyApiFile(file, 'follow', { follow: followApiEndpoints.follow, unfollow: followApiEndpoints.unfollow });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改关注 Hooks
              for (const file of followFiles.followHooks) {
                const mod = await modifier.modifyApiFile(file, 'follow', followApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改关注 API Services
              for (const file of followFiles.followApis) {
                const mod = await modifier.modifyApiFile(file, 'follow', followApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改通知相关文件 - /notification 模块
          // ============================================================================
          if (moduleCommand === '/notification') {
            const notifFiles = await modifier.findExistingNotificationFiles();

            if (notifFiles.notificationBells.length > 0 || notifFiles.notificationLists.length > 0 ||
                notifFiles.notificationHooks.length > 0 || notifFiles.notificationApis.length > 0) {

              console.log('\n🔗 Modifying existing notification-related frontend code...\n');
              console.log(`   Found notification files:`);
              console.log(`   - Notification bells: ${notifFiles.notificationBells.length}`);
              console.log(`   - Notification lists: ${notifFiles.notificationLists.length}`);
              console.log(`   - Notification hooks: ${notifFiles.notificationHooks.length}`);
              console.log(`   - Notification APIs: ${notifFiles.notificationApis.length}`);

              const notifApiEndpoints = getNotificationApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              // 修改通知铃
              for (const file of notifFiles.notificationBells) {
                const mod = await modifier.modifyApiFile(file, 'notification', { list: notifApiEndpoints.list, bell: notifApiEndpoints.list });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改通知列表
              for (const file of notifFiles.notificationLists) {
                const mod = await modifier.modifyApiFile(file, 'notification', { list: notifApiEndpoints.list, notifications: notifApiEndpoints.list });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改通知 Hooks
              for (const file of notifFiles.notificationHooks) {
                const mod = await modifier.modifyApiFile(file, 'notification', notifApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改通知 API Services
              for (const file of notifFiles.notificationApis) {
                const mod = await modifier.modifyApiFile(file, 'notification', notifApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改私信相关文件 - /message 模块
          // ============================================================================
          if (moduleCommand === '/message') {
            const messageFiles = await modifier.findExistingMessageFiles();

            if (messageFiles.messageLists.length > 0 || messageFiles.messageItems.length > 0 ||
                messageFiles.messageHooks.length > 0 || messageFiles.messageApis.length > 0) {

              console.log('\n🔗 Modifying existing message-related frontend code...\n');
              console.log(`   Found message files:`);
              console.log(`   - Message lists: ${messageFiles.messageLists.length}`);
              console.log(`   - Message items: ${messageFiles.messageItems.length}`);
              console.log(`   - Message hooks: ${messageFiles.messageHooks.length}`);
              console.log(`   - Message APIs: ${messageFiles.messageApis.length}`);

              const messageApiEndpoints = getMessageApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              // 修改私信列表
              for (const file of messageFiles.messageLists) {
                const mod = await modifier.modifyApiFile(file, 'message', { list: messageApiEndpoints.list, messages: messageApiEndpoints.list });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改私信 Hooks
              for (const file of messageFiles.messageHooks) {
                const mod = await modifier.modifyApiFile(file, 'message', messageApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改私信 API Services
              for (const file of messageFiles.messageApis) {
                const mod = await modifier.modifyApiFile(file, 'message', messageApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }

          // ============================================================================
          // 修改搜索相关文件 - /search 模块
          // ============================================================================
          if (moduleCommand === '/search') {
            const searchFiles = await modifier.findExistingSearchFiles();

            if (searchFiles.searchBars.length > 0 || searchFiles.searchResults.length > 0 ||
                searchFiles.searchHooks.length > 0 || searchFiles.searchApis.length > 0) {

              console.log('\n🔗 Modifying existing search-related frontend code...\n');
              console.log(`   Found search files:`);
              console.log(`   - Search bars: ${searchFiles.searchBars.length}`);
              console.log(`   - Search results: ${searchFiles.searchResults.length}`);
              console.log(`   - Search hooks: ${searchFiles.searchHooks.length}`);
              console.log(`   - Search APIs: ${searchFiles.searchApis.length}`);

              const searchApiEndpoints = getSearchApiEndpointsForModule(moduleCommand, result.backend_changes.api_routes);

              // 修改搜索栏
              for (const file of searchFiles.searchBars) {
                const mod = await modifier.modifyApiFile(file, 'search', { search: searchApiEndpoints.search, query: searchApiEndpoints.search });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改搜索结果
              for (const file of searchFiles.searchResults) {
                const mod = await modifier.modifyApiFile(file, 'search', { search: searchApiEndpoints.search, results: searchApiEndpoints.search });
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改搜索 Hooks
              for (const file of searchFiles.searchHooks) {
                const mod = await modifier.modifyApiFile(file, 'search', searchApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }

              // 修改搜索 API Services
              for (const file of searchFiles.searchApis) {
                const mod = await modifier.modifyApiFile(file, 'search', searchApiEndpoints);
                if (mod) {
                  frontendModifications.push(mod);
                  if (options.write && !options.dryRun) {
                    await modifier.writeModifiedFile(mod);
                    console.log(`   ✏️  Modified: ${path.basename(file)}`);
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('\n⚠️  Frontend modification skipped:', error.message);
    }
  }

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
  console.log('  Modified Existing:', frontendModifications.length > 0 ? frontendModifications.length + ' file(s)' : 'None');
  console.log('  State Changes:', result.frontend_changes.state_changes.length || 0);

  console.log('\n📋 Integration Steps:');
  result.integration_steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

  if (frontendModifications.length > 0 && options.verbose) {
    console.log('\n📝 Frontend Modifications:');
    for (const mod of frontendModifications) {
      console.log(`   ${path.basename(mod.file_path)}: ${mod.changes.length} change(s)`);
    }
  }

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

// ============================================================================
// 辅助函数：获取模块对应的 API 端点
// ============================================================================
function getApiEndpointsForModule(moduleCommand, apiRoutes) {
  // 从生成的 API 路由中提取端点
  const endpoints = {
    login: null,
    register: null,
    logout: null,
    me: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (path.includes('login') || path.includes('signin')) {
      endpoints.login = route.path;
    }
    if (path.includes('register') || path.includes('signup')) {
      endpoints.register = route.path;
    }
    if (path.includes('logout')) {
      endpoints.logout = route.path;
    }
    if (path.includes('me') || path === '/users/me') {
      endpoints.me = route.path;
    }
  }

  // 如果没有找到，提供默认值
  if (!endpoints.login) {
    endpoints.login = '/api/users/login';
  }
  if (!endpoints.register) {
    endpoints.register = '/api/users/register';
  }
  if (!endpoints.me) {
    endpoints.me = '/api/users/me';
  }

  return endpoints;
}

// ============================================================================
// 辅助函数：获取帖子模块对应的 API 端点
// ============================================================================
function getPostApiEndpointsForModule(moduleCommand, apiRoutes) {
  // 从生成的 API 路由中提取端点
  const endpoints = {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    // 帖子列表
    if (method === 'get' && (path === '/posts' || path === '/api/posts' || path.includes('posts'))) {
      if (!endpoints.list) {
        endpoints.list = route.path;
      }
    }
    // 帖子详情
    if (method === 'get' && (path.includes('/posts/') || path.includes('/post/'))) {
      endpoints.detail = route.path;
    }
    // 创建帖子
    if (method === 'post' && (path === '/posts' || path === '/api/posts' || path.includes('create'))) {
      endpoints.create = route.path;
    }
    // 更新帖子
    if (method === 'put' && (path.includes('/posts/') || path.includes('/post/'))) {
      endpoints.update = route.path;
    }
    // 删除帖子
    if (method === 'delete' && (path.includes('/posts/') || path.includes('/post/'))) {
      endpoints.delete = route.path;
    }
  }

  // 如果没有找到，提供默认值
  if (!endpoints.list) {
    endpoints.list = '/api/posts';
  }
  if (!endpoints.detail) {
    endpoints.detail = '/api/posts/{id}';
  }
  if (!endpoints.create) {
    endpoints.create = '/api/posts';
  }
  if (!endpoints.update) {
    endpoints.update = '/api/posts/{id}';
  }
  if (!endpoints.delete) {
    endpoints.delete = '/api/posts/{id}';
  }

  return endpoints;
}

// ============================================================================
// 辅助函数：获取评论模块对应的 API 端点
// ============================================================================
function getCommentApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    list: null,
    detail: null,
    create: null,
    update: null,
    delete: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'get' && (path.includes('comments') || path.includes('comment'))) {
      if (!endpoints.list) endpoints.list = route.path;
      if (path.includes('/{id}')) endpoints.detail = route.path;
    }
    if (method === 'post' && (path.includes('comments') || path.includes('comment'))) {
      endpoints.create = route.path;
    }
    if (method === 'put' && (path.includes('comments') || path.includes('comment'))) {
      endpoints.update = route.path;
    }
    if (method === 'delete' && (path.includes('comments') || path.includes('comment'))) {
      endpoints.delete = route.path;
    }
  }

  if (!endpoints.list) endpoints.list = '/api/comments';
  if (!endpoints.detail) endpoints.detail = '/api/comments/{id}';
  if (!endpoints.create) endpoints.create = '/api/comments';
  if (!endpoints.update) endpoints.update = '/api/comments/{id}';
  if (!endpoints.delete) endpoints.delete = '/api/comments/{id}';

  return endpoints;
}

// ============================================================================
// 辅助函数：获取点赞模块对应的 API 端点
// ============================================================================
function getLikeApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    toggle: null,
    status: null,
    count: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'post' && (path.includes('like') || path.includes('likes'))) {
      endpoints.toggle = route.path;
    }
    if (method === 'get' && path.includes('like') && path.includes('status')) {
      endpoints.status = route.path;
    }
    if (method === 'get' && path.includes('like') && path.includes('count')) {
      endpoints.count = route.path;
    }
  }

  if (!endpoints.toggle) endpoints.toggle = '/api/likes';
  if (!endpoints.status) endpoints.status = '/api/likes/status';
  if (!endpoints.count) endpoints.count = '/api/likes/count';

  return endpoints;
}

// ============================================================================
// 辅助函数：获取关注模块对应的 API 端点
// ============================================================================
function getFollowApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    follow: null,
    unfollow: null,
    followers: null,
    following: null,
    isFollowing: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'post' && (path.includes('follow') || path.includes('following'))) {
      if (!endpoints.follow) endpoints.follow = route.path;
      if (path.includes('unfollow')) endpoints.unfollow = route.path;
    }
    if (method === 'get' && path.includes('followers')) {
      endpoints.followers = route.path;
    }
    if (method === 'get' && path.includes('following')) {
      endpoints.following = route.path;
    }
    if (method === 'get' && path.includes('is-following') || path.includes('check')) {
      endpoints.isFollowing = route.path;
    }
  }

  if (!endpoints.follow) endpoints.follow = '/api/follows';
  if (!endpoints.unfollow) endpoints.unfollow = '/api/follows/{user_id}';
  if (!endpoints.followers) endpoints.followers = '/api/users/{id}/followers';
  if (!endpoints.following) endpoints.following = '/api/users/{id}/following';
  if (!endpoints.isFollowing) endpoints.isFollowing = '/api/follows/check/{user_id}';

  return endpoints;
}

// ============================================================================
// 辅助函数：获取通知模块对应的 API 端点
// ============================================================================
function getNotificationApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    list: null,
    markRead: null,
    markAllRead: null,
    delete: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'get' && (path.includes('notification') || path.includes('notifications'))) {
      if (!endpoints.list) endpoints.list = route.path;
    }
    if (method === 'put' && path.includes('notification') && path.includes('read')) {
      endpoints.markRead = route.path;
    }
    if (method === 'put' && path.includes('notifications') && path.includes('read')) {
      endpoints.markAllRead = route.path;
    }
    if (method === 'delete' && (path.includes('notification') || path.includes('notifications'))) {
      endpoints.delete = route.path;
    }
  }

  if (!endpoints.list) endpoints.list = '/api/notifications';
  if (!endpoints.markRead) endpoints.markRead = '/api/notifications/{id}/read';
  if (!endpoints.markAllRead) endpoints.markAllRead = '/api/notifications/read-all';
  if (!endpoints.delete) endpoints.delete = '/api/notifications/{id}';

  return endpoints;
}

// ============================================================================
// 辅助函数：获取私信模块对应的 API 端点
// ============================================================================
function getMessageApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    list: null,
    conversations: null,
    send: null,
    markRead: null,
    delete: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'get' && path.includes('messages')) {
      if (!endpoints.list) endpoints.list = route.path;
    }
    if (method === 'get' && (path.includes('conversation') || path.includes('conversations'))) {
      endpoints.conversations = route.path;
    }
    if (method === 'post' && (path.includes('message') || path.includes('messages'))) {
      endpoints.send = route.path;
    }
    if (method === 'put' && path.includes('message') && path.includes('read')) {
      endpoints.markRead = route.path;
    }
    if (method === 'delete' && (path.includes('message') || path.includes('messages'))) {
      endpoints.delete = route.path;
    }
  }

  if (!endpoints.list) endpoints.list = '/api/messages';
  if (!endpoints.conversations) endpoints.conversations = '/api/conversations';
  if (!endpoints.send) endpoints.send = '/api/messages';
  if (!endpoints.markRead) endpoints.markRead = '/api/messages/{id}/read';
  if (!endpoints.delete) endpoints.delete = '/api/messages/{id}';

  return endpoints;
}

// ============================================================================
// 辅助函数：获取搜索模块对应的 API 端点
// ============================================================================
function getSearchApiEndpointsForModule(moduleCommand, apiRoutes) {
  const endpoints = {
    search: null,
    suggestions: null,
  };

  for (const route of apiRoutes) {
    const path = route.path.toLowerCase();
    const method = route.method.toLowerCase();

    if (method === 'get' && (path.includes('search'))) {
      endpoints.search = route.path;
    }
    if (method === 'get' && path.includes('suggest')) {
      endpoints.suggestions = route.path;
    }
  }

  if (!endpoints.search) endpoints.search = '/api/search';
  if (!endpoints.suggestions) endpoints.suggestions = '/api/search/suggestions';

  return endpoints;
}

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
