export type ProfessionalBlock =
  | { type: "paragraph"; text: string }
  | { type: "unordered-list" | "ordered-list"; items: string[] };

export interface ProfessionalSection {
  heading: string;
  sourceHeading: string;
  text: string;
  blocks: ProfessionalBlock[];
  overlap: number;
}

export interface ProfessionalSummaryAnalysis {
  sections: ProfessionalSection[];
  omittedSectionCount: number;
  totalSectionCount: number;
}

export const PROFESSIONAL_OVERLAP_THRESHOLD = 0.3;

export const REDUNDANT_PROFESSIONAL_HEADINGS = new Set([
  "一句话说明",
  "通俗简介",
  "通俗解释",
  "医学连接",
  "为什么与医学有关",
  "与医学的连接",
  "与技术的连接",
  "与本图谱的连接",
  "医学应用",
  "医学研究应用",
  "技术如何介入",
  "临床问题",
  "关联科学门类与技术",
  "本库关注点",
  "主要启示",
  "与功能重建的连接",
  "当前边界",
  "边界",
  "判断边界",
  "解释边界",
]);

const PROFESSIONAL_HEADING_LABELS: Record<string, string> = {
  "科研摘要": "专业定位",
  "当前证据或研究阶段": "证据与研究阶段",
  "当前证据阶段": "证据与研究阶段",
  "当前阶段": "证据与研究阶段",
  "当前证据边界": "证据边界",
  "当前证据与分类边界": "证据与分类边界",
  "已知限制、风险与不确定性": "专业限制与不确定性",
  "风险与限制": "专业限制与风险",
  "仍待回答的问题": "仍待回答的专业问题",
};

interface RawSection {
  heading: string;
  lines: string[];
}

function parseRawSections(markdown: string): RawSection[] {
  const lines = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").split(/\r?\n/);
  const sections: RawSection[] = [];
  let current: RawSection | undefined;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      current = { heading: heading[1], lines: [] };
      continue;
    }
    if (current && !/^#\s+/.test(line)) current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function sectionText(lines: string[]) {
  return lines
    .map((line) => line.replace(/^\s*(?:[-*+] |\d+\.\s+)/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function ngrams(text: string, size = 2) {
  const normalized = text
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\p{P}\p{S}\p{Z}\s]/gu, "");
  const grams = new Set<string>();
  for (let index = 0; index <= normalized.length - size; index += 1) {
    grams.add(normalized.slice(index, index + size));
  }
  return grams;
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const item of left) {
    if (right.has(item)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function maxPublicOverlap(text: string, publicParagraphs: string[]) {
  const sectionGrams = ngrams(text);
  return publicParagraphs.reduce(
    (maximum, paragraph) => Math.max(maximum, jaccard(sectionGrams, ngrams(paragraph))),
    0,
  );
}

function parseBlocks(lines: string[]): ProfessionalBlock[] {
  const blocks: ProfessionalBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    const unordered = lines[index].match(/^\s*[-*+]\s+(.+)$/);
    if (unordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*[-*+]\s+(.+)$/);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    const ordered = lines[index].match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*\d+\.\s+(.+)$/);
        if (!match) break;
        items.push(match[1].trim());
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length
      && lines[index].trim()
      && !/^\s*(?:[-*+] |\d+\.\s+)/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    if (paragraph.length > 0) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

export function analyzeProfessionalSummary(
  markdown: string,
  publicParagraphs: string[],
): ProfessionalSummaryAnalysis {
  const rawSections = parseRawSections(markdown);
  const sections = rawSections.flatMap((section) => {
    if (REDUNDANT_PROFESSIONAL_HEADINGS.has(section.heading)) return [];
    const text = sectionText(section.lines);
    if (!text) return [];
    const overlap = maxPublicOverlap(text, publicParagraphs);
    if (overlap >= PROFESSIONAL_OVERLAP_THRESHOLD) return [];
    return [{
      heading: PROFESSIONAL_HEADING_LABELS[section.heading] ?? section.heading,
      sourceHeading: section.heading,
      text,
      blocks: parseBlocks(section.lines),
      overlap,
    }];
  });

  return {
    sections,
    omittedSectionCount: rawSections.length - sections.length,
    totalSectionCount: rawSections.length,
  };
}
