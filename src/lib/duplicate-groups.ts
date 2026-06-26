export function sortDuplicateGroups<T extends { key: string }>(groups: T[]): T[] {
  return [...groups].sort((a, b) => {
    const [aLast = "", aFirst = ""] = a.key.split("|");
    const [bLast = "", bFirst = ""] = b.key.split("|");
    const byLast = aLast.localeCompare(bLast, "en", { sensitivity: "base" });
    if (byLast !== 0) return byLast;
    return aFirst.localeCompare(bFirst, "en", { sensitivity: "base" });
  });
}
