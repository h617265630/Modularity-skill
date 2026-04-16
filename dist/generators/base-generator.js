// ============================================================================
// 生成器基类 - Modularity-skill
// ============================================================================
import { kebabCase, pascalCase, camelCase, snakeCase } from './shared/strings.js';
export { kebabCase, pascalCase, camelCase, snakeCase };
/**
 * 基类生成器
 */
export class BaseGenerator {
    config;
    template = null;
    stack = null;
    constructor(config) {
        this.config = config;
    }
    /**
     * 设置模板
     */
    setTemplate(template) {
        this.template = template;
    }
    /**
     * 设置技术栈
     */
    setStack(stack) {
        this.stack = stack;
    }
    /**
     * 生成文件头注释
     */
    generateFileHeader(fileName, description, isPython = false) {
        const sep = isPython ? '#' : '//';
        const lines = [];
        lines.push(`${sep} ============================================================================`);
        lines.push(`${sep} File: ${fileName}`);
        lines.push(`${sep} ============================================================================`);
        lines.push(`${sep} ${description}`);
        lines.push(`${sep} ============================================================================`);
        lines.push('');
        return lines;
    }
    /**
     * 从模板生成代码
     */
    parseTemplateCode(code) {
        const patches = [];
        const filePattern = /^\/\/ File: (.*)$|^\# File: (.*)$/gm;
        let match;
        let lastIndex = 0;
        let currentPath = '';
        let currentContent = '';
        while ((match = filePattern.exec(code)) !== null) {
            if (currentPath) {
                currentContent = code.substring(lastIndex, match.index).trim();
                patches.push({
                    path: currentPath,
                    content: currentContent,
                    action: 'create',
                });
            }
            currentPath = match[1] || match[2];
            lastIndex = filePattern.lastIndex;
        }
        if (currentPath) {
            currentContent = code.substring(lastIndex).trim();
            patches.push({
                path: currentPath,
                content: currentContent,
                action: 'create',
            });
        }
        return patches;
    }
    /**
     * 生成导入语句
     */
    generateImports(imports, isPython = false) {
        const sep = isPython ? '' : "import ";
        const end = isPython ? '' : ';';
        return imports.map((imp) => `${sep}${imp}${end}`);
    }
    /**
     * 验证模板
     */
    validateTemplate() {
        if (!this.template) {
            throw new Error('Template not set. Call setTemplate() first.');
        }
    }
    /**
     * 获取语言
     */
    getLanguage() {
        return this.config.language;
    }
    /**
     * 判断是否为 Python
     */
    isPython() {
        return this.config.language === 'python';
    }
    /**
     * 判断是否为 TypeScript
     */
    isTypeScript() {
        return this.config.language === 'typescript';
    }
    /**
     * 获取框架
     */
    getFramework() {
        return this.config.framework;
    }
    /**
     * 创建空的生成结果
     */
    emptyResult() {
        return {
            files: [],
            warnings: [],
            errors: [],
        };
    }
    /**
     * 添加警告
     */
    addWarning(result, warning) {
        result.warnings.push(warning);
    }
    /**
     * 添加错误
     */
    addError(result, error) {
        result.errors.push(error);
    }
    /**
     * 添加文件
     */
    addFile(result, path, content) {
        result.files.push({ path, content, action: 'create' });
    }
}
//# sourceMappingURL=base-generator.js.map