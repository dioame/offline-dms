function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function buildFacedBatchPdfFilename(
  cityMunicipality: string,
  barangay?: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const parts = ["FACED", slugify(cityMunicipality)];
  if (barangay?.trim()) {
    parts.push(slugify(barangay));
  }
  parts.push(date);
  return `${parts.filter(Boolean).join("_")}.pdf`;
}
