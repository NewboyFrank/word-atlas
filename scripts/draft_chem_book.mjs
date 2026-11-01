#!/usr/bin/env node
/** Draft chemistry word book: dump candidates from the open dataset for manual review. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "data/word-atlas.json"), "utf8"));

// Strong chemistry signals, applied to id / headword / zh / english senses+examples.
const STRONG =
  /(化学|chemic|元素周期|periodic table|(?:^|\W)atom|原子|分子|molecul|离子|(?:^|\W)ion|酸|acid|碱|alkali|溶液|solution|溶剂|solvent|溶质|solute|溶解|dissolv|化合物|compound|氧化物|oxid|燃烧|combust|催化剂|catalys|腐蚀|corros|合金|alloy|中和|neutrali[sz]|蒸馏|distill|试管|烧杯|实验|laborator|氢|氧|碳|氮|氦|氖|氩|氯|硫|磷|钠|钾|钙|铁锈|rust|metallic|(?:^|\W)metal|纯净物|混合物|mixture|试剂|reagent|化学式|formula|化学键|chemical bond|电解|electrolysis|燃料|fuel|气体|gas\b|液体|liquid|固体|solid|沸点|boiling point|熔点|melting point|密度|density|pH)/;

const rel = (w) => [w.senses.map((s) => `${s.en}`).join(" "), ...w.ex.map((e) => e.en)].join(" ");
const hit = (w) =>
  STRONG.test(w.id) ||
  STRONG.test(w.w) ||
  STRONG.test(w.senses.map((s) => s.zh).join("｜")) ||
  STRONG.test(w.senses.map((s) => s.en).join(" ")) ||
  STRONG.test(rel(w));

const science = words.filter((w) => w.topic === "science");
const strongAny = words.filter(hit);
const strongOutside = strongAny.filter((w) => w.topic !== "science");
const scienceIds = new Set(science.map((w) => w.id));

const cefrOf = (w) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(w.cefr);
const line = (w, mark) =>
  `| ${mark} | \`${w.id}\` | ${w.w} | ${w.cefr} | ${w.senses.map((s) => `${s.pos} ${s.zh}`).join("；")} |`;

let md = `# 化学词书候选清单（草稿）\n\n> 生成：scripts/draft_chem_book.mjs · 共 ${strongAny.length} 个强信号词，其中 ${scienceIds.size && strongAny.filter((w) => scienceIds.has(w.id)).length} 个来自科学话题\n\n`;
md += `## A. 强信号词（全部，按难度）\n\n| 来源 | id | 词头 | CEFR | 释义 |\n|---|---|---|---|---|\n`;
[...strongAny].sort((a, b) => cefrOf(a) - cefrOf(b) || a.id.localeCompare(b.id)).forEach((w) => {
  md += line(w, scienceIds.has(w.id) ? "科学" : w.topic) + "\n";
});

md += `\n## B. 科学话题但无强信号的词（可能有物理/生物词，用于人工排查）\n\n| 来源 | id | 词头 | CEFR | 释义 |\n|---|---|---|---|---|\n`;
[...science.filter((w) => !strongAny.some((s) => s.id === w.id))].sort((a, b) => cefrOf(a) - cefrOf(b) || a.id.localeCompare(b.id)).forEach((w) => {
  md += line(w, "科学") + "\n";
});

fs.writeFileSync(path.join(root, "data/book-chem-draft.md"), md);
console.log(
  JSON.stringify({
    strongTotal: strongAny.length,
    strongInScience: strongAny.filter((w) => scienceIds.has(w.id)).length,
    scienceTotal: science.length,
    scienceRest: science.length - strongAny.filter((w) => scienceIds.has(w.id)).length,
    out: "data/book-chem-draft.md",
  }),
);
