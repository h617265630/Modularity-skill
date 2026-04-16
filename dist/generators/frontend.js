// ============================================================================
// 前端代码生成器 - Modularity-skill
// 生成带文件标记的模块化代码
// ============================================================================
import { BaseGenerator, kebabCase, pascalCase } from './base-generator.js';
import { AICodeGenerator } from './ai-code-generator.js';
import { fillSnippet } from './template-snippets.js';
export class FrontendGenerator extends BaseGenerator {
    aiGenerator;
    constructor(options) {
        super(options || {});
        this.aiGenerator = new AICodeGenerator();
    }
    async generate(template, stack) {
        const parts = [];
        // 1. 生成组件文件
        for (const component of template.frontend.components) {
            parts.push(this.generateComponentFile(component, template));
        }
        // 2. 生成 Hook 文件
        for (const hook of template.frontend.hooks) {
            parts.push(await this.generateHookFile(hook));
        }
        // 3. 生成 API 服务文件
        parts.push(this.generateApiServiceFile(template));
        // 4. 生成页面文件
        for (const page of template.frontend.pages) {
            parts.push(this.generatePageFile(page, template));
        }
        return parts.join('\n');
    }
    generateComponentFile(component, template) {
        const fileName = 'src/components/' + pascalCase(component.name) + '.tsx';
        const lines = [];
        lines.push('// File: ' + fileName);
        lines.push('// ============================================================================');
        lines.push('// ' + component.name + ' Component');
        lines.push('// ============================================================================');
        lines.push('');
        lines.push("import React from 'react';");
        if (component.props && component.props.length > 0) {
            lines.push('');
            lines.push('interface ' + component.name + 'Props {');
            for (const prop of component.props) {
                const required = prop.required !== false ? '' : '?';
                lines.push('  ' + prop.name + required + ': ' + prop.type + ';');
            }
            lines.push('}');
        }
        lines.push('');
        lines.push('export const ' + component.name + ': React.FC' +
            (component.props && component.props.length > 0 ? '<' + component.name + 'Props>' : '') +
            ' = (' + (component.props && component.props.length > 0 ? 'props' : '') + ') => {');
        if (component.description) {
            lines.push('  // ' + component.description);
        }
        lines.push('  return (');
        lines.push('    <div className="' + kebabCase(component.name) + '">');
        lines.push('      {/* ' + component.name + ' component */}');
        lines.push('    </div>');
        lines.push('  );');
        lines.push('};');
        lines.push('');
        lines.push('export default ' + component.name + ';');
        return lines.join('\n');
    }
    async generateHookFile(hook) {
        const fileName = 'src/hooks/use' + pascalCase(hook.name) + '.ts';
        const lines = [];
        lines.push('// File: ' + fileName);
        lines.push('// ============================================================================');
        lines.push('// ' + hook.name + ' Hook');
        lines.push('// ============================================================================');
        lines.push('');
        const returnType = hook.returns || 'void';
        // Handle hook implementation type
        if (hook.impl?.type === 'ai') {
            // AI 生成
            const result = await this.aiGenerator.generate(hook.impl.ai_request);
            lines.push(result.code);
        }
        else if (hook.impl?.type === 'template') {
            // 模板片段
            const snippet = fillSnippet(hook.impl.impl, {
                hook_name: hook.name,
                params_type: 'any',
            });
            lines.push(snippet);
        }
        else if (hook.impl?.type === 'hybrid') {
            // Hybrid 模式
            if (hook.impl.impl) {
                const snippet = fillSnippet(hook.impl.impl, {
                    hook_name: hook.name,
                    params_type: 'any',
                });
                lines.push(snippet);
            }
            if (hook.impl.ai_request) {
                const result = await this.aiGenerator.generate(hook.impl.ai_request);
                lines.push(result.code);
            }
        }
        else {
            // 默认骨架代码
            lines.push("import { useState, useEffect } from 'react';");
            lines.push('');
            lines.push('export function use' + pascalCase(hook.name) + '() {');
            lines.push('  // ' + hook.description);
            lines.push('  const [data, setData] = useState<any>(null);');
            lines.push('  const [loading, setLoading] = useState<boolean>(false);');
            lines.push('  const [error, setError] = useState<string | null>(null);');
            lines.push('');
            lines.push('  // TODO: Implement ' + hook.name + ' logic');
            lines.push('');
            lines.push('  return { data, loading, error };');
            lines.push('}');
        }
        return lines.join('\n');
    }
    generateApiServiceFile(template) {
        const fileName = 'src/services/' + kebabCase(template.feature_name) + '.ts';
        const lines = [];
        lines.push('// File: ' + fileName);
        lines.push('// ============================================================================');
        lines.push('// ' + template.feature_name + ' API Service');
        lines.push('// ============================================================================');
        lines.push('');
        lines.push("import axios from 'axios';");
        lines.push('');
        const prefix = kebabCase(template.feature_name);
        lines.push('const API_BASE = \'/api/' + prefix + '\';');
        lines.push('');
        lines.push('const api = axios.create({');
        lines.push('  baseURL: API_BASE,');
        lines.push('  timeout: 10000,');
        lines.push('});');
        lines.push('');
        lines.push('// Add auth interceptor');
        lines.push('api.interceptors.request.use((config) => {');
        lines.push('  const token = localStorage.getItem(\'token\');');
        lines.push('  if (token) {');
        lines.push('    config.headers.Authorization = `Bearer ${token}`;');
        lines.push('  }');
        lines.push('  return config;');
        lines.push('});');
        lines.push('');
        // Generate API methods for each route
        for (const route of template.backend.routes) {
            const method = route.method.toLowerCase();
            const funcName = method + route.path.replace(/\//g, '_').replace(/:/g, '');
            lines.push('export const ' + funcName + ' = async (' + (method === 'get' || method === 'delete' ? 'params?' : 'data?') + ') => {');
            lines.push('  try {');
            lines.push('    const response = await api.' + method + '(`' + route.path + '`, ' + (method === 'get' || method === 'delete' ? '{ params }' : 'data') + ');');
            lines.push('    return response.data;');
            lines.push('  } catch (error) {');
            lines.push('    console.error(\'API Error:\', error);');
            lines.push('    throw error;');
            lines.push('  }');
            lines.push('};');
            lines.push('');
        }
        lines.push('export default api;');
        return lines.join('\n');
    }
    generatePageFile(page, template) {
        const fileName = 'src/pages/' + pascalCase(page.name) + 'Page.tsx';
        const lines = [];
        lines.push('// File: ' + fileName);
        lines.push('// ============================================================================');
        lines.push('// ' + page.name + ' Page');
        lines.push('// ============================================================================');
        lines.push('');
        lines.push("import React from 'react';");
        lines.push("import { use" + pascalCase(template.feature_name) + " } from '../hooks/use" + pascalCase(template.feature_name) + "';");
        lines.push('');
        lines.push('export const ' + page.name + 'Page: React.FC = () => {');
        lines.push('  // ' + page.description);
        lines.push('  const { data, loading, error } = use' + pascalCase(template.feature_name) + '();');
        lines.push('');
        lines.push('  if (loading) return <div>Loading...</div>;');
        lines.push('  if (error) return <div>Error: {error}</div>;');
        lines.push('');
        lines.push('  return (');
        lines.push('    <div className="' + kebabCase(page.name) + '-page">');
        lines.push('      <h1>' + page.name + '</h1>');
        lines.push('      {/* Page content */}');
        lines.push('    </div>');
        lines.push('  );');
        lines.push('};');
        lines.push('');
        lines.push('export default ' + page.name + 'Page;');
        return lines.join('\n');
    }
}
//# sourceMappingURL=frontend.js.map