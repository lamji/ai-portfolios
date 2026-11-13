import { llmsTxt } from "@/lib/seo";

/** /llms.txt: a plain-text profile for AI answer engines, generated from the content file. */
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
