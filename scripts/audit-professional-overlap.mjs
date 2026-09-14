import fs from "node:fs";
import path from "node:path";
import {
  analyzeProfessionalSummary,
  PROFESSIONAL_OVERLAP_THRESHOLD,
  REDUNDANT_PROFESSIONAL_HEADINGS,
} from "../src/lib/professionalSummary.ts";

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const publicConnections = readJson("data/public-connections.json");
const summaryIndex = readJson("data/node-summaries.json");
const publicByNodeId = new Map(publicConnections.items.map((item) => [item.node_id, item]));

const errors = [];
const reports = [];

for (const summary of summaryIndex.items) {
  const publicConnection = publicByNodeId.get(summary.node_id);
  if (!publicConnection) {
    errors.push(`${summary.node_id}: 缺少大众解释，无法执行专业层去重`);
    continue;
  }

  const markdownPath = path.join(root, summary.content_ref);
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const analysis = analyzeProfessionalSummary(markdown, publicConnection.paragraphs);

  for (const section of analysis.sections) {
    if (REDUNDANT_PROFESSIONAL_HEADINGS.has(section.sourceHeading)) {
      errors.push(`${summary.node_id}: 重复职责章节仍在专业层显示：${section.sourceHeading}`);
    }
    if (section.overlap >= PROFESSIONAL_OVERLAP_THRESHOLD) {
      errors.push(`${summary.node_id}: “${section.sourceHeading}”与大众解释重合度过高`);
    }
  }

  reports.push({ nodeId: summary.node_id, ...analysis });
}

if (errors.length > 0) {
  console.error("专业说明去重审计失败：");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const visiblePages = reports.filter((item) => item.sections.length > 0).length;
const hiddenPages = reports.length - visiblePages;
const visibleSections = reports.reduce((sum, item) => sum + item.sections.length, 0);
const omittedSections = reports.reduce((sum, item) => sum + item.omittedSectionCount, 0);
const highestVisibleOverlap = reports.reduce(
  (maximum, item) => Math.max(maximum, ...item.sections.map((section) => section.overlap), 0),
  0,
);

console.log("专业说明去重审计通过：");
console.log(`- 审计页面：${reports.length}`);
console.log(`- 保留专业补充的页面：${visiblePages}`);
console.log(`- 因无新增信息而隐藏入口的页面：${hiddenPages}`);
console.log(`- 展示专业章节：${visibleSections}`);
console.log(`- 省略重复或高重合章节：${omittedSections}`);
console.log(`- 已展示章节最高文字重合度：${(highestVisibleOverlap * 100).toFixed(1)}%`);
