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
export declare class CodeModifier {
    private projectPath;
    private adapterMappings;
    constructor(projectPath: string);
    setAdapterMappings(mappings: AdapterMapping[]): void;
    findExistingAuthFiles(): Promise<{
        loginForms: string[];
        registerForms: string[];
        authHooks: string[];
        apiServices: string[];
        navbars: string[];
    }>;
    private scanForAuth;
    findExistingPostFiles(): Promise<{
        postLists: string[];
        postItems: string[];
        postInputs: string[];
        postHooks: string[];
        postApis: string[];
    }>;
    private scanForPosts;
    findExistingCommentFiles(): Promise<{
        commentLists: string[];
        commentItems: string[];
        commentInputs: string[];
        commentHooks: string[];
        commentApis: string[];
    }>;
    private scanForComments;
    findExistingLikeFiles(): Promise<{
        likeButtons: string[];
        likeCounts: string[];
        likeHooks: string[];
        likeApis: string[];
    }>;
    private scanForLikes;
    findExistingFollowFiles(): Promise<{
        followButtons: string[];
        followersLists: string[];
        followingLists: string[];
        followHooks: string[];
        followApis: string[];
    }>;
    private scanForFollows;
    findExistingNotificationFiles(): Promise<{
        notificationBells: string[];
        notificationLists: string[];
        notificationHooks: string[];
        notificationApis: string[];
    }>;
    private scanForNotifications;
    findExistingMessageFiles(): Promise<{
        messageLists: string[];
        messageItems: string[];
        messageHooks: string[];
        messageApis: string[];
    }>;
    private scanForMessages;
    findExistingSearchFiles(): Promise<{
        searchBars: string[];
        searchResults: string[];
        searchHooks: string[];
        searchApis: string[];
    }>;
    private scanForSearch;
    modifyLoginForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    modifyRegisterForm(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    modifyAuthHook(filePath: string, apiEndpoints: {
        login?: string;
        register?: string;
        logout?: string;
        me?: string;
    }): Promise<FileModification | null>;
    modifyApiService(filePath: string, newEndpoints: {
        login?: string;
        register?: string;
    }): Promise<FileModification | null>;
    modifyNavbar(filePath: string, options: {
        authHookImport?: string;
        userVarName?: string;
    }): Promise<FileModification | null>;
    modifyPostList(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    modifyPostItem(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    modifyPostInput(filePath: string, newApiEndpoint: string): Promise<FileModification | null>;
    modifyPostHook(filePath: string, apiEndpoints: {
        list?: string;
        detail?: string;
        create?: string;
        update?: string;
        delete?: string;
    }): Promise<FileModification | null>;
    modifyPostApi(filePath: string, newEndpoints: {
        list?: string;
        create?: string;
    }): Promise<FileModification | null>;
    modifyApiFile(filePath: string, moduleName: string, apiEndpoints: Record<string, string>): Promise<FileModification | null>;
    writeModifiedFile(modification: FileModification): Promise<boolean>;
    generateModificationReport(modifications: FileModification[]): string;
}
//# sourceMappingURL=code-modifier.d.ts.map