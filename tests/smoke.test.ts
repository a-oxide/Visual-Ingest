import { describe, test, expect } from "vitest";
import { callVision } from "../src/vision.js";
import { parseConfig } from "../src/config.js";

describe("smoke test — live zen endpoint", () => {
  test.skipIf(!process.env.VISUAL_INGEST_SMOKE)("processes a tiny image via real zen endpoint", async () => {
    const config = parseConfig(undefined);

    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAD0lEQVR42mP8z8BQz0AEYBxVSF8AAAAASUVORK5CYII=",
      "base64",
    );

    const result = await callVision(config, tinyPng.toString("base64"), "image", null);
    expect(result.vision_status).not.toBe("failed");
    expect(result.full_transcription.length + result.visual_description.length).toBeGreaterThan(0);
  }, 30000);
});
