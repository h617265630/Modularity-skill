// ============================================================================
// 类型定义 - Feature Compiler AI
// ============================================================================
export const DEFAULT_GENERATION_CONFIG = {
    default_mode: 'hybrid',
    ai_provider: 'claude',
    ai_model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    temperature: 0.3,
    rate_limit: {
        requests_per_minute: 10,
        retry_delay_ms: 2000,
    },
};
//# sourceMappingURL=types.js.map