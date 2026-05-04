// Unambiguous alphabet: excludes 0/O, 1/I/L to avoid confusion when read aloud or handwritten
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReferenceCode(): string {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, "0");
  const d   = String(now.getDate()).padStart(2, "0");
  const rand = Array.from({ length: 4 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join("");
  return `GP-${y}${m}${d}-${rand}`;
}
