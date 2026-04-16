import { FeatureTemplate } from '../core/types.js';
/**
 * 根据命令获取功能模板
 */
export declare function getTemplate(command: string): Promise<FeatureTemplate | null>;
/**
 * 获取所有模板
 */
export declare function getAllTemplates(): Record<string, string>;
/**
 * 获取所有支持的命令
 */
export declare function getSupportedCommands(): string[];
//# sourceMappingURL=index.d.ts.map