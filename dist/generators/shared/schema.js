// ============================================================================
// 类型映射 - Modularity-skill
// ============================================================================
/**
 * 数据库类型到 Python/Pydantic 的映射
 */
export const pythonTypeMap = {
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
export const typescriptTypeMap = {
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
export const sqlalchemyTypeMap = {
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
export const mysqlTypeMap = {
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
export function getTypeMap(language, dbType) {
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
export function getSqlTypeMap(database) {
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
export function getSqlAlchemyType(type) {
    return sqlalchemyTypeMap[type] || 'String';
}
/**
 * Python Pydantic 字段类型
 */
export function getPythonType(type) {
    return pythonTypeMap[type] || 'str';
}
/**
 * TypeScript 类型
 */
export function getTypescriptType(type) {
    return typescriptTypeMap[type] || 'string';
}
//# sourceMappingURL=schema.js.map