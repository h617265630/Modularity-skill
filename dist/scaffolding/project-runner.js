// ============================================================================
// 项目运行器 - Modularity-skill
// 一键启动项目服务
// ============================================================================
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
const execAsync = promisify(exec);
/**
 * 项目运行器
 */
export class ProjectRunner {
    options;
    constructor(options) {
        this.options = {
            skipInstall: false,
            ...options,
        };
    }
    /**
     * 启动项目
     */
    async run() {
        const result = {
            success: true,
            startedServices: [],
            errors: [],
        };
        console.log('\n🚀 Starting project...\n');
        try {
            // 1. 安装依赖
            if (!this.options.skipInstall) {
                await this.installDependencies();
            }
            // 2. 启动数据库
            await this.startDatabase();
            // 3. 运行迁移
            await this.runMigrations();
            // 4. 启动后端
            if (!this.options.frontendOnly) {
                this.startBackend();
                result.startedServices.push('backend (uvicorn)');
            }
            // 5. 启动前端
            if (!this.options.backendOnly) {
                this.startFrontend();
                result.startedServices.push('frontend (next)');
            }
        }
        catch (error) {
            result.success = false;
            result.errors.push(error.message);
        }
        return result;
    }
    /**
     * 安装依赖
     */
    async installDependencies() {
        const projectPath = this.options.projectPath;
        console.log('📦 Installing dependencies...\n');
        // 安装前端依赖
        const frontendPath = path.join(projectPath, 'frontend');
        if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
            console.log('   Installing frontend dependencies (npm install)...');
            try {
                await execAsync('npm install', {
                    cwd: frontendPath,
                    timeout: 300000,
                });
                console.log('   ✅ Frontend dependencies installed\n');
            }
            catch (error) {
                console.warn(`   ⚠️  Frontend install warning: ${error.message}`);
            }
        }
        // 安装后端依赖
        const backendPath = path.join(projectPath, 'backend');
        if (fs.existsSync(path.join(backendPath, 'requirements.txt'))) {
            console.log('   Installing backend dependencies (pip install)...');
            try {
                await execAsync('pip install -r requirements.txt', {
                    cwd: backendPath,
                    timeout: 300000,
                });
                console.log('   ✅ Backend dependencies installed\n');
            }
            catch (error) {
                console.warn(`   ⚠️  Backend install warning: ${error.message}`);
            }
        }
    }
    /**
     * 启动数据库
     */
    async startDatabase() {
        const projectPath = this.options.projectPath;
        console.log('🗄️  Starting database...\n');
        try {
            // 检查 docker-compose.yml 是否存在
            const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
            if (fs.existsSync(dockerComposePath)) {
                await execAsync('docker-compose up -d db', {
                    cwd: projectPath,
                    timeout: 60000,
                });
                console.log('   ✅ PostgreSQL started\n');
                // 等待数据库就绪
                console.log('   Waiting for database to be ready...');
                await this.sleep(5000);
            }
            else {
                console.warn('   ⚠️  docker-compose.yml not found, skipping database start');
            }
        }
        catch (error) {
            console.warn(`   ⚠️  Could not start database: ${error.message}`);
            console.warn('   Make sure Docker is running and try again.\n');
        }
    }
    /**
     * 运行数据库迁移
     */
    async runMigrations() {
        const projectPath = this.options.projectPath;
        const backendPath = path.join(projectPath, 'backend');
        console.log('🔄 Running database migrations...\n');
        try {
            // 检查 alembic 是否可用
            if (fs.existsSync(path.join(backendPath, 'alembic'))) {
                await execAsync('alembic upgrade head', {
                    cwd: backendPath,
                    timeout: 60000,
                });
                console.log('   ✅ Migrations completed\n');
            }
        }
        catch (error) {
            console.warn(`   ⚠️  Migration warning: ${error.message}`);
            console.warn('   You may need to run migrations manually.\n');
        }
    }
    /**
     * 启动后端服务
     */
    startBackend() {
        const projectPath = this.options.projectPath;
        const backendPath = path.join(projectPath, 'backend');
        console.log('🐍 Starting backend server...');
        console.log('   Command: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\n');
        // 在后台启动后端
        const child = exec('uvicorn app.main:app --reload --host 0.0.0.0 --port 8000', {
            cwd: backendPath,
            env: {
                ...process.env,
                DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
            },
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backend error: ${error.message}`);
            }
        });
        // 设置输出
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                process.stdout.write(`[backend] ${data}`);
            });
        }
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                process.stderr.write(`[backend] ${data}`);
            });
        }
    }
    /**
     * 启动前端服务
     */
    startFrontend() {
        const projectPath = this.options.projectPath;
        const frontendPath = path.join(projectPath, 'frontend');
        console.log('📱 Starting frontend server...');
        console.log('   Command: cd frontend && npm run dev\n');
        // 在后台启动前端
        const child = exec('npm run dev', {
            cwd: frontendPath,
            env: {
                ...process.env,
                PORT: '3000',
            },
        });
        // 设置输出
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                process.stdout.write(`[frontend] ${data}`);
            });
        }
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                process.stderr.write(`[frontend] ${data}`);
            });
        }
    }
    /**
     * 等待
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * 便捷函数：运行项目
 */
export async function runProject(options) {
    const runner = new ProjectRunner(options);
    return runner.run();
}
//# sourceMappingURL=project-runner.js.map