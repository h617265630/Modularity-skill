import { FeatureTemplate, TechStack } from '../core/types.js';
import { BaseGenerator } from './base-generator.js';
export declare class BackendGenerator extends BaseGenerator {
    private aiGenerator;
    constructor(options?: any);
    generate(template: FeatureTemplate, stack: TechStack): Promise<string>;
    private generateModelFile;
    private generateSchemaFile;
    private generateCrudFile;
    private generateRoutesFile;
    private generateServiceFile;
    private generateServiceMethod;
    private generateFieldDef;
    private extractModelName;
    private mapTypeToPython;
}
//# sourceMappingURL=backend.d.ts.map