/**
 * shadcn/ui 组件注册表
 */
export declare const SHADCN_COMPONENTS: string[];
/**
 * 模块需要的组件映射
 */
export declare const MODULE_SHADCN_REQUIREMENTS: Record<string, string[]>;
/**
 * 检测项目是否使用 shadcn/ui
 */
export declare function detectShadcn(projectPath: string): Promise<boolean>;
/**
 * 获取项目已安装的 shadcn/ui 组件
 */
export declare function getInstalledComponents(projectPath: string): Promise<string[]>;
/**
 * 获取模块需要的 shadcn/ui 组件
 */
export declare function getComponentsForModule(moduleName: string): string[];
/**
 * 计算需要添加的组件（差集）
 */
export declare function getMissingComponents(projectPath: string, moduleName: string): Promise<string[]>;
/**
 * 安装 shadcn/ui 组件
 */
export declare function installShadcnComponents(projectPath: string, components: string[]): Promise<void>;
/**
 * 检测并安装模块需要的 shadcn/ui 组件
 */
export declare function ensureShadcnComponents(projectPath: string, moduleName: string): Promise<void>;
/**
 * 生成 shadcn/ui 组件导入代码
 */
export declare function generateShadcnImports(components: string[]): string;
//# sourceMappingURL=shadcn.d.ts.map