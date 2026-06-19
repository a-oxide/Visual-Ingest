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

const DEFAULTS: Config = {
  model: "mimo-v2.5-free",
  endpoint: "https://opencode.ai/zen/v1/chat/completions",
  concurrency: 4,
  token_budget: 128000,
  min_dim: 768,
  max_dim: 3072,
  max_tokens_per_call: 2048,
  image_extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};

export function parseConfig(options: Record<string, unknown> | undefined): Config {
  if (!options) return { ...DEFAULTS };
  return { ...DEFAULTS, ...options } as Config;
}
