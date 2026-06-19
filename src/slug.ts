import { createHash } from "node:crypto";
import { basename } from "node:path";

export function makeSlug(absPath: string): string {
  const name = basename(absPath).replace(/\.[^.]+$/, "");
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  const hash = createHash("sha256")
    .update(absPath)
    .digest("hex")
    .slice(0, 6);
  return `${sanitized}-${hash}`;
}
