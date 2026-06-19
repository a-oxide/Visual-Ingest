import { extname } from "node:path";
import type { Config } from "./config.js";
import { mergePage, type PageClass, type VisionResult } from "./merge.js";
import { callVision } from "./vision.js";
import { renderPdf, getPdfPageCount, type RenderedPage } from "./pdf.js";
import { loadImage, type LoadedImage } from "./image.js";
import { makeSlug } from "./slug.js";
import {
  getDocDir,
  writeMeta,
  readMeta,
  shouldReuse,
  getSourceMtime,
  writeImage,
  writePage,
  readPage,
  type Meta,
  type StoredPage,
} from "./store.js";
import { parsePages } from "./pages.js";

export interface ProcessOptions {
  config: Config;
  projectDir: string;
  pages?: string;
  question?: string;
}

export interface ProcessResult {
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

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function processImageFile(
  filePath: string,
  opts: ProcessOptions,
  docDir: string,
): Promise<ProcessResult[]> {
  const { config, question } = opts;
  const img = await loadImage(filePath, config);

  await writeImage(docDir, 1, img.imageBuffer);

  const vision = await callVision(
    config,
    img.imageBuffer.toString("base64"),
    "image",
    null,
    question,
  );

  const merged = mergePage("image", null, vision);

  const stored: StoredPage = {
    page: 1,
    class: "image",
    charCount: merged.length,
    embedded_text: null,
    full_transcription: vision.full_transcription,
    visual_description: vision.visual_description,
    extra_text: null,
    merged,
    vision_status: vision.vision_status,
  };
  await writePage(docDir, 1, stored);

  return [{
    page: 1,
    class: "image",
    charCount: merged.length,
    embedded_text: null,
    full_transcription: vision.full_transcription,
    visual_description: vision.visual_description,
    extra_text: null,
    merged,
    vision_status: vision.vision_status,
  }];
}

async function processPdfFile(
  filePath: string,
  opts: ProcessOptions,
  docDir: string,
): Promise<ProcessResult[]> {
  const { config, pages, question } = opts;

  const totalPages = await getPdfPageCount(filePath);
  const pageNumbers = parsePages(pages, totalPages);
  if (pageNumbers instanceof Error) {
    throw pageNumbers;
  }

  const rendered = await renderPdf(filePath, pageNumbers, config);

  const results: ProcessResult[] = new Array(rendered.length);

  await runWithConcurrency(rendered, config.concurrency, async (page: RenderedPage, idx: number) => {
    await writeImage(docDir, page.pageNum, page.imageBuffer);

    const vision = await callVision(
      config,
      page.imageBuffer.toString("base64"),
      page.pageClass,
      page.embeddedText,
      question,
    );

    const merged = mergePage(page.pageClass, page.embeddedText, vision);

    const stored: StoredPage = {
      page: page.pageNum,
      class: page.pageClass,
      charCount: merged.length,
      embedded_text: page.embeddedText,
      full_transcription: vision.full_transcription,
      visual_description: vision.visual_description,
      extra_text: vision.extra_text,
      merged,
      vision_status: vision.vision_status,
    };
    await writePage(docDir, page.pageNum, stored);

    results[idx] = {
      page: page.pageNum,
      class: page.pageClass,
      charCount: merged.length,
      embedded_text: page.embeddedText,
      full_transcription: vision.full_transcription,
      visual_description: vision.visual_description,
      extra_text: vision.extra_text,
      merged,
      vision_status: vision.vision_status,
    };
  });

  return results.filter((r) => r !== undefined);
}

export async function processFile(
  filePath: string,
  opts: ProcessOptions,
): Promise<ProcessResult[]> {
  const { config, projectDir, pages, question } = opts;
  const ext = extname(filePath).toLowerCase();

  const isPdf = ext === ".pdf";
  const isImage = config.image_extensions.includes(ext);

  if (!isPdf && !isImage) {
    throw new Error(
      `read_visual supports PDF and image files (${config.image_extensions.join("/")})). Got: ${ext}`,
    );
  }

  const slug = makeSlug(filePath);
  const docDir = getDocDir(projectDir, slug);
  const mtime = await getSourceMtime(filePath);

  const existingMeta = await readMeta(docDir);
  if (shouldReuse(existingMeta, filePath, mtime, question)) {
    const results: ProcessResult[] = [];
    for (let p = 1; p <= existingMeta!.page_count; p++) {
      const stored = await readPage(docDir, p);
      if (stored) results.push(stored as ProcessResult);
    }
    if (results.length > 0) return results;
  }

  let results: ProcessResult[];
  if (isPdf) {
    results = await processPdfFile(filePath, opts, docDir);
  } else {
    results = await processImageFile(filePath, opts, docDir);
  }

  const status: Meta["status"] = results.every((r) => r.vision_status === "ok")
    ? "ok"
    : results.every((r) => r.vision_status === "failed")
      ? "failed"
      : "partial";

  await writeMeta(docDir, {
    source_path: filePath,
    source_mtime: mtime,
    page_count: results.length,
    model: config.model,
    endpoint: config.endpoint,
    rendered_at: Date.now(),
    question,
    status,
  });

  return results;
}
