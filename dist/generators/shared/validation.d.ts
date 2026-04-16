import type { FieldConfig } from './types.js';
/**
 * 生成 Pydantic 验证器
 */
export declare function generatePydanticValidators(field: FieldConfig): string[];
/**
 * 生成 Zod Schema
 */
export declare function generateZodSchema(name: string, fields: FieldConfig[], isUpdate?: boolean): string;
/**
 * 生成 Joi Schema (用于 Express)
 */
export declare function generateJoiSchema(name: string, fields: FieldConfig[], isUpdate?: boolean): string;
/**
 * 生成 Yup Schema
 */
export declare function generateYupSchema(name: string, fields: FieldConfig[], isUpdate?: boolean): string;
//# sourceMappingURL=validation.d.ts.map