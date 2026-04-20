import { DetectedFrontendCode } from '../core/types.js';
export interface FileModification {
    file_path: string;
    original_content: string;
    modified_content: string;
    changes: ModificationChange[];
}
export interface ModificationChange {
    type: 'api_endpoint' | 'import' | 'hook_call' | 'adapter_import';
    description: string;
    before: string;
    after: string;
    line_start: number;
    line_end: number;
}
export interface AdapterMapping {
    original_endpoint: string;
    new_endpoint: string;
    adapter_name: string;
}
export declare class CodeModifier {
    private projectPath;
    private adapterMappings;
    constructor(projectPath: string);
    /**
     * 设置适配器映射
     */
    setAdapterMappings(mappings: AdapterMapping[]): void;
    /**
     * 查找需要修改的现有前端文件
     */
    findExistingAuthFiles(): Promise<{
        loginForms: string[];
        registerForms: string[];
        authHooks: string[];
        apiServices: string[];
        navbars: string[];
    }>;
    /**
     * 查找帖子相关的现有前端文件
     */
    findExistingPostFiles(): Promise<{
        postLists: string[];
        postItems: string[];
        postInputs: string[];
        postHooks: string[];
        postApis: string[];
    }>;
    /**
     * 扫描目录查找帖子相关文件
     */
    private scanDirectoryForPosts;
    /**
     * 扫描目录查找认证相关文件
     */
    private scanDirectoryForAuth;
    /**
     * 扫描目录查找认证相关文件
     */
    private scanDirectory;
    /**
     * 修改登录表单文件
     */
    modifyLoginForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    /**
     * 修改注册表单文件
     */
    modifyRegisterForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    /**
     * 修改认证 Hook 文件
     */
    modifyAuthHook(filePath: string, apiEndpoints: {
        login?: string;
        register?: string;
        logout?: string;
        me?: string;
    }): Promise<FileModification | null>;
    /**
     * 修改 API Service 文件
     */
    modifyApiService(filePath: string, newEndpoints: {
        login?: string;
        register?: string;
    }): Promise<FileModification | null>;
    /**
     * 修改导航栏组件 - 添加登录后用户状态显示
     * 将 Login 按钮替换为用户名显示（或下拉菜单）
     */
    modifyNavbar(filePath: string, options: {
        authHookImport?: string;
        userVarName?: string;
    }): Promise<FileModification | null>;
    /**
     * 给导航栏添加用户下拉菜单（当未找到 Login 按钮时）
     */
    private addUserDropdownToNavbar;
    /**
     * 修改帖子列表组件
     */
    modifyPostList(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    /**
     * 修改帖子项组件
     */
    modifyPostItem(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    /**
     * 修改发帖/创建帖子组件
     */
    modifyPostInput(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    /**
     * 修改帖子 Hook 文件
     */
    modifyPostHook(filePath: string, apiEndpoints: {
        list?: string;
        detail?: string;
        create?: string;
        update?: string;
        delete?: string;
    }): Promise<FileModification | null>;
    /**
     * 修改帖子 API Service 文件
     */
    modifyPostApi(filePath: string, newEndpoints: {
        list?: string;
        create?: string;
    }): Promise<FileModification | null>;
    /**
     * 尝试给文件添加 API 端点配置
     */
    private addApiEndpointToFile;
    /**
     * 创建适配器导入注释（当无法直接修改时）
     */
    generateAdapterImportComment(adapterPath: string): string;
    /**
     * 写入修改后的文件
     */
    writeModifiedFile(modification: FileModification): Promise<boolean>;
    /**
     * 生成修改报告
     */
    generateModificationReport(modifications: FileModification[]): string;
}
export declare class AICodeModifier extends CodeModifier {
    private apiEndpoint;
    private moduleName;
    constructor(projectPath: string, apiEndpoint: string, moduleName: string);
    /**
     * 智能修改登录/注册页面
     */
    modifyAuthPages(detected: DetectedFrontendCode): Promise<FileModification[]>;
}
export declare function modifyExistingFrontendCode(projectPath: string, detected: DetectedFrontendCode, apiEndpoints: {
    login?: string;
    register?: string;
    logout?: string;
    me?: string;
}): Promise<FileModification[]>;
export declare function findAndModifyAuthFiles(projectPath: string, apiEndpoints: {
    login: string;
    register: string;
}): Promise<FileModification[]>;
//# sourceMappingURL=code-modifier.d.ts.map