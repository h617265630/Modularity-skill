// ============================================================================
// Frontend Code Analyzer - Modularity-skill
// 检测并分析现有前端代码，为集成做准备
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// Pattern definitions
// ============================================================================
const HOOK_NAME_PATTERN = /^(use[A-Z]\w+)$/;
const API_CALL_PATTERNS = [
    // axios calls: axios.get('/api/...'), axios.post('/api/...', data)
    /\baxios\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // fetch calls: fetch('/api/...')
    /\bfetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // api service calls: api.get('/api/...'), api.post('/api/...', data)
    /\bapi\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
];
const AUTH_HEADER_PATTERNS = [
    /Authorization.*Bearer/i,
    /token/i,
    /x-auth-token/i,
];
const PAGINATION_PATTERNS = [
    { pattern: /cursor/i, field: 'cursor' },
    { pattern: /hasMore|has_more/i, field: 'has_more' },
    { pattern: /items|results|data/i, field: 'items' },
    { pattern: /page|offset/i, field: 'page' },
    { pattern: /limit|page_size/i, field: 'limit' },
];
// ============================================================================
// Frontend Analyzer
// ============================================================================
/**
 * 前端代码分析器
 * 扫描前端代码库，检测特定功能的 hooks/components
 */
export class FrontendAnalyzer {
    projectStructure;
    options;
    constructor(projectStructure, options) {
        this.projectStructure = projectStructure;
        this.options = {
            hooks_dir: projectStructure.hooksDir,
            components_dir: projectStructure.componentsDir,
            api_services_dir: projectStructure.apiDir || projectStructure.servicesDir,
            scan_depth: 'deep',
            infer_types: true,
            ...options,
        };
    }
    /**
     * 分析特定功能的前端代码
     * @param featureName 功能名称（如 "comments", "posts"）
     * @returns 检测到的前端代码，未找到返回 null
     */
    async analyzeFeature(featureName) {
        const normalizedFeature = featureName.toLowerCase();
        // 扫描 hooks 目录
        const hooks = await this.scanHooks(normalizedFeature);
        // 扫描 components 目录
        const components = await this.scanComponents(normalizedFeature, hooks);
        // 扫描 API services
        const apiServices = await this.scanApiServices(normalizedFeature);
        // 如果什么都没找到，返回 null
        if (hooks.length === 0 && components.length === 0 && apiServices.length === 0) {
            return null;
        }
        return {
            feature_name: featureName,
            hooks,
            components,
            api_services: apiServices,
        };
    }
    /**
     * 扫描 hooks 目录
     */
    async scanHooks(featureName) {
        const hooksDir = this.options.hooks_dir;
        if (!hooksDir || !fs.existsSync(hooksDir)) {
            return [];
        }
        const detectedHooks = [];
        const hookFiles = this.getTsTsxFiles(hooksDir);
        for (const file of hookFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const hookName = this.extractHookName(content, file);
            if (!hookName)
                continue;
            // 检查这个 hook 是否与功能相关
            if (!this.isRelatedToFeature(hookName, featureName))
                continue;
            const endpoints = this.extractEndpoints(content);
            const responseShape = this.extractResponseShape(content);
            const authHeaders = this.extractAuthHeaders(content);
            detectedHooks.push({
                name: hookName,
                file_path: file,
                endpoints_called: endpoints,
                expected_response_shape: responseShape,
                auth_headers: authHeaders,
            });
        }
        return detectedHooks;
    }
    /**
     * 扫描 components 目录
     */
    async scanComponents(featureName, relatedHooks) {
        const componentsDir = this.options.components_dir;
        if (!componentsDir || !fs.existsSync(componentsDir)) {
            return [];
        }
        const detectedComponents = [];
        const componentFiles = this.getTsTsxFiles(componentsDir);
        for (const file of componentFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            const componentName = this.extractComponentName(content, file);
            if (!componentName)
                continue;
            // 检查组件名是否与功能相关
            if (!this.isRelatedToFeature(componentName, featureName))
                continue;
            const hooksUsed = this.extractHooksUsed(content);
            const propsType = this.extractPropsType(content);
            detectedComponents.push({
                name: componentName,
                file_path: file,
                props_type: propsType,
                hooks_used: hooksUsed,
            });
        }
        return detectedComponents;
    }
    /**
     * 扫描 API services 目录
     */
    async scanApiServices(featureName) {
        const apiDir = this.options.api_services_dir;
        if (!apiDir || !fs.existsSync(apiDir)) {
            return [];
        }
        const detectedServices = [];
        const serviceFiles = this.getTsTsxFiles(apiDir);
        for (const file of serviceFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            // 检查这个 service 是否与功能相关
            const fileName = path.basename(file).toLowerCase();
            if (!fileName.includes(featureName.toLowerCase()) &&
                !this.isRelatedToFeature(fileName, featureName)) {
                continue;
            }
            const baseUrl = this.extractBaseUrl(content);
            const endpoints = this.extractServiceEndpoints(content);
            if (endpoints.length > 0) {
                detectedServices.push({
                    file_path: file,
                    base_url: baseUrl,
                    endpoints,
                });
            }
        }
        return detectedServices;
    }
    // ============================================================================
    // Extraction methods
    // ============================================================================
    /**
     * 从文件内容中提取 hook 名称
     */
    extractHookName(content, filePath) {
        // 从函数声明提取
        const funcMatch = content.match(/export\s+function\s+(use\w+)/);
        if (funcMatch)
            return funcMatch[1];
        // 从变量赋值提取
        const varMatch = content.match(/export\s+const\s+(use\w+)\s*=/);
        if (varMatch)
            return varMatch[1];
        // 回退：从文件名推断
        const fileName = path.basename(filePath, path.extname(filePath));
        if (HOOK_NAME_PATTERN.test(fileName)) {
            return fileName;
        }
        return null;
    }
    /**
     * 从文件内容中提取组件名称
     */
    extractComponentName(content, filePath) {
        // 从 export 提取
        const exportMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
        if (exportMatch)
            return exportMatch[1];
        // 从 default export 提取
        const defaultMatch = content.match(/export\s+default\s+(\w+)/);
        if (defaultMatch)
            return defaultMatch[1];
        // 回退：从文件名推断
        const fileName = path.basename(filePath, path.extname(filePath));
        return fileName;
    }
    /**
     * 从 hook 内容中提取 API 端点
     */
    extractEndpoints(content) {
        const endpoints = [];
        for (const pattern of API_CALL_PATTERNS) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(content)) !== null) {
                const method = (match[1] || 'get').toUpperCase();
                let apiPath = match[2];
                // 检查认证
                const hasAuth = AUTH_HEADER_PATTERNS.some(p => p.test(content));
                // 提取查询参数
                const queryParams = this.extractQueryParams(content, match.index);
                // 确定请求体类型
                const bodyType = this.extractBodyType(content, match.index);
                endpoints.push({
                    method: method,
                    path: apiPath,
                    has_auth: hasAuth,
                    request_body_type: bodyType,
                    query_params: queryParams,
                });
            }
        }
        return endpoints;
    }
    /**
     * 提取查询参数
     */
    extractQueryParams(content, callIndex) {
        const params = [];
        const beforeCall = content.substring(Math.max(0, callIndex - 500), callIndex);
        const paramMatches = beforeCall.match(/params\s*[=:]\s*\{([^}]+)\}/g);
        if (paramMatches) {
            for (const match of paramMatches) {
                const keys = match.match(/(\w+)\s*:/g);
                if (keys) {
                    params.push(...keys.map(k => k.replace(/:\s*$/, '').trim()));
                }
            }
        }
        return params;
    }
    /**
     * 提取请求体类型
     */
    extractBodyType(content, callIndex) {
        const afterCall = content.substring(callIndex, callIndex + 200);
        const bodyMatch = afterCall.match(/data\s*:\s*(\w+)/);
        return bodyMatch ? bodyMatch[1] : null;
    }
    /**
     * 从 hook 内容中提取 response shape
     */
    extractResponseShape(content) {
        // 尝试从返回类型注解提取
        const returnTypeMatch = content.match(/:\s*(?:Promise<)?([^=)]+)[\]> ]*\s*=/);
        if (!returnTypeMatch)
            return null;
        const typeStr = returnTypeMatch[1].trim();
        const isArray = typeStr.includes('[]') || typeStr.includes('Array<');
        const isPaginated = PAGINATION_PATTERNS.some(p => p.pattern.test(content));
        // 从接口定义中提取字段
        const fields = this.extractTypeFields(content, typeStr);
        // 检测分页结构
        let pagination_fields;
        if (isPaginated) {
            pagination_fields = {
                cursor: this.findField(content, 'cursor') || 'cursor',
                has_more: this.findField(content, 'has_more') || 'has_more',
                items: this.findField(content, 'items') || 'items',
            };
        }
        return {
            type_name: typeStr.replace(/(\[\]) |Array<|>/g, ''),
            fields,
            is_array: isArray,
            is_paginated: isPaginated,
            pagination_fields,
        };
    }
    /**
     * 提取类型字段
     */
    extractTypeFields(content, typeName) {
        const fields = [];
        // 查找 interface 定义
        const cleanTypeName = typeName.replace(/(\[\]) |Array<|>/g, '');
        const interfaceRegex = new RegExp(`interface\\s+${cleanTypeName}\\s*\\{([^}]+)\\}`);
        const interfaceMatch = content.match(interfaceRegex);
        if (interfaceMatch) {
            const fieldsContent = interfaceMatch[1];
            const fieldMatches = fieldsContent.matchAll(/(\w+)(\??):\s*([^;]+);/g);
            for (const match of fieldMatches) {
                fields.push({
                    name: match[1],
                    type: match[3].trim(),
                    optional: match[2] === '?',
                });
            }
        }
        return fields;
    }
    /**
     * 查找分页字段
     */
    findField(content, field) {
        const patterns = PAGINATION_PATTERNS.find(p => p.field === field);
        if (patterns && patterns.pattern.test(content)) {
            return patterns.field;
        }
        return null;
    }
    /**
     * 提取认证头
     */
    extractAuthHeaders(content) {
        const headers = [];
        for (const pattern of AUTH_HEADER_PATTERNS) {
            if (pattern.test(content)) {
                headers.push(pattern.source);
            }
        }
        return headers;
    }
    /**
     * 提取 base URL
     */
    extractBaseUrl(content) {
        const baseUrlMatch = content.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
        return baseUrlMatch ? baseUrlMatch[1] : '/api';
    }
    /**
     * 提取 service 端点
     */
    extractServiceEndpoints(content) {
        const endpoints = [];
        // 匹配函数定义
        const funcPattern = /(?:export\s+)?(?:const|async\s+function)\s+(\w+)\s*[=:]\s*(?:async\s*)?(?:function\s*)?\([^)]*\)\s*(?::\s*Promise<[^>]+>\s*)?(?:=>\s*)?\{[^}]*(?:axios|fetch|api)\.[^(]+\([^)]*['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = funcPattern.exec(content)) !== null) {
            const funcName = match[1];
            const path = match[2];
            const method = this.inferMethodFromFuncName(funcName, content, match.index);
            endpoints.push({
                method,
                path,
                function_name: funcName,
            });
        }
        return endpoints;
    }
    /**
     * 从函数名推断 HTTP 方法
     */
    inferMethodFromFuncName(funcName, content, index) {
        const lower = funcName.toLowerCase();
        if (lower.startsWith('get') || lower.includes('fetch') || lower.includes('list'))
            return 'GET';
        if (lower.startsWith('create') || lower.includes('add') || lower.includes('post'))
            return 'POST';
        if (lower.startsWith('update') || lower.includes('put'))
            return 'PUT';
        if (lower.startsWith('delete') || lower.includes('remove'))
            return 'DELETE';
        if (lower.includes('patch'))
            return 'PATCH';
        // 检查函数体内的实际 API 调用
        const funcBody = content.substring(index, index + 300);
        if (funcBody.includes('.get('))
            return 'GET';
        if (funcBody.includes('.post('))
            return 'POST';
        if (funcBody.includes('.put('))
            return 'PUT';
        if (funcBody.includes('.patch('))
            return 'PATCH';
        if (funcBody.includes('.delete('))
            return 'DELETE';
        return 'GET';
    }
    /**
     * 提取组件使用的 hooks
     */
    extractHooksUsed(content) {
        const hooks = [];
        const hookMatches = content.matchAll(/use[A-Z]\w+/g);
        for (const match of hookMatches) {
            if (!hooks.includes(match[0])) {
                hooks.push(match[0]);
            }
        }
        return hooks;
    }
    /**
     * 提取 props 类型
     */
    extractPropsType(content) {
        const propsMatch = content.match(/interface\s+(\w+Props)/);
        return propsMatch ? propsMatch[1] : null;
    }
    /**
     * 判断名称是否与功能相关
     */
    isRelatedToFeature(name, featureName) {
        const lowerName = name.toLowerCase();
        const lowerFeature = featureName.toLowerCase();
        // 直接匹配
        if (lowerName.includes(lowerFeature))
            return true;
        // 常见单复数变化
        if (lowerName.includes(this.pluralize(lowerFeature)))
            return true;
        if (lowerName.includes(this.singularize(lowerFeature)))
            return true;
        return false;
    }
    /**
     * 复数化
     */
    pluralize(word) {
        if (word.endsWith('s'))
            return word;
        if (word.endsWith('y'))
            return word.slice(0, -1) + 'ies';
        if (word.endsWith('ch') || word.endsWith('sh'))
            return word + 'es';
        return word + 's';
    }
    /**
     * 单数化
     */
    singularize(word) {
        if (word.endsWith('ies'))
            return word.slice(0, -3) + 'y';
        if (word.endsWith('es'))
            return word.slice(0, -2);
        if (word.endsWith('s'))
            return word.slice(0, -1);
        return word;
    }
    /**
     * 获取目录下所有 .ts/.tsx 文件
     */
    getTsTsxFiles(dir) {
        const files = [];
        if (!fs.existsSync(dir)) {
            return files;
        }
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.getTsTsxFiles(fullPath));
            }
            else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
                files.push(fullPath);
            }
        }
        return files;
    }
}
// ============================================================================
// Integration Matching
// ============================================================================
/**
 * 比较检测到的前端代码与模板后端路由，确定集成策略
 */
