export interface PageResult {
  page: number;
  class: string;
  charCount: number;
  merged: string;
  visionStatus: string;
}

export interface BudgetResult {
  content: string;
  truncated: boolean;
  nextFrom: number | null;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export function truncateToBudget(
  pages: PageResult[],
  budget: number,
  docSlug: string,
): BudgetResult {
  const indexLines = pages.map(
    (p) => `page ${p.page}: ${p.class}, ${p.charCount} chars, ${p.visionStatus}`,
  );
  const index = indexLines.join("\n");

  const totalTokens = estimateTokens(
    pages.map((p) => p.merged).join("\n\n"),
  );

  if (totalTokens <= budget) {
    const content = `## Index\n${index}\n\n${pages
      .map((p) => `\n---\n## Page ${p.page}\n\n${p.merged}`)
      .join("")}`;
    return { content, truncated: false, nextFrom: null };
  }

  let accumulated = "";
  let lastFit = 0;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const candidate = accumulated + "\n\n---\n## Page " + p.page + "\n\n" + p.merged;
    if (i === 0 || estimateTokens(candidate) <= budget) {
      accumulated = candidate;
      lastFit = p.page;
    } else {
      break;
    }
  }

  const remaining = pages.length - lastFit;
  const content = `## Index\n${index}\n\n${accumulated}\n\n[budget exceeded — ${remaining} more pages processed and stored at .opencode/visual-ingest/${docSlug}/. Call read_visual again with pages="${lastFit + 1}-" to load the next batch.]`;

  return { content, truncated: true, nextFrom: lastFit + 1 };
}
