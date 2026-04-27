export function normalizeMarkdownContent(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
}
