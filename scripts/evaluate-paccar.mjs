import { processFile } from "../dist/pipeline.js";
import { parseConfig } from "../dist/config.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const config = parseConfig(undefined);
const pdfPath = "/srv/dev-disk-by-uuid-5c46439b-4f75-459d-9ec9-ebfef0ef3709/Pool/copyparty/Cross-Platform/PDF_Plugin_Benchmark/PACCAR_Total Rewards Guide_2026_US Salaried-2.pdf";

console.log("Processing PACCAR PDF (22 pages, ~6.9MB)...");
console.log("This will take several minutes (22 vision API calls, concurrency 4)...");

const start = Date.now();
const results = await processFile(pdfPath, {
  config,
  projectDir: "/tmp/vi-paccar-eval",
});
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\nCompleted in ${elapsed}s — ${results.length} pages processed`);

// Build a full text dump for evaluation
let fullOutput = "";
for (const r of results) {
  fullOutput += `\n${"=".repeat(80)}\nPAGE ${r.page} (${r.class}, ${r.merged.length} chars, vision: ${r.vision_status})\n${"=".repeat(80)}\n\n${r.merged}\n`;
}

mkdirSync("/root/Visual-Ingest/docs", { recursive: true });
const outputPath = "/root/Visual-Ingest/docs/paccar-eval-output.txt";
writeFileSync(outputPath, fullOutput);
console.log(`Full output written to: ${outputPath}`);
console.log(`Total output size: ${(fullOutput.length / 1024).toFixed(1)} KB`);

// Summary
const classCounts = {};
for (const r of results) {
  classCounts[r.class] = (classCounts[r.class] || 0) + 1;
}
const failures = results.filter(r => r.vision_status !== "ok").length;
console.log(`\nSummary:`);
console.log(`  Pages: ${results.length}`);
console.log(`  Classifications: ${JSON.stringify(classCounts)}`);
console.log(`  Vision failures: ${failures}`);
