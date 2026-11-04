export const generateTaskCodePrefix = (projectName: string): string => {
  const words =
    projectName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .match(/[A-Z0-9]+/g) ?? [];

  if (words.length === 0) {
    return "PRJ";
  }

  if (words.length === 1) {
    return words[0].slice(0, 3);
  }

  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join("");
};