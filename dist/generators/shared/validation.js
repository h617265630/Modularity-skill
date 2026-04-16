// ============================================================================
// 验证规则生成器 - Modularity-skill
// ============================================================================
import { getTypescriptType } from './schema.js';
/**
 * 生成 Pydantic 验证器
 */
export function generatePydanticValidators(field) {
    const validators = [];
    if (!field.nullable && field.type !== 'boolean') {
        validators.push(`Field(...)`);
    }
    if (field.validation) {
        for (const rule of field.validation) {
            switch (rule.type) {
                case 'min':
                    if (field.type === 'string' || field.type === 'text') {
                        validators.push(`String min_length=${rule.value}`);
                    }
                    else if (field.type === 'integer' || field.type === 'float') {
                        validators.push(`Field ge=${rule.value}`);
                    }
                    break;
                case 'max':
                    if (field.type === 'string' || field.type === 'text') {
                        validators.push(`String max_length=${rule.value}`);
                    }
                    else if (field.type === 'integer' || field.type === 'float') {
                        validators.push(`Field le=${rule.value}`);
                    }
                    break;
                case 'pattern':
                    validators.push(`Field(regex=r"${rule.value}")`);
                    break;
                case 'email':
                    validators.push(`EmailStr`);
                    break;
                case 'url':
                    validators.push(`HttpUrl`);
                    break;
            }
        }
    }
    return validators;
}
/**
 * 生成 Zod Schema
 */
export function generateZodSchema(name, fields, isUpdate = false) {
    const lines = [];
    lines.push(`import { z } from 'zod';`);
    lines.push('');
    lines.push(`export const ${name}Schema = z.object({`);
    for (const field of fields) {
        const tsType = getTypescriptType(field.type);
        let fieldSchema = tsType;
        if (field.nullable) {
            fieldSchema = `${tsType} | null`;
        }
        else if (!isUpdate) {
            fieldSchema = tsType;
        }
        if (field.validation) {
            for (const rule of field.validation) {
                switch (rule.type) {
                    case 'min':
                        if (field.type === 'string' || field.type === 'text') {
                            fieldSchema += `.min(${rule.value})`;
                        }
                        break;
                    case 'max':
                        if (field.type === 'string' || field.type === 'text') {
                            fieldSchema += `.max(${rule.value})`;
                        }
                        break;
                    case 'email':
                        fieldSchema = 'z.string().email()';
                        break;
                    case 'url':
                        fieldSchema = 'z.string().url()';
                        break;
                }
            }
        }
        const optional = field.nullable || isUpdate ? '?' : '';
        lines.push(`  ${field.name}${optional}: ${fieldSchema},`);
    }
    lines.push(`});`);
    lines.push('');
    lines.push(`export type ${name} = z.infer<typeof ${name}Schema>;`);
    return lines.join('\n');
}
/**
 * 生成 Joi Schema (用于 Express)
 */
export function generateJoiSchema(name, fields, isUpdate = false) {
    const lines = [];
    lines.push(`const Joi = require('joi');`);
    lines.push('');
    lines.push(`const ${name}Schema = Joi.object({`);
    for (const field of fields) {
        let fieldSchema = 'Joi';
        switch (field.type) {
            case 'string':
            case 'email':
            case 'url':
                fieldSchema = 'Joi.string()';
                break;
            case 'text':
                fieldSchema = 'Joi.string()';
                break;
            case 'integer':
                fieldSchema = 'Joi.number().integer()';
                break;
            case 'float':
                fieldSchema = 'Joi.number()';
                break;
            case 'boolean':
                fieldSchema = 'Joi.boolean()';
                break;
            case 'datetime':
                fieldSchema = 'Joi.date()';
                break;
            default:
                fieldSchema = 'Joi.any()';
        }
        if (field.validation) {
            for (const rule of field.validation) {
                switch (rule.type) {
                    case 'min':
                        fieldSchema += `.min(${rule.value})`;
                        break;
                    case 'max':
                        fieldSchema += `.max(${rule.value})`;
                        break;
                    case 'email':
                        fieldSchema = 'Joi.string().email()';
                        break;
                    case 'url':
                        fieldSchema = 'Joi.string().uri()';
                        break;
                }
            }
        }
        if (field.nullable) {
            fieldSchema += '.allow(null)';
        }
        const required = field.nullable || isUpdate ? '' : '.required()';
        lines.push(`  ${field.name}: ${fieldSchema}${required},`);
    }
    lines.push(`});`);
    return lines.join('\n');
}
/**
 * 生成 Yup Schema
 */
export function generateYupSchema(name, fields, isUpdate = false) {
    const lines = [];
    lines.push(`import * as Yup from 'yup';`);
    lines.push('');
    lines.push(`export const ${name}Schema = Yup.object({`);
    for (const field of fields) {
        let fieldSchema = 'Yup';
        switch (field.type) {
            case 'string':
            case 'email':
            case 'url':
                fieldSchema = 'Yup.string()';
                break;
            case 'text':
                fieldSchema = 'Yup.string()';
                break;
            case 'integer':
            case 'float':
                fieldSchema = 'Yup.number()';
                break;
            case 'boolean':
                fieldSchema = 'Yup.boolean()';
                break;
            case 'datetime':
                fieldSchema = 'Yup.date()';
                break;
            default:
                fieldSchema = 'Yup.mixed()';
        }
        if (field.validation) {
            for (const rule of field.validation) {
                switch (rule.type) {
                    case 'min':
                        fieldSchema += `.min(${rule.value})`;
                        break;
                    case 'max':
                        fieldSchema += `.max(${rule.value})`;
                        break;
                    case 'email':
                        fieldSchema = 'Yup.string().email()';
                        break;
                    case 'url':
                        fieldSchema = 'Yup.string().url()';
                        break;
                }
            }
        }
        if (field.nullable) {
            fieldSchema += '.nullable()';
        }
        const required = field.nullable || isUpdate ? '' : '.required()';
        lines.push(`  ${field.name}: ${fieldSchema}${required},`);
    }
    lines.push(`});`);
    return lines.join('\n');
}
//# sourceMappingURL=validation.js.map