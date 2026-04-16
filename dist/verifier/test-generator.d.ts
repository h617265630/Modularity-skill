import { FeatureTemplate } from '../core/types.js';
import { GeneratedCode } from './types.js';
/**
 * 测试代码生成器
 * 为生成的模块代码自动创建测试用例
 */
export declare class TestGenerator {
    /**
     * 生成完整测试代码
     */
    generate(template: FeatureTemplate, code: GeneratedCode): GeneratedCode;
    /**
     * 生成后端测试
     */
    generateBackendTests(template: FeatureTemplate): string;
    /**
     * 生成前端测试
     */
    generateFrontendTests(template: FeatureTemplate): string;
    private generateFileHeader;
    private generateImports;
    private generateFrontendImports;
    private generateRouteTests;
    private generateRouteTest;
    private generateCRUDTests;
    private generateCreateTest;
    private generateReadTest;
    private generateUpdateTest;
    private generateDeleteTest;
    private generateServiceTests;
    private generateComponentTests;
    private generateComponentTest;
    private generateHookTests;
    private generateHookTest;
    private extractModelName;
    private capitalize;
    private toSnakeCase;
    private toKebabCase;
}
//# sourceMappingURL=test-generator.d.ts.map