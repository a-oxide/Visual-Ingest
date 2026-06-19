import { describe, test, expect } from "vitest";
import { parseConfig } from "../src/config.js";

describe("parseConfig", () => {
  test("uses all defaults when no options provided", () => {
    const c = parseConfig(undefined);
    expect(c.model).toBe("mimo-v2.5-free");
    expect(c.endpoint).toBe("https://opencode.ai/zen/v1/chat/completions");
    expect(c.concurrency).toBe(4);
    expect(c.token_budget).toBe(128000);
    expect(c.min_dim).toBe(768);
    expect(c.max_dim).toBe(3072);
    expect(c.max_tokens_per_call).toBe(2048);
    expect(c.image_extensions).toEqual([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
    expect(c.api_key).toBeUndefined();
  });

  test("overrides defaults with provided options", () => {
    const c = parseConfig({ model: "big-pickle", concurrency: 8, token_budget: 50000 });
    expect(c.model).toBe("big-pickle");
    expect(c.concurrency).toBe(8);
    expect(c.token_budget).toBe(50000);
    expect(c.endpoint).toBe("https://opencode.ai/zen/v1/chat/completions");
  });

  test("accepts api_key for paid endpoints", () => {
    const c = parseConfig({ api_key: "sk-test", endpoint: "https://example.com/v1/chat" });
    expect(c.api_key).toBe("sk-test");
    expect(c.endpoint).toBe("https://example.com/v1/chat");
  });

  test("image_extensions can be overridden", () => {
    const c = parseConfig({ image_extensions: [".png", ".jpg"] });
    expect(c.image_extensions).toEqual([".png", ".jpg"]);
  });
});
