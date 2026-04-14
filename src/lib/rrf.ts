export function rrf<T extends { id: string | number }>(lists: T[][], k = 60): T[] {
  const scores: Record<string, number> = {};
  const items: Record<string, T> = {};
  for (const list of lists) {
    list.forEach((item, rank) => {
      const id = String(item.id);
      scores[id] = (scores[id] ?? 0) + 1 / (k + rank + 1);
      items[id] = item;
    });
  }
  return Object.keys(scores)
    .sort((a, b) => scores[b] - scores[a])
    .map((id) => items[id])
    .filter(Boolean);
}
