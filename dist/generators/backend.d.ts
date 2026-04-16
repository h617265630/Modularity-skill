import { FeatureTemplate, TechStack } from '../core/types.js';
export declare class BackendGenerator {
    generate(template: FeatureTemplate, stack: TechStack): Promise<string>;
    private generateModelFile;
    private generateSchemaFile;
    private generateCrudFile;
    private generateRoutesFile;
    private generateServiceFile;
    private generateFieldDef;
    private extractModelName;
    private capitalize;
    private kebabCase;
    private mapTypeToPython;
}
//# sourceMappingURL=backend.d.ts.map