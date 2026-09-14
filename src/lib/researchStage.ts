const exactStageWeights: Record<string, number> = {
  "阶段信息不明确": 0,
  "不适用": 0,
  "理论或概念研究": 1,
  "体外研究": 2,
  "动物研究": 3,
  "临床前研究": 4,
  "早期人体研究": 5,
  "临床试验": 6,
  "监管批准": 7,
  "已获监管批准": 7,
};

export function researchStageWeight(stage: string) {
  if (stage in exactStageWeights) return exactStageWeights[stage];
  if (stage.includes("监管") || stage.includes("批准") || stage.includes("获批")) return 7;
  if (stage.includes("临床试验")) return 6;
  if (stage.includes("早期人体")) return 5;
  if (stage.includes("临床前")) return 4;
  if (stage.includes("动物")) return 3;
  if (stage.includes("体外")) return 2;
  if (stage.includes("理论") || stage.includes("概念")) return 1;
  return 0;
}

export function highestResearchStage(stages: string[]) {
  return [...stages].sort(
    (left, right) => researchStageWeight(right) - researchStageWeight(left),
  )[0] ?? "暂无关系";
}

export function relationStageLabel(stage: string) {
  if (stage === "不适用") return "不按研究阶段划分";
  if (stage === "阶段信息不明确") return "研究阶段待核验";
  return stage;
}

export function relationStageHint(stage: string) {
  if (stage === "不适用") {
    return "这是一条概念、支撑或结构关系，不代表某项研究的成熟度。";
  }
  if (stage === "阶段信息不明确") {
    return "已有关系记录，但当前资料不足以判断它对应的研究阶段。";
  }
  return undefined;
}
