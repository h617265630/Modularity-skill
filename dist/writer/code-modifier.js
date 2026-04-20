// ============================================================================
// Code Modifier - Modularity-skill
// 修改现有前端文件以对接新的后端 API
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
// ============================================================================
// Pattern definitions for detecting login/register code
// ============================================================================
const LOGIN_PATTERNS = [
    /login/i,
    /signin/i,
    /log-in/i,
    /sign-in/i,
];
const REGISTER_PATTERNS = [
    /register/i,
    /signup/i,
    /sign-up/i,
    /create.*account/i,
];
const AUTH_HOOK_PATTERNS = [
    /useAuth/,
    /useLogin/,
    /useRegister/,
    /useSignin/,
    /useSignup/,
];
const API_SERVICE_PATTERNS = [
    /api\/auth/,
    /api\/login/,
    /api\/register/,
    /auth\/login/,
    /auth\/register/,
];
// Navbar 导航栏模式
const NAVBAR_PATTERNS = [
    /navbar/i,
    /nav/i,
    /header/i,
    /menu/i,
    /navigation/i,
];
const USER_DROPDOWN_PATTERNS = [
    /user/i,
    /avatar/i,
    /profile/i,
    /account/i,
];
// ============================================================================
// Post 模块模式定义
// ============================================================================
const POST_LIST_PATTERNS = [
    /postlist/i,
    /post-list/i,
    /posts/i,
    /feed/i,
    /timeline/i,
];
const POST_ITEM_PATTERNS = [
    /postitem/i,
    /post-item/i,
    /postcard/i,
    /post-card/i,
];
const POST_INPUT_PATTERNS = [
    /postinput/i,
    /post-input/i,
    /createpost/i,
    /create-post/i,
    /newpost/i,
    /new-post/i,
    /compose/i,
];
const POST_HOOK_PATTERNS = [
    /usePost/,
    /usePosts/,
    /useFeed/,
    /useTimeline/,
];
const POST_API_PATTERNS = [
    /api\/posts/,
    /api\/post/,
    /posts\/create/,
    /post\/create/,
];
// ============================================================================
// Code Modifier
// ============================================================================
export class CodeModifier {
    projectPath;
    adapterMappings = [];
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /**
     * 设置适配器映射
     */
    setAdapterMappings(mappings) {
        this.adapterMappings = mappings;
    }
    /**
     * 查找需要修改的现有前端文件
     */
    async findExistingAuthFiles() {
        const result = {
            loginForms: [],
            registerForms: [],
            authHooks: [],
            apiServices: [],
            navbars: [],
        };
        // Common frontend directories to search
        const searchDirs = [
            path.join(this.projectPath, 'src'),
            path.join(this.projectPath, 'frontend', 'src'),
            path.join(this.projectPath, 'app'),
        ].filter(d => fs.existsSync(d));
        for (const dir of searchDirs) {
            await this.scanDirectoryForAuth(dir, result);
        }
        return result;
    }
    /**
     * 查找帖子相关的现有前端文件
     */
    async findExistingPostFiles() {
        const result = {
            postLists: [],
            postItems: [],
            postInputs: [],
            postHooks: [],
            postApis: [],
        };
        // Common frontend directories to search
        const searchDirs = [
            path.join(this.projectPath, 'src'),
            path.join(this.projectPath, 'frontend', 'src'),
            path.join(this.projectPath, 'app'),
        ].filter(d => fs.existsSync(d));
        for (const dir of searchDirs) {
            await this.scanDirectoryForPosts(dir, result);
        }
        return result;
    }
    /**
     * 扫描目录查找帖子相关文件
     */
    async scanDirectoryForPosts(dir, result) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                    await this.scanDirectoryForPosts(fullPath, result);
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                const baseName = entry.name.toLowerCase();
                if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
                    if (POST_LIST_PATTERNS.some(p => p.test(baseName))) {
                        result.postLists.push(fullPath);
                    }
                    if (POST_ITEM_PATTERNS.some(p => p.test(baseName))) {
                        result.postItems.push(fullPath);
                    }
                    if (POST_INPUT_PATTERNS.some(p => p.test(baseName))) {
                        result.postInputs.push(fullPath);
                    }
                    if (POST_HOOK_PATTERNS.some(p => p.test(baseName))) {
                        result.postHooks.push(fullPath);
                    }
                    if (POST_API_PATTERNS.some(p => p.test(baseName))) {
                        result.postApis.push(fullPath);
                    }
                }
            }
        }
    }
    /**
     * 扫描目录查找认证相关文件
     */
    async scanDirectoryForAuth(dir, result) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                    await this.scanDirectoryForAuth(fullPath, result);
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                const baseName = entry.name.toLowerCase();
                if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
                    if (LOGIN_PATTERNS.some(p => p.test(baseName))) {
                        result.loginForms.push(fullPath);
                    }
                    if (REGISTER_PATTERNS.some(p => p.test(baseName))) {
                        result.registerForms.push(fullPath);
                    }
                    if (AUTH_HOOK_PATTERNS.some(p => p.test(baseName))) {
                        result.authHooks.push(fullPath);
                    }
                    if (API_SERVICE_PATTERNS.some(p => p.test(baseName))) {
                        result.apiServices.push(fullPath);
                    }
                    if (NAVBAR_PATTERNS.some(p => p.test(baseName))) {
                        result.navbars.push(fullPath);
                    }
                }
            }
        }
    }
    /**
     * 扫描目录查找认证相关文件
     */
    async scanDirectory(dir, result) {
        if (!fs.existsSync(dir))
            return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Skip common non-source directories
                if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                    await this.scanDirectory(fullPath, result);
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                const baseName = entry.name.toLowerCase();
                // Detect file type based on name patterns
                if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
                    if (LOGIN_PATTERNS.some(p => p.test(baseName))) {
                        result.loginForms.push(fullPath);
                    }
                    if (REGISTER_PATTERNS.some(p => p.test(baseName))) {
                        result.registerForms.push(fullPath);
                    }
                    if (AUTH_HOOK_PATTERNS.some(p => p.test(baseName))) {
                        result.authHooks.push(fullPath);
                    }
                    if (API_SERVICE_PATTERNS.some(p => p.test(baseName))) {
                        result.apiServices.push(fullPath);
                    }
                    if (NAVBAR_PATTERNS.some(p => p.test(baseName))) {
                        result.navbars.push(fullPath);
                    }
                }
            }
        }
    }
    /**
     * 修改登录表单文件
     */
    async modifyLoginForm(filePath, newApiEndpoint) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace hardcoded API URLs
            const apiUrlPattern = /(?:axios|fetch|api)\s*\.\s*(?:post|get|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let match;
            while ((match = apiUrlPattern.exec(line)) !== null) {
                const oldUrl = match[1];
                if (oldUrl.includes('login') || oldUrl.includes('auth')) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace login API URL`,
                        before: oldUrl,
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(oldUrl, newApiEndpoint);
                    modified = true;
                }
            }
            // Pattern 2: Replace useAuth hook calls
            if (/useAuth\s*\(/.test(line)) {
                // Check if it has login endpoint config
                const endpointMatch = line.match(/endpoint\s*:\s*['"`]([^'"`]+)['"`]/);
                if (endpointMatch && (endpointMatch[1].includes('login') || endpointMatch[1].includes('auth'))) {
                    changes.push({
                        type: 'hook_call',
                        description: `Update useAuth login endpoint`,
                        before: endpointMatch[1],
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(endpointMatch[1], newApiEndpoint);
                    modified = true;
                }
            }
            // Pattern 3: Replace API base URL imports
            const importPattern = /from\s+['"`]([^'"`]*(?:auth|api)[^'"`]*)['"`]/;
            const importMatch = line.match(importPattern);
            if (importMatch && this.adapterMappings.length > 0) {
                const adapter = this.adapterMappings.find(m => m.original_endpoint.includes(importMatch[1]) ||
                    importMatch[1].includes(m.original_endpoint));
                if (adapter) {
                    changes.push({
                        type: 'import',
                        description: `Replace auth API import`,
                        before: importMatch[1],
                        after: adapter.adapter_name,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(importMatch[1], adapter.adapter_name);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            // Try to add API endpoint at the top if no changes made
            return this.addApiEndpointToFile(filePath, newApiEndpoint, 'login');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改注册表单文件
     */
    async modifyRegisterForm(filePath, newApiEndpoint) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern: Replace hardcoded API URLs
            const apiUrlPattern = /(?:axios|fetch|api)\s*\.\s*(?:post|get|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let match;
            while ((match = apiUrlPattern.exec(line)) !== null) {
                const oldUrl = match[1];
                if (oldUrl.includes('register') || oldUrl.includes('signup') || oldUrl.includes('auth')) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace register API URL`,
                        before: oldUrl,
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(oldUrl, newApiEndpoint);
                    modified = true;
                }
            }
            // Pattern: Replace useRegister hook calls
            if (/useRegister\s*\(/.test(line) || /useSignup\s*\(/.test(line)) {
                const endpointMatch = line.match(/endpoint\s*:\s*['"`]([^'"`]+)['"`]/);
                if (endpointMatch) {
                    changes.push({
                        type: 'hook_call',
                        description: `Update register endpoint`,
                        before: endpointMatch[1],
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(endpointMatch[1], newApiEndpoint);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return this.addApiEndpointToFile(filePath, newApiEndpoint, 'register');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改认证 Hook 文件
     */
    async modifyAuthHook(filePath, apiEndpoints) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace base URL
            const baseUrlMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
            if (baseUrlMatch) {
                const oldUrl = baseUrlMatch[1];
                changes.push({
                    type: 'api_endpoint',
                    description: `Replace API base URL`,
                    before: oldUrl,
                    after: '/api',
                    line_start: lineNum,
                    line_end: lineNum,
                });
                line = line.replace(oldUrl, '/api');
                modified = true;
            }
            // Pattern 2: Replace login endpoint
            if (apiEndpoints.login) {
                const loginPattern = /['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/g;
                let match;
                while ((match = loginPattern.exec(line)) !== null) {
                    if (match[1].includes('login') || match[1].includes('signin')) {
                        changes.push({
                            type: 'api_endpoint',
                            description: `Replace login endpoint`,
                            before: match[1],
                            after: apiEndpoints.login,
                            line_start: lineNum,
                            line_end: lineNum,
                        });
                        line = line.replace(match[1], apiEndpoints.login);
                        modified = true;
                    }
                }
            }
            // Pattern 3: Replace register endpoint
            if (apiEndpoints.register) {
                const registerPattern = /['"`]([^'"`]*(?:register|signup|sign-up)[^'"`]*)['"`]/g;
                let match;
                while ((match = registerPattern.exec(line)) !== null) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace register endpoint`,
                        before: match[1],
                        after: apiEndpoints.register,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(match[1], apiEndpoints.register);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            // Try to update the return URL or endpoint config
            return this.addApiEndpointToFile(filePath, apiEndpoints.login || apiEndpoints.register || '/api/users/login', 'auth');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改 API Service 文件
     */
    async modifyApiService(filePath, newEndpoints) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace baseURL
            const baseUrlMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
            if (baseUrlMatch) {
                changes.push({
                    type: 'api_endpoint',
                    description: `Replace API base URL`,
                    before: baseUrlMatch[1],
                    after: '/api',
                    line_start: lineNum,
                    line_end: lineNum,
                });
                line = line.replace(baseUrlMatch[1], '/api');
                modified = true;
            }
            // Pattern 2: Replace endpoint paths in function calls
            if (newEndpoints.login && /['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/.test(line)) {
                const match = line.match(/['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/);
                if (match) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace login path`,
                        before: match[1],
                        after: newEndpoints.login,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(match[1], newEndpoints.login);
                    modified = true;
                }
            }
            if (newEndpoints.register && /['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/.test(line)) {
                const match = line.match(/['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/);
                if (match) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace register path`,
                        before: match[1],
                        after: newEndpoints.register,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(match[1], newEndpoints.register);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return null;
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改导航栏组件 - 添加登录后用户状态显示
     * 将 Login 按钮替换为用户名显示（或下拉菜单）
     */
    async modifyNavbar(filePath, options) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        // 检查是否已经包含用户状态逻辑
        if (/isLoggedIn|isAuthenticated|user\.|currentUser/.test(content)) {
            // 已经有用户状态，检查是否需要更新 hook 名称
            return null;
        }
        const changes = [];
        const lines = content.split('\n');
        const newLines = [...lines];
        // 1. 添加 useAuth hook 导入（如果没有）
        const hasUseAuthImport = /import\s+.*useAuth.*from/.test(content);
        if (!hasUseAuthImport && options.authHookImport) {
            // 找到最后一个 import 语句，在其后添加
            let lastImportIndex = -1;
            for (let i = 0; i < newLines.length; i++) {
                if (newLines[i].trim().startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            if (lastImportIndex >= 0) {
                newLines.splice(lastImportIndex + 1, 0, `import { useAuth } from '${options.authHookImport}';`);
                changes.push({
                    type: 'import',
                    description: 'Added useAuth hook import for user state',
                    before: '',
                    after: `import { useAuth } from '${options.authHookImport}';`,
                    line_start: lastImportIndex + 2,
                    line_end: lastImportIndex + 2,
                });
            }
        }
        // 2. 查找 Login 按钮并替换为用户状态显示
        let modified = false;
        const modifiedContent = newLines.join('\n');
        // 查找包含 Login 按钮的代码块
        const loginButtonPattern = /(<button[^>]*>.*?Login.*?<\/button>)|(<a[^>]*>.*?Login.*?<\/a>)|(\{[^}]*Login[^}]*\})/gi;
        if (loginButtonPattern.test(modifiedContent)) {
            // 替换策略：在 Login 按钮外层包条件渲染
            const replacedContent = modifiedContent.replace(loginButtonPattern, (match) => {
                // 如果已经有条件渲染，不替换
                if (match.includes('?') || match.includes('{')) {
                    return match;
                }
                return `{user ? (${match}) : null}`;
            });
            if (replacedContent !== modifiedContent) {
                changes.push({
                    type: 'hook_call',
                    description: 'Added conditional rendering for Login button (show when logged out)',
                    before: 'Login button',
                    after: '{user ? (Login button) : null}',
                    line_start: 1,
                    line_end: 1,
                });
                modified = true;
                // 3. 添加 user 变量解构（如果组件使用了 useAuth）
                const componentMatch = replacedContent.match(/(?:const|function)\s+(\w+)(?:Component)?\s*[=(]/);
                const varName = options.userVarName || 'user';
                // 在 useAuth 调用后添加 user 解构
                const useAuthPattern = /(const\s+\w+\s*=\s*useAuth\s*\(\s*\))/;
                if (useAuthPattern.test(replacedContent)) {
                    const finalContent = replacedContent.replace(useAuthPattern, (match) => {
                        const hookVarMatch = match.match(/const\s+(\w+)/);
                        const hookVar = hookVarMatch ? hookVarMatch[1] : 'auth';
                        return `const { ${varName} } = ${hookVar}`;
                    });
                    return {
                        file_path: filePath,
                        original_content: content,
                        modified_content: finalContent,
                        changes,
                    };
                }
                return {
                    file_path: filePath,
                    original_content: content,
                    modified_content: replacedContent,
                    changes,
                };
            }
        }
        // 如果没找到 Login 按钮，尝试添加用户下拉菜单
        if (!modified) {
            return this.addUserDropdownToNavbar(filePath);
        }
        return null;
    }
    /**
     * 给导航栏添加用户下拉菜单（当未找到 Login 按钮时）
     */
    async addUserDropdownToNavbar(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        // 查找导航栏组件的结束位置（</nav>, </header>, </div>）
        let insertIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line === '</nav>' || line === '</header>' || (line.startsWith('</') && line.includes('Nav'))) {
                insertIndex = i;
                break;
            }
        }
        if (insertIndex < 0) {
            // 找不到合适的插入点
            insertIndex = Math.floor(lines.length / 2);
        }
        const userDropdownCode = `
    {user && (
      <div className="user-menu">
        <span className="username">{user.username || user.name || 'User'}</span>
        <button onClick={logout}>Logout</button>
      </div>
    )}
`;
        lines.splice(insertIndex, 0, userDropdownCode);
        changes.push({
            type: 'hook_call',
            description: 'Added user dropdown menu for logged-in state',
            before: '',
            after: userDropdownCode,
            line_start: insertIndex + 1,
            line_end: insertIndex + userDropdownCode.split('\n').length,
        });
        return {
            file_path: filePath,
            original_content: content,
            modified_content: lines.join('\n'),
            changes,
        };
    }
    // ============================================================================
    // Post 模块修改方法
    // ============================================================================
    /**
     * 修改帖子列表组件
     */
    async modifyPostList(filePath, newApiEndpoint) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace hardcoded API URLs
            const apiUrlPattern = /(?:axios|fetch|api)\s*\.\s*(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let match;
            while ((match = apiUrlPattern.exec(line)) !== null) {
                const oldUrl = match[1];
                if (oldUrl.includes('post') || oldUrl.includes('feed')) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace post list API URL`,
                        before: oldUrl,
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(oldUrl, newApiEndpoint);
                    modified = true;
                }
            }
            // Pattern 2: Replace usePosts hook calls
            if (/usePosts\s*\(/.test(line)) {
                const endpointMatch = line.match(/endpoint\s*:\s*['"`]([^'"`]+)['"`]/);
                if (endpointMatch && (endpointMatch[1].includes('post') || endpointMatch[1].includes('feed'))) {
                    changes.push({
                        type: 'hook_call',
                        description: `Update usePosts endpoint`,
                        before: endpointMatch[1],
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(endpointMatch[1], newApiEndpoint);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return this.addApiEndpointToFile(filePath, newApiEndpoint, 'posts');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改帖子项组件
     */
    async modifyPostItem(filePath, newApiEndpoint) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern: Replace hardcoded API URLs for single post
            const apiUrlPattern = /(?:axios|fetch|api)\s*\.\s*(?:get|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let match;
            while ((match = apiUrlPattern.exec(line)) !== null) {
                const oldUrl = match[1];
                if (oldUrl.includes('post')) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace post item API URL`,
                        before: oldUrl,
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(oldUrl, newApiEndpoint);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return this.addApiEndpointToFile(filePath, newApiEndpoint, 'post');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改发帖/创建帖子组件
     */
    async modifyPostInput(filePath, newApiEndpoint) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern: Replace hardcoded API URLs for creating posts
            const apiUrlPattern = /(?:axios|fetch|api)\s*\.\s*post\s*\(\s*['"`]([^'"`]+)['"`]/g;
            let match;
            while ((match = apiUrlPattern.exec(line)) !== null) {
                const oldUrl = match[1];
                if (oldUrl.includes('post') || oldUrl.includes('create') || oldUrl.includes('compose')) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace create post API URL`,
                        before: oldUrl,
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(oldUrl, newApiEndpoint);
                    modified = true;
                }
            }
            // Pattern: Replace useCreatePost hook calls
            if (/useCreatePost\s*\(/.test(line) || /usePost\s*\(/.test(line)) {
                const endpointMatch = line.match(/endpoint\s*:\s*['"`]([^'"`]+)['"`]/);
                if (endpointMatch) {
                    changes.push({
                        type: 'hook_call',
                        description: `Update create post endpoint`,
                        before: endpointMatch[1],
                        after: newApiEndpoint,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(endpointMatch[1], newApiEndpoint);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return this.addApiEndpointToFile(filePath, newApiEndpoint, 'createPost');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改帖子 Hook 文件
     */
    async modifyPostHook(filePath, apiEndpoints) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace base URL
            const baseUrlMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
            if (baseUrlMatch) {
                const oldUrl = baseUrlMatch[1];
                changes.push({
                    type: 'api_endpoint',
                    description: `Replace API base URL`,
                    before: oldUrl,
                    after: '/api',
                    line_start: lineNum,
                    line_end: lineNum,
                });
                line = line.replace(oldUrl, '/api');
                modified = true;
            }
            // Pattern 2: Replace post endpoint paths
            const postPatterns = [
                { pattern: /['"`]([^'"`]*(?:posts|post\/list)[^'"`]*)['"`]/g, endpoint: apiEndpoints.list },
                { pattern: /['"`]([^'"`]*(?:post\/\d|post\/detail)[^'"`]*)['"`]/g, endpoint: apiEndpoints.detail },
                { pattern: /['"`]([^'"`]*(?:post\/create|posts\/create|create\/post)[^'"`]*)['"`]/g, endpoint: apiEndpoints.create },
                { pattern: /['"`]([^'"`]*(?:post\/update|post\/\d+\/edit)[^'"`]*)['"`]/g, endpoint: apiEndpoints.update },
                { pattern: /['"`]([^'"`]*(?:post\/delete|post\/\d+\/remove)[^'"`]*)['"`]/g, endpoint: apiEndpoints.delete },
            ];
            for (const { pattern, endpoint } of postPatterns) {
                if (endpoint) {
                    let match;
                    while ((match = pattern.exec(line)) !== null) {
                        changes.push({
                            type: 'api_endpoint',
                            description: `Replace post API path`,
                            before: match[1],
                            after: endpoint,
                            line_start: lineNum,
                            line_end: lineNum,
                        });
                        line = line.replace(match[1], endpoint);
                        modified = true;
                    }
                }
            }
            return line;
        });
        if (!modified) {
            return this.addApiEndpointToFile(filePath, apiEndpoints.list || '/api/posts', 'posts');
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 修改帖子 API Service 文件
     */
    async modifyPostApi(filePath, newEndpoints) {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        let modified = false;
        const newLines = lines.map((line, index) => {
            const lineNum = index + 1;
            // Pattern 1: Replace baseURL
            const baseUrlMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
            if (baseUrlMatch) {
                changes.push({
                    type: 'api_endpoint',
                    description: `Replace API base URL`,
                    before: baseUrlMatch[1],
                    after: '/api',
                    line_start: lineNum,
                    line_end: lineNum,
                });
                line = line.replace(baseUrlMatch[1], '/api');
                modified = true;
            }
            // Pattern 2: Replace endpoint paths
            if (newEndpoints.list && /['"`]([^'"`]*(?:posts|post-list)[^'"`]*)['"`]/.test(line)) {
                const match = line.match(/['"`]([^'"`]*(?:posts|post-list)[^'"`]*)['"`]/);
                if (match) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace posts list path`,
                        before: match[1],
                        after: newEndpoints.list,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(match[1], newEndpoints.list);
                    modified = true;
                }
            }
            if (newEndpoints.create && /['"`]([^'"`]*(?:create-post|post\/create)[^'"`]*)['"`]/.test(line)) {
                const match = line.match(/['"`]([^'"`]*(?:create-post|post\/create)[^'"`]*)['"`]/);
                if (match) {
                    changes.push({
                        type: 'api_endpoint',
                        description: `Replace create post path`,
                        before: match[1],
                        after: newEndpoints.create,
                        line_start: lineNum,
                        line_end: lineNum,
                    });
                    line = line.replace(match[1], newEndpoints.create);
                    modified = true;
                }
            }
            return line;
        });
        if (!modified) {
            return null;
        }
        return {
            file_path: filePath,
            original_content: content,
            modified_content: newLines.join('\n'),
            changes,
        };
    }
    /**
     * 尝试给文件添加 API 端点配置
     */
    async addApiEndpointToFile(filePath, endpoint, type) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const changes = [];
        // Find a good insertion point (after imports or at top)
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ')) {
                insertIndex = i + 1;
            }
            if (lines[i].includes('export ') || lines[i].includes('function ') || lines[i].includes('=>')) {
                break;
            }
        }
        const apiConfigComment = `\n// ============================================================================\n// Modularity-skill: Updated API endpoint for ${type}\n// ============================================================================\nconst API_ENDPOINTS = {\n  ${type}: '${endpoint}',\n};\n`;
        lines.splice(insertIndex, 0, apiConfigComment);
        changes.push({
            type: 'api_endpoint',
            description: `Added ${type} API endpoint configuration`,
            before: '',
            after: apiConfigComment,
            line_start: insertIndex + 1,
            line_end: insertIndex + apiConfigComment.split('\n').length,
        });
        return {
            file_path: filePath,
            original_content: content,
            modified_content: lines.join('\n'),
            changes,
        };
    }
    /**
     * 创建适配器导入注释（当无法直接修改时）
     */
    generateAdapterImportComment(adapterPath) {
        return `
// ============================================================================
// Modularity-skill: API Adapter
// ============================================================================
// To use the new backend API, import the adapter:
//
// import { login, register } from '${adapterPath}';
//
// Or update your existing API calls to use:
//   axios.post('/api/users/login', data)  →  axios.post('${adapterPath}', data)
`;
    }
    /**
     * 写入修改后的文件
     */
    async writeModifiedFile(modification) {
        try {
            const dir = path.dirname(modification.file_path);
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(modification.file_path, modification.modified_content);
            return true;
        }
        catch (error) {
            console.error(`Failed to write ${modification.file_path}:`, error);
            return false;
        }
    }
    /**
     * 生成修改报告
     */
    generateModificationReport(modifications) {
        const lines = [];
        lines.push('='.repeat(60));
        lines.push('📝 Frontend Modification Report');
        lines.push('='.repeat(60));
        lines.push('');
        if (modifications.length === 0) {
            lines.push('No files needed modification.');
            return lines.join('\n');
        }
        for (const mod of modifications) {
            lines.push(`📄 ${mod.file_path}`);
            lines.push('-'.repeat(40));
            for (const change of mod.changes) {
                lines.push(`  ${change.type.toUpperCase()}: ${change.description}`);
                if (change.before) {
                    lines.push(`    - Before: ${change.before}`);
                }
                if (change.after) {
                    lines.push(`    + After: ${change.after}`);
                }
            }
            lines.push('');
        }
        lines.push('='.repeat(60));
        lines.push(`Total: ${modifications.length} file(s) modified`);
        lines.push('='.repeat(60));
        return lines.join('\n');
    }
}
// ============================================================================
// AI-Powered Modifier (for more complex modifications)
// ============================================================================
export class AICodeModifier extends CodeModifier {
    apiEndpoint;
    moduleName;
    constructor(projectPath, apiEndpoint, moduleName) {
        super(projectPath);
        this.apiEndpoint = apiEndpoint;
        this.moduleName = moduleName;
    }
    /**
     * 智能修改登录/注册页面
     */
    async modifyAuthPages(detected) {
        const modifications = [];
        // Find login/register related files
        for (const hook of detected.hooks) {
            if (/login|signin|auth/i.test(hook.name)) {
                const mod = await this.modifyAuthHook(hook.file_path, {
                    login: this.apiEndpoint,
                });
                if (mod)
                    modifications.push(mod);
            }
        }
        for (const component of detected.components) {
            if (/login|signin/i.test(component.name)) {
                const mod = await this.modifyLoginForm(component.file_path, this.apiEndpoint);
                if (mod)
                    modifications.push(mod);
            }
            if (/register|signup/i.test(component.name)) {
                const mod = await this.modifyRegisterForm(component.file_path, this.apiEndpoint);
                if (mod)
                    modifications.push(mod);
            }
        }
        return modifications;
    }
}
// ============================================================================
// Convenience functions
// ============================================================================
export async function modifyExistingFrontendCode(projectPath, detected, apiEndpoints) {
    const modifier = new CodeModifier(projectPath);
    const modifications = [];
    // Modify hooks
    for (const hook of detected.hooks) {
        const mod = await modifier.modifyAuthHook(hook.file_path, apiEndpoints);
        if (mod)
            modifications.push(mod);
    }
    // Modify components (login forms)
    for (const component of detected.components) {
        if (/login|signin/i.test(component.name)) {
            const mod = await modifier.modifyLoginForm(component.file_path, apiEndpoints.login || '');
            if (mod)
                modifications.push(mod);
        }
        if (/register|signup/i.test(component.name)) {
            const mod = await modifier.modifyRegisterForm(component.file_path, apiEndpoints.register || '');
            if (mod)
                modifications.push(mod);
        }
    }
    return modifications;
}
export async function findAndModifyAuthFiles(projectPath, apiEndpoints) {
    const modifier = new CodeModifier(projectPath);
    const modifications = [];
    // Find existing auth files
    const authFiles = await modifier.findExistingAuthFiles();
    console.log('\n🔍 Found existing auth files:');
    console.log(`   Login forms: ${authFiles.loginForms.length}`);
    console.log(`   Register forms: ${authFiles.registerForms.length}`);
    console.log(`   Auth hooks: ${authFiles.authHooks.length}`);
    console.log(`   API services: ${authFiles.apiServices.length}`);
    // Modify each type
    for (const file of authFiles.loginForms) {
        const mod = await modifier.modifyLoginForm(file, apiEndpoints.login);
        if (mod)
            modifications.push(mod);
    }
    for (const file of authFiles.registerForms) {
        const mod = await modifier.modifyRegisterForm(file, apiEndpoints.register);
        if (mod)
            modifications.push(mod);
    }
    for (const file of authFiles.authHooks) {
        const mod = await modifier.modifyAuthHook(file, apiEndpoints);
        if (mod)
            modifications.push(mod);
    }
    for (const file of authFiles.apiServices) {
        const mod = await modifier.modifyApiService(file, apiEndpoints);
        if (mod)
            modifications.push(mod);
    }
    return modifications;
}
//# sourceMappingURL=code-modifier.js.map