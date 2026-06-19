import { describe, test, expect } from "vitest";
import { loadImage } from "../src/image.js";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

const tmpPath = join(tmpdir(), `vi-test-${Date.now()}.png`);

describe("loadImage", () => {
  test("downscales large image to fit max_dim", async () => {
    const big = await sharp({
      create: { width: 4000, height: 2000, channels: 3, background: "red" },
    }).png().toBuffer();
    writeFileSync(tmpPath, big);

    const result = await loadImage(tmpPath, {
      min_dim: 768,
      max_dim: 3072,
    } as any);

    expect(result.width).toBeLessThanOrEqual(3072);
    expect(result.height).toBeLessThanOrEqual(3072);
    expect(result.imageBuffer.length).toBeGreaterThan(0);

    unlinkSync(tmpPath);
  });

  test("upscales small images to fit min_dim (preserves aspect ratio)", async () => {
    const small = await sharp({
      create: { width: 200, height: 100, channels: 3, background: "blue" },
    }).png().toBuffer();
    writeFileSync(tmpPath, small);

    const result = await loadImage(tmpPath, {
      min_dim: 768,
      max_dim: 3072,
    } as any);

    expect(result.width).toBe(768);
    expect(result.height).toBe(384);

    unlinkSync(tmpPath);
  });

  test("leaves mid-sized images untouched (within [min_dim, max_dim])", async () => {
    const mid = await sharp({
      create: { width: 1500, height: 1000, channels: 3, background: "green" },
    }).png().toBuffer();
    writeFileSync(tmpPath, mid);

    const result = await loadImage(tmpPath, {
      min_dim: 768,
      max_dim: 3072,
    } as any);

    expect(result.width).toBe(1500);
    expect(result.height).toBe(1000);

    unlinkSync(tmpPath);
  });
});
