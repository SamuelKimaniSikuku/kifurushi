// Certificates are a subset of documents. Other is never a wildcard.
// Used by browser recommendations and new-listing emails; mirrored in SQL.
export function acceptsContents(accepted: readonly string[], contents: readonly string[]): boolean {
  return contents.length > 0 && contents.every(c => accepted.includes(c) || (c === "certificates" && accepted.includes("documents")));
}
