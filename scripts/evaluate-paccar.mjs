import { processFile } from "../dist/pipeline.js";
import { parseConfig } from "../dist/config.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Usage: node scripts/evaluate-paccar.mjs <path-to-pdf>");
  console.error("Example: node scripts/evaluate-paccar.mjs ./test-document.pdf");
  process.exit(1);
}

const config = parseConfig(undefined);
const projectDir = join(process.cwd(), "eval-tmp");
const outputPath = join(process.cwd(), "docs", "eval-output.txt");

console.log(`Processing: ${pdfPath}`);
console.log(`Output: ${outputPath}`);
console.log("(This will take several minutes for large PDFs)");

const start = Date.now();
const results = await processFile(resolve(pdfPath), {
  config,
  projectDir,
});
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\nCompleted in ${elapsed}s — ${results.length} pages processed`);

let fullOutput = "";
for (const r of results) {
  fullOutput += `\n${"=".repeat(80)}\nPAGE ${r.page} (${r.class}, ${r.merged.length} chars, vision: ${r.vision_status})\n${"=".repeat(80)}\n\n${r.merged}\n`;
}

mkdirSync(join(process.cwd(), "docs"), { recursive: true });
writeFileSync(outputPath, fullOutput);
console.log(`Full output written to: ${outputPath}`);
console.log(`Total output size: ${(fullOutput.length / 1024).toFixed(1)} KB`);

const classCounts = {};
for (const r of results) {
  classCounts[r.class] = (classCounts[r.class] || 0) + 1;
}
const failures = results.filter(r => r.vision_status !== "ok").length;
console.log(`\nSummary:`);
console.log(`  Pages: ${results.length}`);
console.log(`  Classifications: ${JSON.stringify(classCounts)}`);
console.log(`  Vision failures: ${failures}`);