export function matchFrontendToBackend(detected, templateRoutes) {
    const matchedEndpoints = [];
    const mismatchedEndpoints = [];
    // 收集前端所有端点
    const frontendEndpoints = new Map();
    for (const hook of detected.hooks) {
        for (const ep of hook.endpoints_called) {
            const key = `${ep.method}:${ep.path}`;
            if (!frontendEndpoints.has(key)) {
                frontendEndpoints.set(key, ep);
            }
        }
    }
    for (const service of detected.api_services) {
        for (const ep of service.endpoints) {
            const key = `${ep.method}:${ep.path}`;
            if (!frontendEndpoints.has(key)) {
                frontendEndpoints.set(key, {
                    method: ep.method,
                    path: ep.path,
                    has_auth: false,
                    query_params: [],
                    request_body_type: null,
                });
            }
        }
    }
    // 匹配模板路由
    for (const expected of templateRoutes) {
        const key = `${expected.method}:${expected.path}`;
        const frontendEndpoint = frontendEndpoints.get(key);
        if (frontendEndpoint) {
            // 精确匹配
            matchedEndpoints.push({
                frontend_path: frontendEndpoint.path,
                backend_path: expected.path,
                method: expected.method,
                compatibility: 'exact',
            });
            frontendEndpoints.delete(key);
        }
        else {
            // 检查路径变体
            const normalizedExpected = normalizePath(expected.path);
            let foundVariant = null;
            for (const [fp, ep] of frontendEndpoints.entries()) {
                if (normalizePath(fp) === normalizedExpected && ep.method === expected.method) {
                    foundVariant = fp;
                    break;
                }
            }
            if (foundVariant) {
                // 需要 adapter
                const frontendEp = frontendEndpoints.get(foundVariant);
                mismatchedEndpoints.push({
                    frontend_path: foundVariant,
                    backend_path: expected.path,
                    method: expected.method,
                    differences: [{
                            aspect: 'path',
                            frontend_expectation: foundVariant,
                            backend_actual: expected.path,
                        }],
                    suggested_resolution: 'add-adapter',
                });
                frontendEndpoints.delete(foundVariant);
            }
            else {
                // 缺少后端端点
                mismatchedEndpoints.push({
                    frontend_path: '',
                    backend_path: expected.path,
                    method: expected.method,
                    differences: [{
                            aspect: 'path',
                            frontend_expectation: '',
                            backend_actual: expected.path,
                        }],
                    suggested_resolution: 'add-backend',
                });
            }
        }
    }
    // 剩余的前端端点没有后端匹配
    for (const [fp, ep] of frontendEndpoints.entries()) {
        mismatchedEndpoints.push({
            frontend_path: fp,
            backend_path: null,
            method: ep.method,
            differences: [{
                    aspect: 'path',
                    frontend_expectation: fp,
                    backend_actual: '',
                }],
            suggested_resolution: 'add-backend',
        });
    }
    // 确定策略
    const strategy = determineStrategy(matchedEndpoints, mismatchedEndpoints);
    return {
        strategy,
        matched_endpoints: matchedEndpoints,
        mismatched_endpoints: mismatchedEndpoints,
        adapter_code: strategy === 'adapter' || strategy === 'exact'
            ? generateAdapterCode(detected, matchedEndpoints, mismatchedEndpoints)
            : null,
        backend_patch_suggestions: generateBackendSuggestions(mismatchedEndpoints),
        frontend_patch_suggestions: generateFrontendSuggestions(mismatchedEndpoints),
    };
}
/**
 * 标准化路径（去除版本号等差异）
 */
