import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string, config?: unknown): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, config);
}
