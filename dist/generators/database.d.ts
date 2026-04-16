import { FeatureTemplate, TechStack } from '../core/types.js';
/**
 * 数据库代码生成器
 * 根据 FeatureTemplate 生成完整的数据库迁移和 schema 代码
 */
export declare class DatabaseGenerator {
    /**
     * 生成数据库代码
     */
    generate(template: FeatureTemplate, stack: TechStack): Promise<string>;
    private generateFileHeader;
    private generateMigrations;
    private generateTableMigration;
    private generateAlembicMigration;
    private generateSQLSchema;
    private generateTableSchema;
    private fieldTypeToSQL;
    private saType;
    private generateRevisionId;
}
//# sourceMappingURL=database.d.ts.map