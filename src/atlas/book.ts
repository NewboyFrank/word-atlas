import { MEDIA, type Atlas, type WordRef } from "./types";

/** A word book: a curated subset of the open atlas that reuses its media. */
export interface BookMeta {
  id: string;
  name: string;
  desc: string;
  /** Book definition under public/books/; null means the full open atlas. */
  file: string | null;
}

export interface BookFile {
  id: string;
  name: string;
  words: string[];
  examples?: number;
  illustrated?: number;
}

/**
 * Derive a book view from the loaded base atlas. Media and entries stay on the
 * base atlas, so a book is just an ordered slice of existing words.
 */
export function applyBook(base: Atlas, meta: BookMeta, book: BookFile | null): Atlas {
  if (!book) return base;
  const words: WordRef[] = [];
  for (const id of book.words) {
    const ref = base.byId.get(id);
    if (ref) words.push({ ...ref, order: words.length });
  }
  return {
    ...base,
    id: meta.id,
    name: meta.name,
    count: words.length,
    examples: book.examples ?? words.length * 2,
    illustrated: book.illustrated ?? words.filter((w) => w.media & MEDIA.img).length,
    words,
    byId: new Map(words.map((w) => [w.id, w])),
  };
}
