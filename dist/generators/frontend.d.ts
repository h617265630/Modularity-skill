import { FeatureTemplate, TechStack } from '../core/types.js';
import { BaseGenerator } from './base-generator.js';
export declare class FrontendGenerator extends BaseGenerator {
    private aiGenerator;
    constructor(options?: any);
    generate(template: FeatureTemplate, stack: TechStack): Promise<string>;
    private generateComponentFile;
    private generateHookFile;
    private generateApiServiceFile;
    private generatePageFile;
}
//# sourceMappingURL=frontend.d.ts.map