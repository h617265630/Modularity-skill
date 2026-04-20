// ============================================================================
// Code Modifier - Modularity-skill
// 修改现有前端文件以对接新的后端 API
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { DetectedFrontendCode } from '../core/types.js';

// ============================================================================
// Types
// ============================================================================

export interface FileModification {
  file_path: string;
  original_content: string;
  modified_content: string;
  changes: ModificationChange[];
}

export interface ModificationChange {
  type: 'api_endpoint' | 'import' | 'hook_call' | 'adapter_import';
  description: string;
  before: string;
  after: string;
  line_start: number;
  line_end: number;
}

export interface AdapterMapping {
  original_endpoint: string;
  new_endpoint: string;
  adapter_name: string;
}

// ============================================================================
// Auth 模块模式定义
// ============================================================================

const LOGIN_PATTERNS = [/login/i, /signin/i, /log-in/i, /sign-in/i];
const REGISTER_PATTERNS = [/register/i, /signup/i, /sign-up/i, /create.*account/i];
const AUTH_HOOK_PATTERNS = [/useAuth/, /useLogin/, /useRegister/, /useSignin/, /useSignup/];
const API_SERVICE_PATTERNS = [/api\/auth/, /api\/login/, /api\/register/, /auth\/login/, /auth\/register/];
const NAVBAR_PATTERNS = [/navbar/i, /nav/i, /header/i, /menu/i, /navigation/i];

// ============================================================================
// Post 模块模式定义
// ============================================================================

const POST_LIST_PATTERNS = [/postlist/i, /post-list/i, /posts/i, /feed/i, /timeline/i];
const POST_ITEM_PATTERNS = [/postitem/i, /post-item/i, /postcard/i, /post-card/i];
const POST_INPUT_PATTERNS = [/postinput/i, /post-input/i, /createpost/i, /create-post/i, /newpost/i, /new-post/i, /compose/i];
const POST_HOOK_PATTERNS = [/usePost/, /usePosts/, /useFeed/, /useTimeline/];
const POST_API_PATTERNS = [/api\/posts/, /api\/post/, /posts\/create/, /post\/create/];

// ============================================================================
// Comment 模块模式定义
// ============================================================================

const COMMENT_LIST_PATTERNS = [/commentlist/i, /comment-list/i, /comments/i];
const COMMENT_ITEM_PATTERNS = [/commentitem/i, /comment-item/i, /commentcard/i, /comment-card/i];
const COMMENT_INPUT_PATTERNS = [/commentinput/i, /comment-input/i, /createcomment/i, /create-comment/i, /addcomment/i, /add-comment/i, /reply/i];
const COMMENT_HOOK_PATTERNS = [/useComment/, /useComments/, /useReplies/];
const COMMENT_API_PATTERNS = [/api\/comments/, /api\/comment/];

// ============================================================================
// Like 模块模式定义
// ============================================================================

const LIKE_BUTTON_PATTERNS = [/likebutton/i, /like-button/i, /likebtn/i, /like-btn/i, /heart/i];
const LIKE_COUNT_PATTERNS = [/likecount/i, /like-count/i, /likecnt/i];
const LIKE_HOOK_PATTERNS = [/useLike/, /useLikes/, /useLikeStatus/];
const LIKE_API_PATTERNS = [/api\/likes/, /api\/like/];

// ============================================================================
// Follow 模块模式定义
// ============================================================================

const FOLLOW_BUTTON_PATTERNS = [/followbutton/i, /follow-button/i, /followbtn/i, /follow-btn/i];
const FOLLOWERS_LIST_PATTERNS = [/followerslist/i, /followers-list/i, /followers/i];
const FOLLOWING_LIST_PATTERNS = [/followinglist/i, /following-list/i, /following/i];
const FOLLOW_HOOK_PATTERNS = [/useFollow/, /useFollowers/, /useFollowing/, /useIsFollowing/];
const FOLLOW_API_PATTERNS = [/api\/follows/, /api\/follow/];

// ============================================================================
// Notification 模块模式定义
// ============================================================================

