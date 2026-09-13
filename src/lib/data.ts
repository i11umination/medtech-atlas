import nodesDocument from "../../data/nodes.json";
import nodeSummariesDocument from "../../data/node-summaries.json";
import relationsDocument from "../../data/relations.json";
import evidenceDocument from "../../data/evidence-index.json";
import sourcesDocument from "../../data/sources.json";
import preferencesDocument from "../../data/preference-options.json";
import analysisDocument from "../../data/analysis-index.json";
import navigationDocument from "../../data/navigation-groups.json";
import type {
  EvidenceItem,
  FutureDirection,
  GraphNode,
  GraphRelation,
  NavigationGroup,
  NodeSummary,
  PreferenceOption,
  SourceItem,
} from "./types";

export const nodes = nodesDocument.items as GraphNode[];
export const nodeSummaries = nodeSummariesDocument.items as NodeSummary[];
export const relations = relationsDocument.items as GraphRelation[];
export const evidenceItems = evidenceDocument.items as EvidenceItem[];
export const sources = sourcesDocument.items as SourceItem[];
export const preferenceOptions = preferencesDocument.items as PreferenceOption[];
export const futureDirections = analysisDocument.items as FutureDirection[];
export const navigationGroups = navigationDocument.items as NavigationGroup[];

export const nodeById = new Map(nodes.map((node) => [node.id, node]));
export const nodeSummaryByNodeId = new Map(
  nodeSummaries.map((summary) => [summary.node_id, summary]),
);
export const relationById = new Map(
  relations.map((relation) => [relation.id, relation]),
);
export const evidenceById = new Map(
  evidenceItems.map((evidence) => [evidence.id, evidence]),
);
export const sourceById = new Map(sources.map((source) => [source.id, source]));
export const futureDirectionById = new Map(
  futureDirections.map((direction) => [direction.id, direction]),
);
export const navigationGroupById = new Map(
  navigationGroups.map((group) => [group.id, group]),
);

export const typeLabels: Record<GraphNode["type"], string> = {
  domain: "科学门类",
  capability: "核心能力",
  disease: "疾病与健康状态",
  clinical_problem: "临床问题",
  technology: "技术",
  research: "研究",
};

export const statusLabels: Record<string, string> = {
  draft: "资料待补充",
  "needs-review": "待医学审核",
  approved: "已审核",
  revise: "需要修订",
  blocked: "已阻断",
};
