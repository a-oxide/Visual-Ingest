import { readFile } from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
export function classifyPage(textChars, textDensity) {
    if (textChars < 50)
        return "image-only";
    if (textChars >= 500 && textDensity >= 5)
        return "text-rich";
    return "mixed";
}
function computeScale(pageWidth, pageHeight, minDim, maxDim) {
    const longest = Math.max(pageWidth, pageHeight);
    if (longest >= maxDim)
        return maxDim / longest;
    if (longest < minDim)
        return minDim / longest;
    return 1;
}
export async function renderPdf(pdfPath, pageNumbers, config) {
    const data = await readFile(pdfPath);
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(data),
        useSystemFonts: true,
    });
    const doc = await loadingTask.promise;
    const pages = [];
    for (const pageNum of pageNumbers) {
        const page = await doc.getPage(pageNum);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = computeScale(baseViewport.width, baseViewport.height, config.min_dim, config.max_dim);
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");
        await page.render({
            canvas: null,
            canvasContext: ctx,
            viewport,
        }).promise;
        const imageBuffer = canvas.toBuffer("image/png");
        const textContent = await page.getTextContent();
        const embeddedText = textContent.items
            .map((item) => item.str)
            .join(" ");
        const textChars = embeddedText.length;
        const pageArea = viewport.width * viewport.height;
        const textDensity = textChars / (pageArea / 1000);
        const pageClass = classifyPage(textChars, textDensity);
        pages.push({
            pageNum,
            imageBuffer,
            embeddedText,
            pageClass,
            width: viewport.width,
            height: viewport.height,
        });
    }
    await loadingTask.destroy();
    return pages;
}
export async function getPdfPageCount(pdfPath) {
    const data = await readFile(pdfPath);
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(data),
        useSystemFonts: true,
    });
    const doc = await loadingTask.promise;
    const count = doc.numPages;
    await loadingTask.destroy();
    return count;
}
