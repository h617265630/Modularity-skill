export interface ProjectStructure {
    root: string;
    backend?: BackendStructure;
    frontend?: FrontendStructure;
    database?: DatabaseStructure;
    type: 'mono' | 'separate' | 'frontend-only' | 'backend-only' | 'empty';
}
export interface BackendStructure {
    path: string;
    framework: 'fastapi' | 'express' | 'django' | 'flask' | 'nextjs' | 'unknown';
    language: 'python' | 'javascript' | 'typescript' | 'unknown';
    appDir: string;
    apiDir: string;
    modelsDir: string;
    servicesDir: string;
    schemasDir: string;
    crudsDir: string;
    migrationsDir: string;
    mainFile: string;
}
export interface FrontendStructure {
    path: string;
    framework: 'react' | 'vue' | 'angular' | 'nextjs' | 'unknown';
    language: 'typescript' | 'javascript' | 'unknown';
    srcDir: string;
    componentsDir: string;
    hooksDir: string;
    pagesDir: string;
    apiDir: string;
    servicesDir: string;
}
export interface DatabaseStructure {
    path: string;
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'unknown';
    migrationsDir: string;
}
export declare class ProjectScanner {
    /**
     * 扫描项目结构
     */
    scan(projectPath: string): ProjectStructure;
    /**
     * 扫描后端结构
     */
    private scanBackend;
    /**
     * 扫描前端结构
     */
    private scanFrontend;
    /**
     * 扫描数据库结构
     */
    private scanDatabase;
    /**
     * 检测后端框架
     */
    private detectBackendFramework;
    /**
     * 检测后端语言
     */
    private detectBackendLanguage;
    /**
     * 检测前端框架
     */
    private detectFrontendFramework;
    /**
     * 检测前端语言
     */
    private detectFrontendLanguage;
    /**
     * 检测数据库类型
     */
    private detectDatabaseType;
    /**
     * 确定项目类型
     */
    private determineProjectType;
    /**
     * 查找后端路径
     */
    private findBackendPath;
    /**
     * 查找前端路径
     */
    private findFrontendPath;
    /**
     * 查找数据库路径
     */
    private findDbPath;
    /**
     * 检查目录是否有后端文件
     */
    private hasBackendFiles;
    /**
     * 查找主入口文件
     */
    private findMainFile;
    /**
     * 查找目录
     */
    private findDir;
    /**
     * 获取目录条目
     */
    private getDirEntries;
    /**
     * 读取文件内容（如果存在）
     */
    private readFileIfExists;
}
/**
 * 打印项目结构（调试用）
 */
export declare function printProjectStructure(structure: ProjectStructure): string;
//# sourceMappingURL=project-scanner.d.ts.map