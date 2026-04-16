export interface ScaffoldOptions {
    projectName: string;
    projectPath: string;
    frontend?: 'nextjs' | 'react' | 'vue';
    backend?: 'fastapi' | 'express';
    database?: 'postgresql' | 'mysql' | 'sqlite';
    uiLibrary?: 'shadcn' | 'tailwind';
}
/**
 * 项目脚手架生成器
 */
export declare class ProjectScaffolder {
    private options;
    constructor(options: ScaffoldOptions);
    /**
     * 创建完整项目
     */
    scaffold(): Promise<void>;
    /**
     * 创建目录结构
     */
    private createDirectoryStructure;
    /**
     * 确保文件目录存在
     */
    private ensureDir;
    /**
     * 创建前端项目 (Next.js + shadcn/ui)
     */
    private scaffoldFrontend;
    /**
     * 创建后端项目 (FastAPI + PostgreSQL)
     */
    private scaffoldBackend;
    /**
     * 创建基础页面
     */
    private createBasePages;
    /**
     * 创建用户管理模块
     */
    private createUserManagement;
    /**
     * 创建数据库配置
     */
    private createDatabaseConfig;
    /**
     * 创建 docker-compose
     */
    private createDockerCompose;
}
/**
 * 便捷函数：创建新项目
 */
export declare function scaffoldProject(options: ScaffoldOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map