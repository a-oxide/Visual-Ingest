import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
export async function ensureDir(dir) {
    await mkdir(dir, { recursive: true });
}
export async function writeMeta(dir, meta) {
    await ensureDir(dir);
    await writeFile(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
}
export async function readMeta(dir) {
    const path = join(dir, "meta.json");
    if (!existsSync(path))
        return null;
    const data = await readFile(path, "utf-8");
    return JSON.parse(data);
}
export function shouldReuse(meta, sourcePath, sourceMtime, question) {
    if (!meta)
        return false;
    if (meta.source_path !== sourcePath)
        return false;
    if (meta.source_mtime !== sourceMtime)
        return false;
    if (meta.question !== question)
        return false;
    return true;
}
export async function getSourceMtime(path) {
    const s = await stat(path);
    return s.mtimeMs;
}
export async function writeImage(dir, pageNum, imageBuffer, ext = ".png") {
    await ensureDir(dir);
    const padded = String(pageNum).padStart(3, "0");
    await writeFile(join(dir, `page-${padded}${ext}`), imageBuffer);
}
export async function writePage(dir, pageNum, data) {
    await ensureDir(dir);
    const padded = String(pageNum).padStart(3, "0");
    await writeFile(join(dir, `page-${padded}.json`), JSON.stringify(data, null, 2));
}
export async function readPage(dir, pageNum) {
    const padded = String(pageNum).padStart(3, "0");
    const path = join(dir, `page-${padded}.json`);
    if (!existsSync(path))
        return null;
    const data = await readFile(path, "utf-8");
    return JSON.parse(data);
}
export function getDocDir(projectDir, slug) {
    return join(projectDir, ".opencode", "visual-ingest", slug);
}
