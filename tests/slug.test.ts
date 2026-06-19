import { describe, test, expect } from "vitest";
import { makeSlug } from "../src/slug.js";

describe("makeSlug", () => {
  test("simple filename produces sanitized name + 6-char hex hash", () => {
    expect(makeSlug("/home/user/offerletter.pdf")).toMatch(
      /^offerletter-[a-f0-9]{6}$/
    );
  });

  test("spaces and special chars are sanitized to dashes", () => {
    expect(makeSlug("/tmp/My Document (v2).pdf")).toMatch(
      /^my-document-v2-[a-f0-9]{6}$/
    );
  });

  test("unicode non-ASCII chars become dashes", () => {
    expect(makeSlug("/tmp/Géotechnique.pdf")).toMatch(
      /^g-otechnique-[a-f0-9]{6}$/
    );
  });

  test("same-named files in different dirs produce different slugs", () => {
    const a = makeSlug("/home/user/report.pdf");
    const b = makeSlug("/home/admin/report.pdf");
    expect(a).not.toBe(b);
    expect(a.startsWith("report")).toBe(true);
    expect(b.startsWith("report")).toBe(true);
  });
});
