import type { FieldType, Language } from './types.js';
/**
 * 数据库类型到 Python/Pydantic 的映射
 */
export declare const pythonTypeMap: Record<FieldType, string>;
/**
 * 数据库类型到 TypeScript 的映射
 */
export declare const typescriptTypeMap: Record<FieldType, string>;
/**
 * 数据库类型到 SQLAlchemy 的映射
 */
export declare const sqlalchemyTypeMap: Record<FieldType, string>;
/**
 * 数据库类型到 MySQL 的映射
 */
export declare const mysqlTypeMap: Record<FieldType, string>;
/**
 * 获取类型映射
 */
export declare function getTypeMap(language: Language, dbType?: string): Record<FieldType, string>;
/**
 * 获取 SQL 类型映射
 */
export declare function getSqlTypeMap(database: string): Record<FieldType, string>;
/**
 * SQLAlchemy 字段类型
 */
export declare function getSqlAlchemyType(type: FieldType): string;
/**
 * Python Pydantic 字段类型
 */
export declare function getPythonType(type: FieldType): string;
/**
 * TypeScript 类型
 */
export declare function getTypescriptType(type: FieldType): string;
//# sourceMappingURL=schema.d.ts.map