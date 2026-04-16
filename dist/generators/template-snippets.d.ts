/**
 * 模板片段注册表
 */
export declare const TEMPLATE_SNIPPETS: Record<string, string>;
/**
 * 模板片段参数
 */
export interface SnippetParams {
    method_name?: string;
    handler_name?: string;
    hook_name?: string;
    model?: string;
    description?: string;
    params_type?: string;
}
/**
 * 填充模板片段
 */
export declare function fillSnippet(snippetName: string, params: SnippetParams): string;
//# sourceMappingURL=template-snippets.d.ts.map