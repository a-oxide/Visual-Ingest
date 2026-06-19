import { extname } from "node:path";
import { mergePage } from "./merge.js";
import { callVision } from "./vision.js";
import { renderPdf, getPdfPageCount } from "./pdf.js";
import { loadImage } from "./image.js";
import { makeSlug } from "./slug.js";
import { getDocDir, writeMeta, readMeta, shouldReuse, getSourceMtime, writeImage, writePage, readPage, } from "./store.js";
import { parsePages } from "./pages.js";
async function runWithConcurrency(items, concurrency, fn) {
    let index = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (index < items.length) {
            const i = index++;
            await fn(items[i], i);
        }
    });
    await Promise.all(workers);
}
async function processImageFile(filePath, opts, docDir) {
    const { config, question } = opts;
    const img = await loadImage(filePath, config);
    await writeImage(docDir, 1, img.imageBuffer);
    const vision = await callVision(config, img.imageBuffer.toString("base64"), "image", null, question);
    const merged = mergePage("image", null, vision);
    const stored = {
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
async function processPdfFile(filePath, opts, docDir) {
    const { config, pages, question } = opts;
    const totalPages = await getPdfPageCount(filePath);
    const pageNumbers = parsePages(pages, totalPages);
    if (pageNumbers instanceof Error) {
        throw pageNumbers;
    }
    const rendered = await renderPdf(filePath, pageNumbers, config);
    const results = new Array(rendered.length);
    await runWithConcurrency(rendered, config.concurrency, async (page, idx) => {
        await writeImage(docDir, page.pageNum, page.imageBuffer);
        const vision = await callVision(config, page.imageBuffer.toString("base64"), page.pageClass, page.embeddedText, question);
        const merged = mergePage(page.pageClass, page.embeddedText, vision);
        const stored = {
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
export async function processFile(filePath, opts) {
    const { config, projectDir, pages, question } = opts;
    const ext = extname(filePath).toLowerCase();
    const isPdf = ext === ".pdf";
    const isImage = config.image_extensions.includes(ext);
    if (!isPdf && !isImage) {
        throw new Error(`read_visual supports PDF and image files (${config.image_extensions.join("/")})). Got: ${ext}`);
    }
    const slug = makeSlug(filePath);
    const docDir = getDocDir(projectDir, slug);
    const mtime = await getSourceMtime(filePath);
    const existingMeta = await readMeta(docDir);
    if (shouldReuse(existingMeta, mtime, question)) {
        const results = [];
        for (let p = 1; p <= existingMeta.page_count; p++) {
            const stored = await readPage(docDir, p);
            if (stored)
                results.push(stored);
        }
        if (results.length > 0)
            return results;
    }
    let results;
    if (isPdf) {
        results = await processPdfFile(filePath, opts, docDir);
    }
    else {
        results = await processImageFile(filePath, opts, docDir);
    }
    const status = results.every((r) => r.vision_status === "ok")
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
