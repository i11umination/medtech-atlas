import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonFiles = [
  "nodes.json",
  "relations.json",
  "evidence-index.json",
  "sources.json",
  "node-summaries.json",
  "analysis-index.json",
  "preference-options.json",
  "navigation-groups.json",
];

function update(relativePath, transform) {
  const absolutePath = path.join(projectRoot, relativePath);
  const original = fs.readFileSync(absolutePath, "utf8");
  const next = transform(original);
  if (next !== original) fs.writeFileSync(absolutePath, next, "utf8");
}

for (const file of jsonFiles) {
  update(path.join("data", file), (content) =>
    content
      .replaceAll('"schema_version": "1.1.0"', '"schema_version": "1.2.0"')
      .replaceAll('"needs-review"', '"source-checked"'),
  );
}

update(path.join("data", "evidence-index.json"), (content) =>
  content.replace(
    /^(\s*)"review_status": "source-checked",\r?\n(?!\s*"expert_review_status")/gm,
    '$1"review_status": "source-checked",\n$1"expert_review_status": "not-performed",\n$1"publication_status": "public",\n$1"curation_method": "machine-assisted",\n',
  ),
);

for (const directory of ["evidence", "node-summaries", "analysis"]) {
  const absoluteDirectory = path.join(projectRoot, directory);
  for (const file of fs.readdirSync(absoluteDirectory).filter((name) => name.endsWith(".md"))) {
    update(path.join(directory, file), (content) => content.replaceAll("review_status: needs-review", "review_status: source-checked"));
  }
}

for (const file of fs.readdirSync(path.join(projectRoot, "node-summaries")).filter((name) => name.endsWith(".md"))) {
  update(path.join("node-summaries", file), (content) =>
    content
      .replaceAll("待审核定义", "来源核验型定义")
      .replaceAll("待审核节点", "来源核验型节点")
      .replace(/；待[^。\r\n]*审核。/g, "；来源已核验，未经独立专家审核。")
      .replace(/；待审核。/g, "；来源已核验，未经独立专家审核。")
      .replace(/，待审核。/g, "；来源已核验，未经独立专家审核。"),
  );
}

for (const file of fs.readdirSync(path.join(projectRoot, "evidence")).filter((name) => name.endsWith(".md"))) {
  update(path.join("evidence", file), (content) => {
    if (content.includes("expert_review_status:")) return content;
    return content.replace(
      /^review_status: source-checked\r?$/m,
      "review_status: source-checked\nexpert_review_status: not-performed\npublication_status: public\ncuration_method: machine-assisted",
    );
  });
}

console.log("R1 状态迁移完成。");
