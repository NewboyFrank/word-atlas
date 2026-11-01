#!/usr/bin/env node
/** Build the chemistry word book from words that already exist in the open atlas. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const all = JSON.parse(fs.readFileSync(path.join(root, "data/word-atlas.json"), "utf8"));
const byId = new Map(all.map((w) => [w.id, w]));
const index = JSON.parse(fs.readFileSync(path.join(root, "public/atlas/index.json"), "utf8"));
const mediaById = new Map(index.words.map((r) => [r[0], r[6]]));

// Curated chemistry vocabulary (all headwords exist in the open dataset).
const WORDS = [
  // 学科与基本概念
  "chemistry", "chemist", "chemical", "alchemy",
  "element", "compound", "mixture", "substance", "homogeneous",
  "atomic", "electron", "nucleus", "nuclear", "react",
  // 酸碱与溶液
  "acid", "neutralize", "salt", "hardness",
  "solution", "concentration", "dilute", "soluble", "solvent",
  "precipitate", "residue", "crystal",
  // 物态与分离
  "evaporate", "distil", "vapour", "steam", "melt", "fluid",
  "liquid", "gas", "solid", "plasma", "diffuse", "equilibrium",
  // 元素
  "hydrogen", "oxygen", "nitrogen", "carbon", "iron", "copper",
  "zinc", "mercury", "nickel", "calcium", "aluminium", "sulphur", "radium",
  // 实验室
  "laboratory", "experiment", "experimental", "glassware", "fume",
  // 材料与冶金
  "metal", "metallic", "alloy", "steel", "ore", "mineral", "limestone",
  "ingot", "metallurgy", "pyrite", "slag", "malleable",
  "rust", "oxide", "oxidize", "peroxide",
  // 有机与工业化学
  "polymer", "benzene", "ammonia", "nitrate", "sulphide", "glycerin",
  "catalyst", "combustion", "ignite", "inflammable",
  "synthesis", "fermentation", "yeast", "aerosol", "saline",
  // 核化学
  "reactor", "fission", "fusion",
  // 生物化学
  "protein", "carbohydrate",
];

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const missing = WORDS.filter((id) => !byId.has(id));
if (missing.length) {
  console.error("missing ids:", missing);
  process.exit(1);
}
const dupes = WORDS.filter((id, i) => WORDS.indexOf(id) !== i);
if (dupes.length) {
  console.error("duplicate ids:", dupes);
  process.exit(1);
}

const entries = WORDS.map((id) => byId.get(id));
const noMedia = entries.filter((w) => ((mediaById.get(w.id) ?? 0) & 15) !== 15);
const sorted = [...entries].sort(
  (a, b) => CEFR.indexOf(a.cefr) - CEFR.indexOf(b.cefr) || a.id.localeCompare(b.id),
);

const book = {
  id: "word-atlas-chem",
  name: "化学英语",
  desc: "从开放词库挑出的化学词条 · 插画与英美音沿用原库",
  words: sorted.map((w) => w.id),
  examples: sorted.reduce((n, w) => n + w.ex.length, 0),
  illustrated: sorted.length,
};

fs.mkdirSync(path.join(root, "public/books"), { recursive: true });
fs.writeFileSync(path.join(root, "public/books/chem-core.json"), JSON.stringify(book, null, 0) + "\n");

console.log(
  JSON.stringify({
    words: book.words.length,
    examples: book.examples,
    cefr: Object.fromEntries(CEFR.map((l) => [l, sorted.filter((w) => w.cefr === l).length])),
    entriesWithFullMedia: sorted.length - noMedia.length,
    missingMedia: noMedia.map((w) => w.id),
  }),
);
