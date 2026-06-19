import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface Meta {
  source_path: string;
  source_mtime: number;
  page_count: number;
  model: string;
  endpoint: string;
  rendered_at: number;
  question: string | undefined;
  status: "ok" | "partial" | "failed";
}

export interface StoredPage {
  page: number;
  class: string;
  charCount: number;
  embedded_text: string | null;
  full_transcription: string;
  visual_description: string;
  extra_text: string | null;
  merged: string;
  vision_status: string;
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeMeta(dir: string, meta: Meta): Promise<void> {
  await ensureDir(dir);
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
}

export async function readMeta(dir: string): Promise<Meta | null> {
  const path = join(dir, "meta.json");
  if (!existsSync(path)) return null;
  const data = await readFile(path, "utf-8");
  return JSON.parse(data) as Meta;
}

export function shouldReuse(
  meta: Meta | null,
  sourceMtime: number,
  question: string | undefined,
): boolean {
  if (!meta) return false;
  if (meta.source_mtime !== sourceMtime) return false;
  if (meta.question !== question) return false;
  return true;
}

export async function getSourceMtime(path: string): Promise<number> {
  const s = await stat(path);
  return s.mtimeMs;
}

export async function writeImage(
  dir: string,
  pageNum: number,
  imageBuffer: Buffer,
  ext: string = ".png",
): Promise<void> {
  await ensureDir(dir);
  const padded = String(pageNum).padStart(3, "0");
  await writeFile(join(dir, `page-${padded}${ext}`), imageBuffer);
}

export async function writePage(
  dir: string,
  pageNum: number,
  data: StoredPage,
): Promise<void> {
  await ensureDir(dir);
  const padded = String(pageNum).padStart(3, "0");
  await writeFile(join(dir, `page-${padded}.json`), JSON.stringify(data, null, 2));
}

export async function readPage(
  dir: string,
  pageNum: number,
): Promise<StoredPage | null> {
  const padded = String(pageNum).padStart(3, "0");
  const path = join(dir, `page-${padded}.json`);
  if (!existsSync(path)) return null;
  const data = await readFile(path, "utf-8");
  return JSON.parse(data) as StoredPage;
}

export function getDocDir(projectDir: string, slug: string): string {
  return join(projectDir, ".opencode", "visual-ingest", slug);
}