function normalizePath(p) {
    return p
        .replace(/\/v\d+\//, '/')
        .replace(/\/+/g, '/')
        .replace(/^\//, '');
}
/**
 * 确定集成策略
 */
function determineStrategy(matched, mismatched) {
    if (matched.length === 0 && mismatched.length === 0) {
        return 'exact';
    }
    if (matched.length > 0 && mismatched.length === 0) {
        return 'exact';
    }
    if (matched.length > 0 && mismatched.length > 0) {
        // 有些匹配，有些不匹配 → 需要 adapter
        return 'adapter';
    }
    if (mismatched.length > 0 && mismatched.every(m => m.suggested_resolution === 'add-backend')) {
        // 所有不匹配都需要添加后端端点
        return 'backend-first';
    }
    return 'adapter';
}
/**
 * 生成 adapter 代码
 */
function generateAdapterCode(detected, matched, mismatched) {
    const featureName = detected.feature_name;
    const lines = [];
    lines.push(`// File: src/services/adapters/${featureName}Adapter.ts`);
    lines.push('// ============================================================================');
    lines.push('// Auto-generated Integration Adapter');
    lines.push('// Generated by Modularity-skill');
    lines.push('// ============================================================================');
    lines.push('');
    lines.push("import axios from 'axios';");
    lines.push('');
    lines.push('// Backend API client');
    lines.push('const backendApi = axios.create({');
    lines.push("  baseURL: process.env.API_BASE_URL || 'http://localhost:8000',");
    lines.push('  timeout: 10000,');
    lines.push('});');
    lines.push('');
    lines.push('// Auth interceptor');
    lines.push('backendApi.interceptors.request.use((config) => {');
    lines.push("  const token = localStorage.getItem('token');");
    lines.push('  if (token) {');
    lines.push('    config.headers.Authorization = `Bearer ${token}`;');
    lines.push('  }');
    lines.push('  return config;');
    lines.push('});');
    lines.push('');
    // 路径映射
    if (mismatched.length > 0) {
        lines.push('// Endpoint path mappings (frontend path -> backend path)');
        lines.push('const PATH_MAP: Record<string, string> = {');
        for (const m of mismatched) {
            if (m.frontend_path && m.backend_path) {
                lines.push(`  '${m.frontend_path}': '${m.backend_path}',`);
            }
        }
        lines.push('};');
        lines.push('');
    }
    // 适配器函数
    lines.push('// Adapter functions');
    lines.push('');
    for (const m of mismatched) {
        if (m.frontend_path && m.backend_path) {
            const funcName = `adapter_${m.method.toLowerCase()}_${m.backend_path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
            lines.push(`/**`);
            lines.push(` * Adapter: ${m.method} ${m.frontend_path} -> ${m.backend_path}`);
            lines.push(` */`);
            lines.push(`export async function ${funcName}(params?: any, data?: any) {`);
            lines.push(`  const mappedPath = PATH_MAP['${m.frontend_path}'] || '${m.backend_path}';`);
            lines.push(`  const response = await backendApi.${m.method.toLowerCase()}(mappedPath, data, { params });`);
            lines.push('  return response.data;');
            lines.push('}');
            lines.push('');
        }
    }
    // Response transformers
    for (const hook of detected.hooks) {
        if (hook.expected_response_shape) {
            const typeName = hook.expected_response_shape.type_name;
            lines.push(`/**`);
            lines.push(` * Transform backend ${typeName} response to frontend expected shape`);
            lines.push(` */`);
            lines.push(`function transform${typeName}(backendResponse: any): ${typeName} {`);
            if (hook.expected_response_shape.is_paginated && hook.expected_response_shape.pagination_fields) {
                const pf = hook.expected_response_shape.pagination_fields;
                lines.push(`  return {`);
                lines.push(`    ${pf.items}: backendResponse.data?.${pf.items} || backendResponse.data?.items || [],`);
                lines.push(`    ${pf.has_more}: backendResponse.data?.${pf.has_more} || backendResponse.has_more || false,`);
                lines.push(`    ${pf.cursor}: backendResponse.data?.${pf.cursor} || backendResponse.cursor,`);
                lines.push(`  };`);
            }
            else if (hook.expected_response_shape.is_array) {
                lines.push(`  return backendResponse.data?.items || backendResponse.data || [];`);
            }
            else {
                lines.push(`  return backendResponse.data || backendResponse;`);
            }
            lines.push('}');
            lines.push('');
        }
    }
    return lines.join('\n');
}
/**
 * 生成后端建议
 */
function generateBackendSuggestions(mismatched) {
    return mismatched
        .filter(m => m.backend_path && !m.frontend_path)
        .map(m => `Add backend endpoint: ${m.method} ${m.backend_path}`);
}
/**
 * 生成前端建议
 */
function generateFrontendSuggestions(mismatched) {
    return mismatched
        .filter(m => m.frontend_path && !m.backend_path)
        .map(m => `Frontend calls ${m.method} ${m.frontend_path} - no backend route found`);
}
//# sourceMappingURL=frontend-analyzer.js.map