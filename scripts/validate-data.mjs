import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataFiles = [
  "nodes.json",
  "relations.json",
  "evidence-index.json",
  "sources.json",
  "node-summaries.json",
  "analysis-index.json",
  "preference-options.json",
  "navigation-groups.json",
];

const errors = [];
const readJson = (relativePath) => {
  const absolutePath = path.join(projectRoot, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: 无法读取或解析 JSON（${error.message}）`);
    return null;
  }
};

const documents = Object.fromEntries(
  dataFiles.map((file) => [file, readJson(path.join("data", file))]),
);
const schema = readJson(path.join("schemas", "knowledge-graph.schema.json"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
ajv.addFormat("uri", {
  type: "string",
  validate: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
});

if (schema) {
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (error) {
    errors.push(`Schema: 无法编译（${error.message}）`);
  }

  if (validate) {
    for (const file of dataFiles) {
      const document = documents[file];
      if (!document || validate(document)) continue;
      for (const issue of validate.errors ?? []) {
        errors.push(`${path.join("data", file)}${issue.instancePath || ""}: ${issue.message}`);
      }
    }
  }
}

const items = (file) => documents[file]?.items ?? [];
const nodes = items("nodes.json");
const relations = items("relations.json");
const evidence = items("evidence-index.json");
const sources = items("sources.json");
const summaries = items("node-summaries.json");
const analyses = items("analysis-index.json");
const navigationGroups = items("navigation-groups.json");

const collectIds = (records, label) => {
  const ids = new Map();
  for (const record of records) {
    if (!record?.id) continue;
    if (ids.has(record.id)) errors.push(`${label}: 重复 ID ${record.id}`);
    ids.set(record.id, record);
  }
  return ids;
};

const nodeById = collectIds(nodes, "nodes");
const relationById = collectIds(relations, "relations");
const evidenceById = collectIds(evidence, "evidence");
const sourceById = collectIds(sources, "sources");
collectIds(analyses, "analysis");
const navigationById = collectIds(navigationGroups, "navigation-groups");

const requireId = (map, id, context) => {
  if (!map.has(id)) errors.push(`${context}: 引用不存在的 ID ${id}`);
};

for (const relation of relations) {
  requireId(nodeById, relation.source_id, `${relation.id}.source_id`);
  requireId(nodeById, relation.target_id, `${relation.id}.target_id`);
  for (const evidenceId of relation.evidence_ids ?? []) {
    requireId(evidenceById, evidenceId, `${relation.id}.evidence_ids`);
  }
}

for (const item of evidence) {
  for (const relationId of item.relation_ids ?? []) {
    requireId(relationById, relationId, `${item.id}.relation_ids`);
  }
  for (const sourceId of item.source_ids ?? []) {
    requireId(sourceById, sourceId, `${item.id}.source_ids`);
  }
}

for (const summary of summaries) {
  requireId(nodeById, summary.node_id, `${summary.node_id}.summary`);
  for (const sourceId of summary.source_ids ?? []) {
    requireId(sourceById, sourceId, `${summary.node_id}.source_ids`);
  }
}

for (const analysis of analyses) {
  for (const evidenceId of analysis.basis_evidence_ids ?? []) {
    requireId(evidenceById, evidenceId, `${analysis.id}.basis_evidence_ids`);
  }
}

for (const group of navigationGroups) {
  if (group.parent_id) requireId(navigationById, group.parent_id, `${group.id}.parent_id`);
  for (const childId of group.child_group_ids ?? []) {
    requireId(navigationById, childId, `${group.id}.child_group_ids`);
  }
  for (const nodeId of [...(group.primary_node_ids ?? []), ...(group.cross_node_ids ?? [])]) {
    requireId(nodeById, nodeId, `${group.id}.node_ids`);
  }
}

const contentRefs = [
  ...nodes.filter((node) => node.content_ref).map((node) => [node.id, node.content_ref]),
  ...evidence.map((item) => [item.id, item.content_ref]),
  ...analyses.map((item) => [item.id, item.content_ref]),
  ...summaries.map((item) => [item.node_id, item.content_ref]),
];
for (const [id, reference] of contentRefs) {
  const normalized = String(reference).replaceAll("\\", "/");
  if (path.isAbsolute(normalized) || normalized.split("/").includes("..")) {
    errors.push(`${id}.content_ref: 不允许使用项目目录外路径 ${reference}`);
    continue;
  }
  if (!fs.existsSync(path.join(projectRoot, normalized))) {
    errors.push(`${id}.content_ref: 文件不存在 ${reference}`);
  }
}

for (const item of evidence) {
  for (const relationId of item.relation_ids ?? []) {
    const relation = relationById.get(relationId);
    if (relation && !relation.evidence_ids.includes(item.id)) {
      errors.push(`${item.id} 与 ${relationId} 的证据引用不是双向一致`);
    }
  }
}
for (const relation of relations) {
  for (const evidenceId of relation.evidence_ids ?? []) {
    const item = evidenceById.get(evidenceId);
    if (item && !item.relation_ids.includes(relation.id)) {
      errors.push(`${relation.id} 与 ${evidenceId} 的证据引用不是双向一致`);
    }
  }
}

for (const source of sources.filter((item) => item.status === "blocked")) {
  for (const item of evidence) {
    if (item.source_ids.includes(source.id)) {
      errors.push(`${source.id} 已阻断，但仍被 ${item.id} 引用`);
    }
  }
}

const primaryMembership = new Map();
for (const group of navigationGroups) {
  for (const nodeId of group.primary_node_ids ?? []) {
    primaryMembership.set(nodeId, (primaryMembership.get(nodeId) ?? 0) + 1);
  }
}
for (const node of nodes) {
  const count = primaryMembership.get(node.id) ?? 0;
  if (count !== 1) errors.push(`${node.id}: 主导航归属数量为 ${count}，应为 1`);
}

const highRiskPhrases = ["彻底治愈", "保证疗效", "一定有效", "你可能患有"];
const markdownDirs = ["node-summaries", "evidence", "analysis", "review"];
for (const directory of markdownDirs) {
  const absoluteDir = path.join(projectRoot, directory);
  if (!fs.existsSync(absoluteDir)) continue;
  for (const file of fs.readdirSync(absoluteDir).filter((name) => name.endsWith(".md"))) {
    const relativePath = path.join(directory, file);
    const content = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    for (const phrase of highRiskPhrases) {
      if (content.includes(phrase)) errors.push(`${relativePath}: 检出高风险措辞“${phrase}”`);
    }
  }
}

if (errors.length > 0) {
  console.error(`数据验证失败：${errors.length} 项问题`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `数据验证通过：${nodes.length} 个节点、${relations.length} 条关系、${evidence.length} 张证据卡、${sources.length} 条来源、${analyses.length} 条未来方向。`,
  );
}
