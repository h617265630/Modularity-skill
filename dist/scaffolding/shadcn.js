// ============================================================================
// shadcn/ui 组件检测和安装器 - Modularity-skill
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
/**
 * shadcn/ui 组件注册表
 */
export const SHADCN_COMPONENTS = [
    // Forms
    'button',
    'input',
    'label',
    'textarea',
    'select',
    'checkbox',
    'radio-group',
    'switch',
    'slider',
    // Layout
    'card',
    'accordion',
    'collapsible',
    'separator',
    'sheet',
    'dialog',
    'drawer',
    'popover',
    'tooltip',
    'dropdown-menu',
    // Navigation
    'navigation-menu',
    'tabs',
    'breadcrumb',
    'pagination',
    'menu',
    // Data Display
    'badge',
    'avatar',
    'table',
    'progress',
    'skeleton',
    'timeline',
    // Feedback
    'alert',
    'alert-dialog',
    'toast',
    'sonner',
    'spinner',
    'progress',
];
/**
 * 模块需要的组件映射
 */
export const MODULE_SHADCN_REQUIREMENTS = {
    // 评论模块需要的组件
    'comment-m': ['button', 'input', 'textarea', 'avatar', 'card', 'separator'],
    // 用户模块需要的组件
    'user-m': ['button', 'input', 'card', 'avatar', 'badge', 'separator'],
    // 帖子模块需要的组件
    'post-m': ['button', 'input', 'textarea', 'card', 'avatar', 'badge', 'separator'],
    // 通知模块需要的组件
    'notification': ['button', 'card', 'badge', 'avatar', 'separator'],
    // 点赞模块需要的组件
    'like': ['button', 'avatar'],
    // 关注模块需要的组件
    'follow': ['button', 'avatar', 'card'],
};
/**
 * 检测项目是否使用 shadcn/ui
 */
export async function detectShadcn(projectPath) {
    const componentsJsonPath = path.join(projectPath, 'components.json');
    try {
        const exists = fs.existsSync(componentsJsonPath);
        return exists;
    }
    catch {
        return false;
    }
}
/**
 * 获取项目已安装的 shadcn/ui 组件
 */
export async function getInstalledComponents(projectPath) {
    const componentsDir = path.join(projectPath, 'src/components/ui');
    try {
        const files = await fs.promises.readdir(componentsDir);
        return files
            .filter(f => f.endsWith('.tsx'))
            .map(f => f.replace('.tsx', ''));
    }
    catch {
        return [];
    }
}
/**
 * 获取模块需要的 shadcn/ui 组件
 */
export function getComponentsForModule(moduleName) {
    return MODULE_SHADCN_REQUIREMENTS[moduleName] || [];
}
/**
 * 计算需要添加的组件（差集）
 */
export async function getMissingComponents(projectPath, moduleName) {
    const installed = await getInstalledComponents(projectPath);
    const required = getComponentsForModule(moduleName);
    return required.filter(c => !installed.includes(c));
}
/**
 * 安装 shadcn/ui 组件
 */
export async function installShadcnComponents(projectPath, components) {
    if (components.length === 0) {
        console.log('   ✅ All required shadcn/ui components already installed');
        return;
    }
    console.log(`   📦 Installing shadcn/ui components: ${components.join(', ')}`);
    for (const component of components) {
        try {
            await execAsync(`npx shadcn-ui@latest add ${component} --yes`, {
                cwd: projectPath,
                timeout: 120000,
            });
            console.log(`     ✅ ${component}`);
        }
        catch (error) {
            console.warn(`     ⚠️  Failed to install ${component}: ${error.message}`);
        }
    }
}
/**
 * 检测并安装模块需要的 shadcn/ui 组件
 */
export async function ensureShadcnComponents(projectPath, moduleName) {
    // 检查是否是 shadcn/ui 项目
    const isShadcn = await detectShadcn(projectPath);
    if (!isShadcn) {
        console.log('   ℹ️  Project does not use shadcn/ui, skipping component check');
        return;
    }
    // 计算缺少的组件
    const missing = await getMissingComponents(projectPath, moduleName);
    if (missing.length === 0) {
        console.log('   ✅ All required shadcn/ui components already installed');
        return;
    }
    // 安装缺少的组件
    await installShadcnComponents(projectPath, missing);
}
/**
 * 生成 shadcn/ui 组件导入代码
 */
export function generateShadcnImports(components) {
    const imports = components.map(c => {
        const componentName = c.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        return `import { ${componentName} } from "@/components/ui/${c}"`;
    });
    return imports.join('\n');
}
//# sourceMappingURL=shadcn.js.map