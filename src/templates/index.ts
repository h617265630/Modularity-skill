// ============================================================================
// 功能模板索引 - Feature Compiler AI
// ============================================================================

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FeatureTemplate } from '../core/types.js';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 所有功能模板映射（自动从目录加载）
 */
const TEMPLATE_FILES: Record<string, string> = {};

/**
 * 模板缓存
 */
const templateCache: Record<string, FeatureTemplate> = {};

/**
 * 初始化模板映射
 */
function initTemplateFiles(): void {
  if (Object.keys(TEMPLATE_FILES).length > 0) return;

  // 开发时: dist/templates/index.js -> ../../src/templates
  // 生产时: dist/templates/index.js -> ../../../src/templates
  let templatesDir = join(__dirname, '../../src/templates');
  if (!existsSync(templatesDir)) {
    templatesDir = join(__dirname, '../../../src/templates');
  }

  if (!existsSync(templatesDir)) {
    console.warn('Templates directory not found');
    return;
  }

  const files = readdirSync(templatesDir);
  for (const file of files) {
    if (file.endsWith('.json') && file !== '_shared.json') {
      // 文件名转命令: user-m.json -> /user-m, like.json -> /like
      const command = '/' + file.replace('.json', '');
      TEMPLATE_FILES[command] = file;
    }
  }
}

/**
 * 加载模板
 */
function loadTemplate(name: string): FeatureTemplate | null {
  initTemplateFiles();

  const filename = TEMPLATE_FILES[name];
  if (!filename) return null;

  if (templateCache[name]) {
    return templateCache[name];
  }

  try {
    // 开发时: dist/templates/index.js -> ../../src/templates
    // 生产时: dist/templates/index.js -> ../../../src/templates
    let templatesDir = join(__dirname, '../../src/templates');
    if (!existsSync(templatesDir)) {
      templatesDir = join(__dirname, '../../../src/templates');
    }

    const filepath = join(templatesDir, filename);
    const content = readFileSync(filepath, 'utf-8');
    const template = JSON.parse(content) as FeatureTemplate;
    templateCache[name] = template;
    return template;
  } catch (e) {
    console.error('Failed to load template:', name, e);
    return null;
  }
}

/**
 * 根据命令获取功能模板
 */
export async function getTemplate(command: string): Promise<FeatureTemplate | null> {
  initTemplateFiles();
  const normalized = command.trim().toLowerCase();
  if (!TEMPLATE_FILES[normalized]) {
    return null;
  }
  return loadTemplate(normalized);
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): Record<string, string> {
  initTemplateFiles();
  return { ...TEMPLATE_FILES };
}

/**
 * 获取所有支持的命令
 */
export function getSupportedCommands(): string[] {
  initTemplateFiles();
  return Object.keys(TEMPLATE_FILES);
}