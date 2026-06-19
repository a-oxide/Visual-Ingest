const DEFAULTS = {
    model: "mimo-v2.5-free",
    endpoint: "https://opencode.ai/zen/v1/chat/completions",
    concurrency: 4,
    token_budget: 128000,
    min_dim: 768,
    max_dim: 3072,
    max_tokens_per_call: 2048,
    image_extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};
export function parseConfig(options) {
    if (!options)
        return { ...DEFAULTS };
    return { ...DEFAULTS, ...options };
}
