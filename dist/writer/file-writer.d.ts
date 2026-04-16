export interface WriteResult {
    success: boolean;
    files_written: string[];
    files_skipped: string[];
    errors: {
        path: string;
        error: string;
    }[];
}
export interface FilePatch {
    path: string;
    content: string;
    action: 'create' | 'modify' | 'skip';
}
/**
 * 文件写入器
 */
export declare class FileWriter {
    private dryRun;
    private basePath;
    constructor(basePath?: string, dryRun?: boolean);
    /**
     * 设置是否干跑模式
     */
    setDryRun(dryRun: boolean): void;
    /**
     * 写入文件
     */
    write(patches: FilePatch[]): Promise<WriteResult>;
    /**
     * 写入后端代码
     */
    writeBackend(patches: FilePatch[], backendPath?: string): Promise<WriteResult>;
    /**
     * 写入前端代码
     */
    writeFrontend(patches: FilePatch[], frontendPath?: string): Promise<WriteResult>;
    /**
     * 检查是否是受保护路径
     */
    private isProtectedPath;
    /**
     * 预览写入结果（不实际写入）
     */
    preview(patches: FilePatch[]): Promise<WriteResult>;
}
/**
 * 从代码补丁生成文件补丁
 */
export declare function generateFilePatches(code: string, type: 'backend' | 'frontend' | 'database'): FilePatch[];
/**
 * 便捷函数：写入代码
 */
export declare function writeCode(code: string, type: 'backend' | 'frontend' | 'database', basePath?: string, dryRun?: boolean): Promise<WriteResult>;
//# sourceMappingURL=file-writer.d.ts.map