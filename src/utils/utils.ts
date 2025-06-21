export function logEvent(type: string, details: any) {
    console.log(`[${type}]`, details);
}

export function extractJsonFromMarkdown(text: string): string {
    // Remove ```json ... ``` or ``` ... ```
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match ? match[1] : text;
}