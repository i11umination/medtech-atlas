import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const canonicalGroups = [
  {
    id: "NAV-0010",
    name: "工程与信息科学",
    domains: [
      "机械工程",
      "电子与信息工程",
      "材料科学与工程",
      "计算机科学与人工智能",
      "化学工程",
      "自动化与控制科学",
    ],
  },
  {
    id: "NAV-0011",
    name: "基础科学",
    domains: ["物理学", "化学", "数学与统计学"],
  },
  {
    id: "NAV-0012",
    name: "生命与认知科学",
    domains: [
      "神经科学与认知科学",
      "分子与细胞生物学",
      "遗传学、基因组学与生物信息学",
      "免疫学",
      "药理学与药剂学",
    ],
  },
  {
    id: "NAV-0013",
    name: "交叉科学方向",
    domains: ["纳米科学", "再生医学与组织工程", "合成生物学"],
  },
];

const readItems = (file) => {
  const absolutePath = path.join(projectRoot, "data", file);
  const document = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  if (!Array.isArray(document.items)) throw new Error(`${file} 缺少 items 数组`);
  return document.items;
};

const unique = (values) => [...new Set(values)];
const displayCount = (values) => unique(values).length;
const displayList = (values) => (values.length ? values.join("、") : "无");

try {
  const nodes = readItems("nodes.json");
  const relations = readItems("relations.json");
  const evidence = readItems("evidence-index.json");
  const summaries = readItems("node-summaries.json");
  const navigationGroups = readItems("navigation-groups.json");

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const domainByName = new Map(
    nodes.filter((node) => node.type === "domain").map((node) => [node.name, node]),
  );
  const summaryByNodeId = new Map(summaries.map((summary) => [summary.node_id, summary]));
  const groupById = new Map(navigationGroups.map((group) => [group.id, group]));
  const primaryGroupByNodeId = new Map();

  for (const group of navigationGroups) {
    for (const nodeId of group.primary_node_ids ?? []) {
      const memberships = primaryGroupByNodeId.get(nodeId) ?? [];
      memberships.push(group.id);
      primaryGroupByNodeId.set(nodeId, memberships);
    }
  }

  const enabledTargets = (sourceIds, type) =>
    unique(
      relations
        .filter(
          (relation) =>
            relation.relation_type === "enables" &&
            sourceIds.includes(relation.source_id) &&
            nodeById.get(relation.target_id)?.type === type,
        )
        .map((relation) => relation.target_id),
    );

  const profiles = nodes
    .filter((node) => node.type === "domain")
    .map((domain) => {
      const capabilityIds = enabledTargets([domain.id], "capability");
      const technologyViaCapabilities = enabledTargets(capabilityIds, "technology");
      const directTechnologyIds = enabledTargets([domain.id], "technology");
      const technologyIds = unique([...technologyViaCapabilities, ...directTechnologyIds]);
      const applicationRelations = relations.filter(
        (relation) =>
          relation.relation_type === "applies_to" &&
          technologyIds.includes(relation.source_id) &&
          nodeById.get(relation.target_id)?.type === "clinical_problem",
      );
      const clinicalProblemIds = unique(applicationRelations.map((relation) => relation.target_id));
      const diseaseIds = unique(
        relations
          .filter(
            (relation) =>
              relation.relation_type === "has_clinical_problem" &&
              clinicalProblemIds.includes(relation.target_id) &&
              nodeById.get(relation.source_id)?.type === "disease",
          )
          .map((relation) => relation.source_id),
      );
      const evidenceIds = unique(applicationRelations.flatMap((relation) => relation.evidence_ids ?? []));

      let completePathCount = 0;
      for (const capabilityId of capabilityIds) {
        const capabilityTechnologyIds = enabledTargets([capabilityId], "technology");
        for (const technologyId of capabilityTechnologyIds) {
          const technologyApplications = applicationRelations.filter(
            (relation) =>
              relation.source_id === technologyId && (relation.evidence_ids?.length ?? 0) > 0,
          );
          for (const application of technologyApplications) {
            const upstreamDiseases = relations.filter(
              (relation) =>
                relation.relation_type === "has_clinical_problem" &&
                relation.target_id === application.target_id &&
                nodeById.get(relation.source_id)?.type === "disease",
            );
            completePathCount += upstreamDiseases.length;
          }
        }
      }

      return {
        id: domain.id,
        name: domain.name,
        capabilityIds,
        technologyIds,
        directTechnologyIds,
        clinicalProblemIds,
        diseaseIds,
        evidenceIds,
        completePathCount,
        reviewStatus: summaryByNodeId.get(domain.id)?.review_status ?? domain.status,
      };
    });

  const warnings = [];

  for (const canonicalGroup of canonicalGroups) {
    const missing = canonicalGroup.domains.filter((name) => !domainByName.has(name));
    if (missing.length > 0) {
      warnings.push(`${canonicalGroup.name}缺少 ${missing.length} 个门类：${displayList(missing)}`);
    }

    for (const name of canonicalGroup.domains) {
      const domain = domainByName.get(name);
      if (!domain) continue;
      const memberships = primaryGroupByNodeId.get(domain.id) ?? [];
      if (memberships.length !== 1 || memberships[0] !== canonicalGroup.id) {
        warnings.push(
          `${domain.id} ${domain.name} 的主导航为 ${displayList(memberships)}，预期为 ${canonicalGroup.id}`,
        );
      }
    }

    const group = groupById.get(canonicalGroup.id);
    const landedCount = canonicalGroup.domains.filter((name) => domainByName.has(name)).length;
    if (group?.status === "active" && landedCount === 0) {
      warnings.push(`${canonicalGroup.id} ${canonicalGroup.name} 已标为 active，但尚无门类节点`);
    }
  }

  const relationKeys = new Map();
  for (const relation of relations) {
    const key = `${relation.source_id}|${relation.target_id}|${relation.relation_type}`;
    const ids = relationKeys.get(key) ?? [];
    ids.push(relation.id);
    relationKeys.set(key, ids);
  }
  for (const [key, ids] of relationKeys) {
    if (ids.length > 1) warnings.push(`关系复合键重复：${key}（${ids.join("、")}）`);
  }

  const nameOwners = new Map();
  for (const domain of nodes.filter((node) => node.type === "domain")) {
    for (const value of [domain.name, ...(domain.aliases ?? [])]) {
      const normalized = value.trim().toLocaleLowerCase("zh-CN");
      const owners = nameOwners.get(normalized) ?? [];
      owners.push(domain.id);
      nameOwners.set(normalized, owners);
    }
  }
  for (const [name, owners] of nameOwners) {
    if (unique(owners).length > 1) {
      warnings.push(`门类名称或别名冲突：“${name}”同时属于 ${unique(owners).join("、")}`);
    }
  }

  for (const profile of profiles) {
    if (profile.completePathCount < 2) {
      warnings.push(
        `${profile.id} ${profile.name} 只有 ${profile.completePathCount} 条“能力—技术—临床问题—健康状态—证据”完整路径，低于 2 条`,
      );
    }
    const capabilityTechnologySet = new Set(enabledTargets(profile.capabilityIds, "technology"));
    const legacyOnly = profile.directTechnologyIds.filter((id) => !capabilityTechnologySet.has(id));
    if (legacyOnly.length > 0) {
      warnings.push(`${profile.id} ${profile.name} 仍有 ${legacyOnly.length} 个技术绕过核心能力层`);
    }
  }

  const evidenceByClinicalProblem = new Map();
  for (const relation of relations.filter((item) => item.relation_type === "applies_to")) {
    const current = evidenceByClinicalProblem.get(relation.target_id) ?? [];
    current.push(...(relation.evidence_ids ?? []));
    evidenceByClinicalProblem.set(relation.target_id, current);
  }
  const concentration = [...evidenceByClinicalProblem.entries()]
    .map(([nodeId, ids]) => ({ nodeId, count: displayCount(ids) }))
    .sort((left, right) => right.count - left.count)[0];
  if (concentration && evidence.length > 0 && concentration.count / evidence.length > 0.5) {
    warnings.push(
      `${nodeById.get(concentration.nodeId)?.name ?? concentration.nodeId}连接 ${concentration.count}/${evidence.length} 张证据卡，内容集中度超过 50%`,
    );
  }

  const evidenceByDisease = new Map();
  for (const relation of relations.filter((item) => item.relation_type === "has_clinical_problem")) {
    const clinicalEvidence = evidenceByClinicalProblem.get(relation.target_id) ?? [];
    const current = evidenceByDisease.get(relation.source_id) ?? [];
    current.push(...clinicalEvidence);
    evidenceByDisease.set(relation.source_id, current);
  }
  const diseaseConcentration = [...evidenceByDisease.entries()]
    .map(([nodeId, ids]) => ({ nodeId, count: displayCount(ids) }))
    .sort((left, right) => right.count - left.count)[0];
  if (
    diseaseConcentration &&
    evidence.length > 0 &&
    diseaseConcentration.count / evidence.length > 0.5
  ) {
    warnings.push(
      `${nodeById.get(diseaseConcentration.nodeId)?.name ?? diseaseConcentration.nodeId}覆盖 ${diseaseConcentration.count}/${evidence.length} 张证据卡，疾病层内容集中度超过 50%`,
    );
  }

  const landedDomains = canonicalGroups.flatMap((group) => group.domains).filter((name) => domainByName.has(name));
  const canonicalDomainCount = canonicalGroups.reduce((sum, group) => sum + group.domains.length, 0);
  const statusCounts = evidence.reduce((counts, item) => {
    counts[item.review_status] = (counts[item.review_status] ?? 0) + 1;
    return counts;
  }, {});

  console.log("内容覆盖软审计（不阻断构建）");
  console.log(`口径：${canonicalDomainCount} 个批准门类；当前落地 ${landedDomains.length} 个，缺少 ${canonicalDomainCount - landedDomains.length} 个。`);
  console.log(`证据卡：${evidence.length} 张；审核状态 ${Object.entries(statusCounts).map(([status, count]) => `${status}=${count}`).join("，")}。`);
  if (diseaseConcentration && concentration) {
    console.log(
      `集中度：疾病层最高为 ${nodeById.get(diseaseConcentration.nodeId)?.name ?? diseaseConcentration.nodeId} ${diseaseConcentration.count}/${evidence.length}（${(diseaseConcentration.count / evidence.length * 100).toFixed(1)}%）；临床问题层最高为 ${nodeById.get(concentration.nodeId)?.name ?? concentration.nodeId} ${concentration.count}/${evidence.length}（${(concentration.count / evidence.length * 100).toFixed(1)}%）。`,
    );
  }
  console.log("");
  console.log("| 门类 | 核心能力 | 技术 | 临床问题 | 疾病与健康状态 | 独立应用证据 | 完整路径 | 审核状态 |");
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const profile of profiles) {
    console.log(
      `| ${profile.name} | ${profile.capabilityIds.length} | ${profile.technologyIds.length} | ${profile.clinicalProblemIds.length} | ${profile.diseaseIds.length} | ${profile.evidenceIds.length} | ${profile.completePathCount} | ${profile.reviewStatus} |`,
    );
  }
  console.log("");
  console.log(`发现 ${warnings.length} 项覆盖提醒：`);
  for (const warning of warnings) console.log(`- ${warning}`);
  console.log("");
  console.log("说明：以上均为软提醒；命令只在数据文件无法读取或解析时返回失败。");
} catch (error) {
  console.error(`内容覆盖审计无法完成：${error.message}`);
  process.exitCode = 1;
}
