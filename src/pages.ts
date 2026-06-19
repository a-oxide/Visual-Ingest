export function parsePages(spec: string | undefined, totalPages: number): number[] | Error {
  if (spec === undefined || spec === "") {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = spec.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = endStr === "" ? totalPages : parseInt(endStr, 10);

      if (isNaN(start) || (endStr !== "" && isNaN(end))) {
        return new Error(`invalid pages spec '${spec}'`);
      }
      if (start < 1 || (endStr !== "" && end < 1)) {
        return new Error(`invalid pages spec '${spec}'`);
      }
      if (start > end) {
        return new Error(`invalid pages spec '${spec}'`);
      }

      for (let i = start; i <= Math.min(end, totalPages); i++) {
        result.add(i);
      }
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < 1) {
        return new Error(`invalid pages spec '${spec}'`);
      }
      if (n <= totalPages) {
        result.add(n);
      }
    }
  }

  if (result.size === 0) {
    return new Error(`invalid pages spec '${spec}'`);
  }

  return Array.from(result).sort((a, b) => a - b);
}
