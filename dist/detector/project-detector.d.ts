export interface DetectedProject {
    type: 'fastapi' | 'express' | 'nextjs' | 'nuxt' | 'django' | 'laravel' | 'unknown';
    language: 'python' | 'typescript' | 'javascript' | 'php';
    frontend?: 'react' | 'vue' | 'nextjs' | 'nuxt';
    structure: ProjectStructure;
}
export interface ProjectStructure {
    backend_path?: string;
    frontend_path?: string;
    has_monorepo: boolean;
    package_json?: any;
    pyproject_toml?: any;
    requirements_txt?: string;
}
/**
 * 项目检测器
 */
export declare class ProjectDetector {
    /**
     * 检测项目类型
     */
    detect(cwd?: string): Promise<DetectedProject>;
    /**
     * 分析项目结构
     */
    private analyzeStructure;
    /**
     * 识别项目类型
     */
    private identifyType;
    /**
     * 获取建议的模块安装路径
     */
    getSuggestedPaths(project: DetectedProject): {
        backend: string;
        frontend: string;
    };
}
/**
 * 便捷函数：检测项目
 */
export declare function detectProject(cwd?: string): Promise<DetectedProject>;
//# sourceMappingURL=project-detector.d.ts.map