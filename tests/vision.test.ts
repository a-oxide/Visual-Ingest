import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { buildPrompt, parseVisionResponse, callVision } from "../src/vision.js";
import type { Config } from "../src/config.js";

const mockConfig: Config = {
  model: "mimo-v2.5-free",
  endpoint: "https://opencode.ai/zen/v1/chat/completions",
  concurrency: 4,
  token_budget: 128000,
  min_dim: 768,
  max_dim: 3072,
  max_tokens_per_call: 2048,
  image_extensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};

describe("buildPrompt", () => {
  test("text-rich: three-section prompt with embedded text", () => {
    const { text } = buildPrompt("text-rich", "Embedded body text", undefined);
    expect(text).toContain("## Full transcription");
    expect(text).toContain("## Visual description");
    expect(text).toContain("## Text not in embedded layer");
    expect(text).toContain("Embedded text layer");
    expect(text).toContain("Embedded body text");
  });

  test("image-only: two-section prompt without embedded text", () => {
    const { text } = buildPrompt("image-only", null, undefined);
    expect(text).toContain("## Full transcription");
    expect(text).toContain("## Visual description");
    expect(text).not.toContain("## Text not in embedded layer");
    expect(text).not.toContain("Embedded text layer");
  });

  test("prepends question when provided", () => {
    const { text } = buildPrompt("text-rich", "body", "What is the voltage?");
    expect(text.startsWith("The user is trying to answer")).toBe(true);
    expect(text).toContain("What is the voltage?");
  });
});

describe("parseVisionResponse", () => {
  test("parses three sections (text-rich/mixed)", () => {
    const content = "## Full transcription\nBody text\n\n## Visual description\nA diagram\n\n## Text not in embedded layer\nACME logo";
    const result = parseVisionResponse(content, true);
    expect(result.full_transcription).toBe("Body text");
    expect(result.visual_description).toBe("A diagram");
    expect(result.extra_text).toBe("ACME logo");
    expect(result.vision_status).toBe("ok");
  });

  test("parses two sections (image-only/image)", () => {
    const content = "## Full transcription\nAll text here\n\n## Visual description\nA photo";
    const result = parseVisionResponse(content, false);
    expect(result.full_transcription).toBe("All text here");
    expect(result.visual_description).toBe("A photo");
    expect(result.extra_text).toBeNull();
    expect(result.vision_status).toBe("ok");
  });

  test("flags malformed response (missing section)", () => {
    const content = "## Full transcription\nSome text";
    const result = parseVisionResponse(content, true);
    expect(result.vision_status).toBe("malformed");
    expect(result.full_transcription).toBe("Some text");
    expect(result.visual_description).toBe("");
  });
});

describe("callVision", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("sends correct request and parses response", async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: "## Full transcription\nHello\n\n## Visual description\nA page",
        },
      }],
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await callVision(mockConfig, "base64data", "text-rich", "Embedded text");
    expect(result.full_transcription).toBe("Hello");
    expect(result.visual_description).toBe("A page");
    expect(result.vision_status).toBe("ok");

    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.model).toBe("mimo-v2.5-free");
    expect(body.messages[0].content[0].type).toBe("text");
    expect(body.messages[0].content[1].type).toBe("image_url");
    expect(body.max_tokens).toBe(2048);
  });

  test("retries on 429 then succeeds", async () => {
    const mockResponse = {
      choices: [{ message: { content: "## Full transcription\nOk\n\n## Visual description\nX" } }],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: false, status: 429, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(mockResponse) });

    const result = await callVision(mockConfig, "base64data", "image-only", null);
    expect(result.vision_status).toBe("ok");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("fails after max retries", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: "down" }),
    });

    const result = await callVision(mockConfig, "base64data", "image-only", null);
    expect(result.vision_status).toBe("failed");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
