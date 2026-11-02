export const statusFrom = (value = "") => {
  const text = value.toLowerCase();
  if (/\b(upcoming|coming|opens|opening|not yet open)\b/.test(text)) return "upcoming";
  if (/^(live|open|open now|currently open)$/i.test(text.trim())) return "open";
  if (text.includes("listed")) return "listed";
  if (text.includes("allotment") || text.includes("closed")) return "closed";
  if (text.includes("coming") || text.includes("upcoming")) return "upcoming";
  return "announced";
};
