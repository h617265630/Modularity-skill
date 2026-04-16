import { FeatureTemplate, TechStack } from '../core/types.js';
export declare class FrontendGenerator {
    generate(template: FeatureTemplate, stack: TechStack): Promise<string>;
    private generateComponentFile;
    private generateHookFile;
    private generateApiServiceFile;
    private generatePageFile;
    private pascalCase;
    private kebabCase;
}
//# sourceMappingURL=frontend.d.ts.map