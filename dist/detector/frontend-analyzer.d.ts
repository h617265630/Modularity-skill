import { DetectedFrontendCode, FrontendAnalysisOptions, IntegrationMatchResult } from '../core/types.js';
import { FrontendStructure } from '../core/project-scanner.js';
/**
 * 前端代码分析器
 * 扫描前端代码库，检测特定功能的 hooks/components
 */
export declare class FrontendAnalyzer {
    private projectStructure;
    private options;
    constructor(projectStructure: FrontendStructure, options?: FrontendAnalysisOptions);
    /**
     * 分析特定功能的前端代码
     * @param featureName 功能名称（如 "comments", "posts"）
     * @returns 检测到的前端代码，未找到返回 null
     */
    analyzeFeature(featureName: string): Promise<DetectedFrontendCode | null>;
    /**
     * 扫描 hooks 目录
     */
    private scanHooks;
    /**
     * 扫描 components 目录
     */
    private scanComponents;
    /**
     * 扫描 API services 目录
     */
    private scanApiServices;
    /**
     * 从文件内容中提取 hook 名称
     */
    private extractHookName;
    /**
     * 从文件内容中提取组件名称
     */
    private extractComponentName;
    /**
     * 从 hook 内容中提取 API 端点
     */
    private extractEndpoints;
    /**
     * 提取查询参数
     */
    private extractQueryParams;
    /**
     * 提取请求体类型
     */
    private extractBodyType;
    /**
     * 从 hook 内容中提取 response shape
     */
    private extractResponseShape;
    /**
     * 提取类型字段
     */
    private extractTypeFields;
    /**
     * 查找分页字段
     */
    private findField;
    /**
     * 提取认证头
     */
    private extractAuthHeaders;
    /**
     * 提取 base URL
     */
    private extractBaseUrl;
    /**
     * 提取 service 端点
     */
    private extractServiceEndpoints;
    /**
     * 从函数名推断 HTTP 方法
     */
    private inferMethodFromFuncName;
    /**
     * 提取组件使用的 hooks
     */
    private extractHooksUsed;
    /**
     * 提取 props 类型
     */
    private extractPropsType;
    /**
     * 判断名称是否与功能相关
     */
    private isRelatedToFeature;
    /**
     * 复数化
     */
    private pluralize;
    /**
     * 单数化
     */
    private singularize;
    /**
     * 获取目录下所有 .ts/.tsx 文件
     */
    private getTsTsxFiles;
}
/**
 * 比较检测到的前端代码与模板后端路由，确定集成策略
 */
export declare function matchFrontendToBackend(detected: DetectedFrontendCode, templateRoutes: Array<{
    method: string;
    path: string;
}>): IntegrationMatchResult;
//# sourceMappingURL=frontend-analyzer.d.ts.map