const NOTIFICATION_BELL_PATTERNS = [/notificationbell/i, /notification-bell/i, /notifbell/i, /notif-btn/i, /bell/i];
const NOTIFICATION_LIST_PATTERNS = [/notificationlist/i, /notification-list/i, /notifications/i];
const NOTIFICATION_HOOK_PATTERNS = [/useNotification/, /useNotifications/, /useNotif/];
const NOTIFICATION_API_PATTERNS = [/api\/notifications/, /api\/notification/];

// ============================================================================
// Message 模块模式定义
// ============================================================================

const MESSAGE_LIST_PATTERNS = [/messagelist/i, /message-list/i, /messages/i];
const MESSAGE_ITEM_PATTERNS = [/messageitem/i, /message-item/i, /conversation/i];
const MESSAGE_HOOK_PATTERNS = [/useMessage/, /useMessages/, /useConversation/, /useConversations/];
const MESSAGE_API_PATTERNS = [/api\/messages/, /api\/message/, /api\/conversations/];

// ============================================================================
// Search 模块模式定义
// ============================================================================

const SEARCH_BAR_PATTERNS = [/searchbar/i, /search-bar/i, /searchinput/i, /search-input/i, /searchbox/i];
const SEARCH_RESULTS_PATTERNS = [/searchresults/i, /search-results/i, /searchresult/i];
const SEARCH_HOOK_PATTERNS = [/useSearch/, /useSearchResults/];
const SEARCH_API_PATTERNS = [/api\/search/];

// ============================================================================
// Code Modifier
// ============================================================================

