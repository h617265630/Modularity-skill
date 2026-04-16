#!/usr/bin/env node
// ============================================================================
// 自动安装 Python 依赖脚本
// 在 npm install 时自动执行
// ============================================================================

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const PYTHON_DEPS = [
  'pylint>=3.0.0',
  'black>=23.0.0',
  'mypy>=1.7.0',
  'pytest>=7.4.0',
  'pytest-asyncio>=0.21.0',
  'httpx>=0.25.0',
];

function isPythonAvailable() {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isPipAvailable() {
  try {
    execSync('pip --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installDeps() {
  console.log('\n📦 Auto-installing Python dependencies...\n');

  for (const dep of PYTHON_DEPS) {
    try {
      console.log(`  Installing ${dep}...`);
      execSync(`pip install ${dep}`, { stdio: 'pipe' });
      console.log(`  ✓ ${dep}`);
    } catch (error) {
      console.log(`  ✗ ${dep} failed (non-critical)`);
    }
  }

  console.log('\n✅ Python dependencies installation completed.\n');
}

// 主流程
if (isPythonAvailable() && isPipAvailable()) {
  try {
    installDeps();
  } catch (e) {
    console.warn('Warning: Some Python dependencies failed to install.');
    console.warn('Verification features may be limited.\n');
  }
} else {
  console.log('\n⚠️  Python/pip not found - skipping Python dependencies.');
  console.log('  To enable verification, install manually: pip install -r requirements.txt\n');
}
