// ============================================================================
// 类型映射 - Modularity-skill
// ============================================================================

import type { FieldType, Language } from './types.js';

/**
 * 数据库类型到 Python/Pydantic 的映射
 */
export const pythonTypeMap: Record<FieldType, string> = {
  string: 'str',
  text: 'str',
  integer: 'int',
  boolean: 'bool',
  datetime: 'datetime',
  json: 'dict',
  float: 'float',
  uuid: 'UUID',
  email: 'EmailStr',
  url: 'HttpUrl',
};

/**
 * 数据库类型到 TypeScript 的映射
 */
export const typescriptTypeMap: Record<FieldType, string> = {
  string: 'string',
  text: 'string',
  integer: 'number',
  boolean: 'boolean',
  datetime: 'Date',
  json: 'object',
  float: 'number',
  uuid: 'string',
  email: 'string',
  url: 'string',
};

/**
 * 数据库类型到 SQLAlchemy 的映射
 */
export const sqlalchemyTypeMap: Record<FieldType, string> = {
  string: 'String',
  text: 'Text',
  integer: 'Integer',
  boolean: 'Boolean',
  datetime: 'DateTime',
  json: 'JSON',
  float: 'Float',
  uuid: 'UUID',
  email: 'String',
  url: 'String',
};

/**
 * 数据库类型到 MySQL 的映射
 */
export const mysqlTypeMap: Record<FieldType, string> = {
  string: 'VARCHAR(255)',
  text: 'TEXT',
  integer: 'INT',
  boolean: 'TINYINT(1)',
  datetime: 'DATETIME',
  json: 'JSON',
  float: 'FLOAT',
  uuid: 'CHAR(36)',
  email: 'VARCHAR(255)',
  url: 'VARCHAR(500)',
};

/**
 * 获取类型映射
 */
export function getTypeMap(language: Language, dbType?: string): Record<FieldType, string> {
  switch (language) {
    case 'python':
      return pythonTypeMap;
    case 'typescript':
    case 'javascript':
      return typescriptTypeMap;
    default:
      return pythonTypeMap;
  }
}

/**
 * 获取 SQL 类型映射
 */
export function getSqlTypeMap(database: string): Record<FieldType, string> {
  switch (database) {
    case 'mysql':
      return mysqlTypeMap;
    case 'postgresql':
    default:
      return {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INTEGER',
        boolean: 'BOOLEAN',
        datetime: 'TIMESTAMP',
        json: 'JSONB',
        float: 'REAL',
        uuid: 'UUID',
        email: 'VARCHAR(255)',
        url: 'VARCHAR(500)',
      };
  }
}

/**
 * SQLAlchemy 字段类型
 */
export function getSqlAlchemyType(type: FieldType): string {
  return sqlalchemyTypeMap[type] || 'String';
}

/**
 * Python Pydantic 字段类型
 */
export function getPythonType(type: FieldType): string {
  return pythonTypeMap[type] || 'str';
}

/**
 * TypeScript 类型
 */
export function getTypescriptType(type: FieldType): string {
  return typescriptTypeMap[type] || 'string';
}
