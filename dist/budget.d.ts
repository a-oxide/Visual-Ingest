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
export declare function estimateTokens(text: string): number;
export declare function truncateToBudget(pages: PageResult[], budget: number, docSlug: string): BudgetResult;
