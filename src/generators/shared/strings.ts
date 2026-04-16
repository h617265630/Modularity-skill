// ============================================================================
// 字符串工具函数 - 共享模块
// ============================================================================

/**
 * 转换为 kebab-case
 * Example: UserProfile -> user-profile, userName -> user-name
 */
export function kebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * 转换为 PascalCase
 * Example: user-profile -> UserProfile, user_name -> UserName
 */
export function pascalCase(s: string): string {
  return s
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1$2')
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * 转换为 camelCase
 * Example: user-profile -> userProfile, UserProfile -> userProfile
 */
export function camelCase(s: string): string {
  const pascal = pascalCase(s);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * 转换为 snake_case
 * Example: userProfile -> user_profile, UserProfile -> user_profile
 */
export function snakeCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * 转换为标题形式
 * Example: user-profile -> User Profile
 */
export function titleCase(s: string): string {
  return s
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(/([A-Z])/)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