export class CodeModifier {
  private projectPath: string;
  private adapterMappings: AdapterMapping[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  setAdapterMappings(mappings: AdapterMapping[]) {
    this.adapterMappings = mappings;
  }

  // ============================================================================
  // Auth 文件查找
  // ============================================================================

  async findExistingAuthFiles() {
    const result = { loginForms: [] as string[], registerForms: [] as string[], authHooks: [] as string[], apiServices: [] as string[], navbars: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) {
      await this.scanForAuth(dir, result);
    }
    return result;
  }

  private async scanForAuth(dir: string, result: { loginForms: string[], registerForms: string[], authHooks: string[], apiServices: string[], navbars: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForAuth(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (LOGIN_PATTERNS.some(p => p.test(baseName))) result.loginForms.push(fullPath);
        if (REGISTER_PATTERNS.some(p => p.test(baseName))) result.registerForms.push(fullPath);
        if (AUTH_HOOK_PATTERNS.some(p => p.test(baseName))) result.authHooks.push(fullPath);
        if (API_SERVICE_PATTERNS.some(p => p.test(baseName))) result.apiServices.push(fullPath);
        if (NAVBAR_PATTERNS.some(p => p.test(baseName))) result.navbars.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Post 文件查找
  // ============================================================================

  async findExistingPostFiles() {
    const result = { postLists: [] as string[], postItems: [] as string[], postInputs: [] as string[], postHooks: [] as string[], postApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForPosts(dir, result); }
    return result;
  }

  private async scanForPosts(dir: string, result: { postLists: string[], postItems: string[], postInputs: string[], postHooks: string[], postApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForPosts(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (POST_LIST_PATTERNS.some(p => p.test(baseName))) result.postLists.push(fullPath);
        if (POST_ITEM_PATTERNS.some(p => p.test(baseName))) result.postItems.push(fullPath);
        if (POST_INPUT_PATTERNS.some(p => p.test(baseName))) result.postInputs.push(fullPath);
        if (POST_HOOK_PATTERNS.some(p => p.test(baseName))) result.postHooks.push(fullPath);
        if (POST_API_PATTERNS.some(p => p.test(baseName))) result.postApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Comment 文件查找
  // ============================================================================

  async findExistingCommentFiles() {
    const result = { commentLists: [] as string[], commentItems: [] as string[], commentInputs: [] as string[], commentHooks: [] as string[], commentApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForComments(dir, result); }
    return result;
  }

  private async scanForComments(dir: string, result: { commentLists: string[], commentItems: string[], commentInputs: string[], commentHooks: string[], commentApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForComments(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (COMMENT_LIST_PATTERNS.some(p => p.test(baseName))) result.commentLists.push(fullPath);
        if (COMMENT_ITEM_PATTERNS.some(p => p.test(baseName))) result.commentItems.push(fullPath);
        if (COMMENT_INPUT_PATTERNS.some(p => p.test(baseName))) result.commentInputs.push(fullPath);
        if (COMMENT_HOOK_PATTERNS.some(p => p.test(baseName))) result.commentHooks.push(fullPath);
        if (COMMENT_API_PATTERNS.some(p => p.test(baseName))) result.commentApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Like 文件查找
  // ============================================================================

  async findExistingLikeFiles() {
    const result = { likeButtons: [] as string[], likeCounts: [] as string[], likeHooks: [] as string[], likeApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForLikes(dir, result); }
    return result;
  }

  private async scanForLikes(dir: string, result: { likeButtons: string[], likeCounts: string[], likeHooks: string[], likeApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForLikes(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (LIKE_BUTTON_PATTERNS.some(p => p.test(baseName))) result.likeButtons.push(fullPath);
        if (LIKE_COUNT_PATTERNS.some(p => p.test(baseName))) result.likeCounts.push(fullPath);
        if (LIKE_HOOK_PATTERNS.some(p => p.test(baseName))) result.likeHooks.push(fullPath);
        if (LIKE_API_PATTERNS.some(p => p.test(baseName))) result.likeApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Follow 文件查找
  // ============================================================================

  async findExistingFollowFiles() {
    const result = { followButtons: [] as string[], followersLists: [] as string[], followingLists: [] as string[], followHooks: [] as string[], followApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForFollows(dir, result); }
    return result;
  }

  private async scanForFollows(dir: string, result: { followButtons: string[], followersLists: string[], followingLists: string[], followHooks: string[], followApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForFollows(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (FOLLOW_BUTTON_PATTERNS.some(p => p.test(baseName))) result.followButtons.push(fullPath);
        if (FOLLOWERS_LIST_PATTERNS.some(p => p.test(baseName))) result.followersLists.push(fullPath);
        if (FOLLOWING_LIST_PATTERNS.some(p => p.test(baseName))) result.followingLists.push(fullPath);
        if (FOLLOW_HOOK_PATTERNS.some(p => p.test(baseName))) result.followHooks.push(fullPath);
        if (FOLLOW_API_PATTERNS.some(p => p.test(baseName))) result.followApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Notification 文件查找
  // ============================================================================

  async findExistingNotificationFiles() {
    const result = { notificationBells: [] as string[], notificationLists: [] as string[], notificationHooks: [] as string[], notificationApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForNotifications(dir, result); }
    return result;
  }

  private async scanForNotifications(dir: string, result: { notificationBells: string[], notificationLists: string[], notificationHooks: string[], notificationApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForNotifications(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (NOTIFICATION_BELL_PATTERNS.some(p => p.test(baseName))) result.notificationBells.push(fullPath);
        if (NOTIFICATION_LIST_PATTERNS.some(p => p.test(baseName))) result.notificationLists.push(fullPath);
        if (NOTIFICATION_HOOK_PATTERNS.some(p => p.test(baseName))) result.notificationHooks.push(fullPath);
        if (NOTIFICATION_API_PATTERNS.some(p => p.test(baseName))) result.notificationApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Message 文件查找
  // ============================================================================

  async findExistingMessageFiles() {
    const result = { messageLists: [] as string[], messageItems: [] as string[], messageHooks: [] as string[], messageApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForMessages(dir, result); }
    return result;
  }

  private async scanForMessages(dir: string, result: { messageLists: string[], messageItems: string[], messageHooks: string[], messageApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForMessages(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (MESSAGE_LIST_PATTERNS.some(p => p.test(baseName))) result.messageLists.push(fullPath);
        if (MESSAGE_ITEM_PATTERNS.some(p => p.test(baseName))) result.messageItems.push(fullPath);
        if (MESSAGE_HOOK_PATTERNS.some(p => p.test(baseName))) result.messageHooks.push(fullPath);
        if (MESSAGE_API_PATTERNS.some(p => p.test(baseName))) result.messageApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Search 文件查找
  // ============================================================================

  async findExistingSearchFiles() {
    const result = { searchBars: [] as string[], searchResults: [] as string[], searchHooks: [] as string[], searchApis: [] as string[] };
    const searchDirs = [path.join(this.projectPath, 'src'), path.join(this.projectPath, 'frontend', 'src'), path.join(this.projectPath, 'app')].filter(d => fs.existsSync(d));
    for (const dir of searchDirs) { await this.scanForSearch(dir, result); }
    return result;
  }

  private async scanForSearch(dir: string, result: { searchBars: string[], searchResults: string[], searchHooks: string[], searchApis: string[] }) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        await this.scanForSearch(fullPath, result);
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(path.extname(entry.name))) {
        const baseName = entry.name.toLowerCase();
        if (SEARCH_BAR_PATTERNS.some(p => p.test(baseName))) result.searchBars.push(fullPath);
        if (SEARCH_RESULTS_PATTERNS.some(p => p.test(baseName))) result.searchResults.push(fullPath);
        if (SEARCH_HOOK_PATTERNS.some(p => p.test(baseName))) result.searchHooks.push(fullPath);
        if (SEARCH_API_PATTERNS.some(p => p.test(baseName))) result.searchApis.push(fullPath);
      }
    }
  }

  // ============================================================================
  // Auth 修改方法
  // ============================================================================

  async modifyLoginForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const apiMatch = /(?:axios|fetch|api)\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = apiMatch.exec(line)) !== null) {
        if (m[1].includes('login') || m[1].includes('auth')) {
          changes.push({ type: 'api_endpoint', description: 'Replace login API URL', before: m[1], after: newApiEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newApiEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyRegisterForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const apiMatch = /(?:axios|fetch|api)\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = apiMatch.exec(line)) !== null) {
        if (m[1].includes('register') || m[1].includes('signup') || m[1].includes('auth')) {
          changes.push({ type: 'api_endpoint', description: 'Replace register API URL', before: m[1], after: newApiEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newApiEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyAuthHook(filePath: string, apiEndpoints: { login?: string; register?: string; logout?: string; me?: string }): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const baseMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
      if (baseMatch) {
        changes.push({ type: 'api_endpoint', description: 'Replace API base URL', before: baseMatch[1], after: '/api', line_start: ln, line_end: ln });
        line = line.replace(baseMatch[1], '/api');
        modified = true;
      }
      if (apiEndpoints.login && /['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/);
        if (m) {
          changes.push({ type: 'api_endpoint', description: 'Replace login endpoint', before: m[1], after: apiEndpoints.login, line_start: ln, line_end: ln });
          line = line.replace(m[1], apiEndpoints.login);
          modified = true;
        }
      }
      if (apiEndpoints.register && /['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/);
        if (m) {
          changes.push({ type: 'api_endpoint', description: 'Replace register endpoint', before: m[1], after: apiEndpoints.register, line_start: ln, line_end: ln });
          line = line.replace(m[1], apiEndpoints.register);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyApiService(filePath: string, newEndpoints: { login?: string; register?: string }): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const baseMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
      if (baseMatch) {
        changes.push({ type: 'api_endpoint', description: 'Replace API base URL', before: baseMatch[1], after: '/api', line_start: ln, line_end: ln });
        line = line.replace(baseMatch[1], '/api');
        modified = true;
      }
      if (newEndpoints.login && /['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:login|signin)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace login path', before: m[1], after: newEndpoints.login, line_start: ln, line_end: ln }); line = line.replace(m[1], newEndpoints.login); modified = true; }
      }
      if (newEndpoints.register && /['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:register|signup)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace register path', before: m[1], after: newEndpoints.register, line_start: ln, line_end: ln }); line = line.replace(m[1], newEndpoints.register); modified = true; }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyNavbar(filePath: string, options: { authHookImport?: string; userVarName?: string }): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    if (/isLoggedIn|isAuthenticated|user\.|currentUser/.test(content)) return null;
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    const newLines = [...lines];
    const hasUseAuthImport = /import\s+.*useAuth.*from/.test(content);
    if (!hasUseAuthImport && options.authHookImport) {
      let lastImportIndex = -1;
      for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].trim().startsWith('import ')) lastImportIndex = i;
      }
      if (lastImportIndex >= 0) {
        newLines.splice(lastImportIndex + 1, 0, `import { useAuth } from '${options.authHookImport}';`);
        changes.push({ type: 'import', description: 'Added useAuth hook import', before: '', after: `import { useAuth } from '${options.authHookImport}';`, line_start: lastImportIndex + 2, line_end: lastImportIndex + 2 });
      }
    }
    const modifiedContent = newLines.join('\n');
    const loginButtonPattern = /(<button[^>]*>.*?Login.*?<\/button>)|(<a[^>]*>.*?Login.*?<\/a>)|(\{[^}]*Login[^}]*\})/gi;
    if (loginButtonPattern.test(modifiedContent)) {
      const replacedContent = modifiedContent.replace(loginButtonPattern, (match) => {
        if (match.includes('?') || match.includes('{')) return match;
        return `{user ? (${match}) : null}`;
      });
      if (replacedContent !== modifiedContent) {
        const useAuthPattern = /(const\s+\w+\s*=\s*useAuth\s*\(\s*\))/;
        if (useAuthPattern.test(replacedContent)) {
          const varName = options.userVarName || 'user';
          const finalContent = replacedContent.replace(useAuthPattern, (match) => {
            const hookVarMatch = match.match(/const\s+(\w+)/);
            const hookVar = hookVarMatch ? hookVarMatch[1] : 'auth';
            return `const { ${varName} } = ${hookVar}`;
          });
          return { file_path: filePath, original_content: content, modified_content: finalContent, changes };
        }
        return { file_path: filePath, original_content: content, modified_content: replacedContent, changes };
      }
    }
    return changes.length > 0 ? { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes } : null;
  }

  // ============================================================================
  // Post 修改方法
  // ============================================================================

  async modifyPostList(filePath: string, newApiEndpoint: string): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const apiMatch = /(?:axios|fetch|api)\.(?:get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = apiMatch.exec(line)) !== null) {
        if (m[1].includes('post') || m[1].includes('feed')) {
          changes.push({ type: 'api_endpoint', description: 'Replace post list API URL', before: m[1], after: newApiEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newApiEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyPostItem(filePath: string, newApiEndpoint: string): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const apiMatch = /(?:axios|fetch|api)\.(?:get|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = apiMatch.exec(line)) !== null) {
        if (m[1].includes('post')) {
          changes.push({ type: 'api_endpoint', description: 'Replace post item API URL', before: m[1], after: newApiEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newApiEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyPostInput(filePath: string, newApiEndpoint: string): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const apiMatch = /(?:axios|fetch|api)\.post\s*\(\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = apiMatch.exec(line)) !== null) {
        if (m[1].includes('post') || m[1].includes('create') || m[1].includes('compose')) {
          changes.push({ type: 'api_endpoint', description: 'Replace create post API URL', before: m[1], after: newApiEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newApiEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyPostHook(filePath: string, apiEndpoints: { list?: string; detail?: string; create?: string; update?: string; delete?: string }): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const baseMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
      if (baseMatch) {
        changes.push({ type: 'api_endpoint', description: 'Replace API base URL', before: baseMatch[1], after: '/api', line_start: ln, line_end: ln });
        line = line.replace(baseMatch[1], '/api');
        modified = true;
      }
      if (apiEndpoints.list && /['"`]([^'"`]*(?:posts|post\/list)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:posts|post\/list)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace posts list path', before: m[1], after: apiEndpoints.list, line_start: ln, line_end: ln }); line = line.replace(m[1], apiEndpoints.list); modified = true; }
      }
      if (apiEndpoints.create && /['"`]([^'"`]*(?:post\/create|posts\/create)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:post\/create|posts\/create)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace create post path', before: m[1], after: apiEndpoints.create, line_start: ln, line_end: ln }); line = line.replace(m[1], apiEndpoints.create); modified = true; }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  async modifyPostApi(filePath: string, newEndpoints: { list?: string; create?: string }): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const baseMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
      if (baseMatch) {
        changes.push({ type: 'api_endpoint', description: 'Replace API base URL', before: baseMatch[1], after: '/api', line_start: ln, line_end: ln });
        line = line.replace(baseMatch[1], '/api');
        modified = true;
      }
      if (newEndpoints.list && /['"`]([^'"`]*(?:posts|post-list)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:posts|post-list)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace posts list path', before: m[1], after: newEndpoints.list, line_start: ln, line_end: ln }); line = line.replace(m[1], newEndpoints.list); modified = true; }
      }
      if (newEndpoints.create && /['"`]([^'"`]*(?:create-post|post\/create)[^'"`]*)['"`]/.test(line)) {
        const m = line.match(/['"`]([^'"`]*(?:create-post|post\/create)[^'"`]*)['"`]/);
        if (m) { changes.push({ type: 'api_endpoint', description: 'Replace create post path', before: m[1], after: newEndpoints.create, line_start: ln, line_end: ln }); line = line.replace(m[1], newEndpoints.create); modified = true; }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  // ============================================================================
  // Generic API 修改方法（适用于所有模块）
  // ============================================================================

  async modifyApiFile(filePath: string, moduleName: string, apiEndpoints: Record<string, string>): Promise<FileModification | null> {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const changes: ModificationChange[] = [];
    const lines = content.split('\n');
    let modified = false;
    const newLines = lines.map((line, i) => {
      const ln = i + 1;
      const baseMatch = line.match(/baseURL\s*[=:]\s*['"`]([^'"`]+)['"`]/);
      if (baseMatch) {
        changes.push({ type: 'api_endpoint', description: `Replace ${moduleName} API base URL`, before: baseMatch[1], after: '/api', line_start: ln, line_end: ln });
        line = line.replace(baseMatch[1], '/api');
        modified = true;
      }
      for (const [key, newEndpoint] of Object.entries(apiEndpoints)) {
        if (key === 'base') continue;
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp("['\"`]([^'\"`]*(?:" + escapedKey + ")[^'\"`]*)['\"']", 'g');
        const m = pattern.exec(line);
        if (m) {
          changes.push({ type: 'api_endpoint', description: `Replace ${key} path`, before: m[1], after: newEndpoint, line_start: ln, line_end: ln });
          line = line.replace(m[1], newEndpoint);
          modified = true;
        }
      }
      return line;
    });
    if (!modified) return null;
    return { file_path: filePath, original_content: content, modified_content: newLines.join('\n'), changes };
  }

  // ============================================================================
  // 写入修改后的文件
  // ============================================================================

  async writeModifiedFile(modification: FileModification): Promise<boolean> {
    try {
      const dir = path.dirname(modification.file_path);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(modification.file_path, modification.modified_content);
      return true;
    } catch (error) {
      console.error(`Failed to write ${modification.file_path}:`, error);
      return false;
    }
  }

  generateModificationReport(modifications: FileModification[]): string {
    if (modifications.length === 0) return 'No files needed modification.';
    const lines = ['='.repeat(60), '📝 Frontend Modification Report', '='.repeat(60), ''];
    for (const mod of modifications) {
      lines.push(`📄 ${mod.file_path}`);
      lines.push('-'.repeat(40));
      for (const change of mod.changes) {
        lines.push(`  ${change.type.toUpperCase()}: ${change.description}`);
        if (change.before) lines.push(`    - Before: ${change.before}`);
        if (change.after) lines.push(`    + After: ${change.after}`);
      }
      lines.push('');
    }
    lines.push('='.repeat(60), `Total: ${modifications.length} file(s) modified`, '='.repeat(60));
    return lines.join('\n');
  }
}
