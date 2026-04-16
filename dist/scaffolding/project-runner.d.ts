export interface RunOptions {
    projectPath: string;
    skipInstall?: boolean;
    backendOnly?: boolean;
    frontendOnly?: boolean;
}
export interface RunResult {
    success: boolean;
    startedServices: string[];
    errors: string[];
}
/**
 * 项目运行器
 */
export declare class ProjectRunner {
    private options;
    constructor(options: RunOptions);
    /**
     * 启动项目
     */
    run(): Promise<RunResult>;
    /**
     * 安装依赖
     */
    private installDependencies;
    /**
     * 启动数据库
     */
    private startDatabase;
    /**
     * 运行数据库迁移
     */
    private runMigrations;
    /**
     * 启动后端服务
     */
    private startBackend;
    /**
     * 启动前端服务
     */
    private startFrontend;
    /**
     * 等待
     */
    private sleep;
}
/**
 * 便捷函数：运行项目
 */
export declare function runProject(options: RunOptions): Promise<RunResult>;
//# sourceMappingURL=project-runner.d.ts.map