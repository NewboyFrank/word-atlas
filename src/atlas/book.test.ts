import assert from "node:assert/strict";
import { test } from "node:test";
import { applyBook, type BookMeta } from "./book";
import type { Atlas, WordRef } from "./types";

function ref(id: string, order: number, media = 15): WordRef {
  return { id, word: id, zh: "n. 测试", ipa: "/t/", cefr: 2, topic: 3, media, order };
}

function fakeAtlas(): Atlas {
  const words = [ref("alpha", 0), ref("beta", 1), ref("gamma", 2, 1)];
  const byId = new Map(words.map((w) => [w.id, w]));
  return {
    id: "word-atlas-open",
    name: "全库",
    kind: "open",
    count: words.length,
    examples: 6,
    illustrated: 3,
    topics: [["science", "科学"]],
    cefr: ["A1", "A2", "B1", "B2", "C1", "C2"],
    words,
    byId,
    entry: async () => {
      throw new Error("not used");
    },
    peek: () => undefined,
    img: () => null,
    audio: () => null,
  };
}

const meta: BookMeta = { id: "word-atlas-chem", name: "化学英语", desc: "test", file: "chem.json" };

test("a book keeps its own order and drops unknown ids", () => {
  const base = fakeAtlas();
  const book = applyBook(base, meta, { id: meta.id, name: meta.name, words: ["gamma", "nope", "alpha"] });
  assert.deepEqual(
    book.words.map((w) => w.id),
    ["gamma", "alpha"],
  );
  assert.deepEqual(
    book.words.map((w) => w.order),
    [0, 1],
  );
  assert.equal(book.count, 2);
  assert.equal(book.id, "word-atlas-chem");
  assert.equal(book.name, "化学英语");
  assert.equal(book.examples, 4);
  assert.equal(book.illustrated, 2);
  assert.ok(book.byId.has("gamma"));
  assert.ok(!book.byId.has("beta"));
});

test("a book never reorders the base atlas", () => {
  const base = fakeAtlas();
  applyBook(base, meta, { id: meta.id, name: meta.name, words: ["gamma", "alpha"] });
  assert.deepEqual(
    base.words.map((w) => w.order),
    [0, 1, 2],
  );
});

test("no book file means the untouched base atlas", () => {
  const base = fakeAtlas();
  assert.equal(applyBook(base, meta, null), base);
});
