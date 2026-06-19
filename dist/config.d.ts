export interface Config {
    model: string;
    endpoint: string;
    concurrency: number;
    token_budget: number;
    min_dim: number;
    max_dim: number;
    max_tokens_per_call: number;
    image_extensions: string[];
    api_key?: string;
}
export declare function parseConfig(options: Record<string, unknown> | undefined): Config;
