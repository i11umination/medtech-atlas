import { useEffect, useMemo, useState } from "react";
import type {
  EvidenceItem,
  GraphNode,
  GraphRelation,
  NavigationGroup,
  NodeType,
} from "../lib/types";

const STORAGE_KEY = "med-tech-preferences-v1";
const MAX_THEME_NODES = 40;
const nodeTypeOrder: NodeType[] = [
  "domain",
  "capability",
  "technology",
  "clinical_problem",
  "disease",
  "research",
];
const typeLabels: Record<NodeType, string> = {
  domain: "科学门类",
  capability: "核心能力",
  disease: "疾病与健康状态",
  clinical_problem: "临床问题",
  technology: "技术",
  research: "研究",
};
const colors: Record<NodeType, string> = {
  domain: "#d97706",
  capability: "#2f7d62",
  disease: "#b84b62",
  clinical_problem: "#7c3aed",
  technology: "#087f8c",
  research: "#64748b",
};
const axisColors: Record<NavigationGroup["axis"], string> = {
  science: "#d97706",
  medicine: "#b84b62",
  evidence: "#526b78",
};
const axisLabels: Record<NavigationGroup["axis"], string> = {
  science: "科学与技术",
  medicine: "疾病与临床",
  evidence: "研究与证据",
};
const interestNodeMap: Record<string, string[]> = {
  rehabilitation_robotics: ["TEC-0001"],
  surgical_robotics: ["TEC-0004", "TEC-0007"],
  prosthetics_exoskeletons: ["TEC-0002", "TEC-0003"],
  micro_interventional_robotics: ["TEC-0005"],
  medical_imaging_automation: ["TEC-0006"],
  laboratory_automation: ["TEC-0007"],
};

type Layer =
  | { kind: "roots" }
  | { kind: "group"; groupId: string }
  | { kind: "theme"; focusId: string }
  | { kind: "evidence"; relationId: string };

type Selection =
  | { kind: "node"; id: string }
  | { kind: "relation"; id: string }
  | null;

type SortMode = "default" | "name" | "evidence";

type NodeMetric = {
  relationCount: number;
  evidenceCount: number;
  highestStage: string;
};

function initialLayer(
  nodeIds: Set<string>,
  relationIds: Set<string>,
  groupIds: Set<string>,
): Layer {
  if (typeof window === "undefined") return { kind: "roots" };
  const params = new URLSearchParams(window.location.search);
  const relationId = params.get("relation");
  const focusId = params.get("focus");
  const groupId = params.get("group");
  if (relationId && relationIds.has(relationId)) return { kind: "evidence", relationId };
  if (focusId && nodeIds.has(focusId)) return { kind: "theme", focusId };
  if (groupId && groupIds.has(groupId)) return { kind: "group", groupId };
  return { kind: "roots" };
}

function stageWeight(stage: string) {
  if (stage.includes("监管") || stage.includes("批准")) return 7;
  if (stage.includes("临床试验")) return 6;
  if (stage.includes("早期人体")) return 5;
  if (stage.includes("临床前")) return 4;
  if (stage.includes("动物")) return 3;
  if (stage.includes("体外")) return 2;
  if (stage.includes("理论") || stage.includes("概念")) return 1;
  return 0;
}

function metricStageLabel(metric: NodeMetric) {
  if (metric.evidenceCount === 0) return "尚无直接证据";
  if (metric.highestStage === "阶段信息不明确") return "阶段待核验";
  if (metric.highestStage === "不适用") return "结构关系";
  return metric.highestStage;
}

export default function LayeredGraphExplorer({
  nodes,
  relations,
  evidenceItems,
  navigationGroups,
}: {
  nodes: GraphNode[];
  relations: GraphRelation[];
  evidenceItems: EvidenceItem[];
  navigationGroups: NavigationGroup[];
}) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const relationMap = useMemo(
    () => new Map(relations.map((relation) => [relation.id, relation])),
    [relations],
  );
  const evidenceMap = useMemo(
    () => new Map(evidenceItems.map((item) => [item.id, item])),
    [evidenceItems],
  );
  const groupMap = useMemo(
    () => new Map(navigationGroups.map((group) => [group.id, group])),
    [navigationGroups],
  );
  const primaryGroupByNode = useMemo(() => {
    const result = new Map<string, NavigationGroup>();
    navigationGroups.forEach((group) => {
      group.primary_node_ids.forEach((id) => result.set(id, group));
    });
    return result;
  }, [navigationGroups]);
  const rootGroups = useMemo(
    () => navigationGroups.filter((group) => group.parent_id === null),
    [navigationGroups],
  );
  const nodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);
  const relationIds = useMemo(
    () => new Set(relations.map((relation) => relation.id)),
    [relations],
  );
  const groupIds = useMemo(
    () => new Set(navigationGroups.map((group) => group.id)),
    [navigationGroups],
  );
  const [layer, setLayer] = useState<Layer>(() => initialLayer(nodeIds, relationIds, groupIds));
  const [selection, setSelection] = useState<Selection>(null);
  const [lastFocusId, setLastFocusId] = useState<string | null>(() =>
    layer.kind === "theme"
      ? layer.focusId
      : layer.kind === "evidence"
        ? relationMap.get(layer.relationId)?.source_id ?? null
        : null,
  );
  const [lastRelationId, setLastRelationId] = useState<string | null>(() =>
    layer.kind === "evidence" ? layer.relationId : null,
  );
  const [scope, setScope] = useState<"global" | "recommended">("global");
  const [types, setTypes] = useState<NodeType[]>([
    "domain",
    "capability",
    "disease",
    "clinical_problem",
    "technology",
  ]);
  const [preferredNodeIds, setPreferredNodeIds] = useState<string[]>([]);
  const [themeDepth, setThemeDepth] = useState<1 | 2>(1);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("default");

  const descendantNodeIds = useMemo(() => {
    const cache = new Map<string, Set<string>>();
    const collect = (groupId: string, trail = new Set<string>()): Set<string> => {
      if (cache.has(groupId)) return cache.get(groupId) ?? new Set<string>();
      if (trail.has(groupId)) return new Set<string>();
      const nextTrail = new Set(trail).add(groupId);
      const group = groupMap.get(groupId);
      const result = new Set<string>([
        ...(group?.primary_node_ids ?? []),
        ...(group?.cross_node_ids ?? []),
      ]);
      group?.child_group_ids.forEach((childId) => {
        collect(childId, nextTrail).forEach((id) => result.add(id));
      });
      cache.set(groupId, result);
      return result;
    };
    navigationGroups.forEach((group) => collect(group.id));
    return cache;
  }, [groupMap, navigationGroups]);

  const recommendedNodeIds = useMemo(() => {
    const recommended = new Set(preferredNodeIds);
    for (let step = 0; step < 2; step += 1) {
      relations.forEach((relation) => {
        if (recommended.has(relation.source_id)) recommended.add(relation.target_id);
        if (recommended.has(relation.target_id)) recommended.add(relation.source_id);
      });
    }
    return recommended;
  }, [preferredNodeIds, relations]);

  const relationsByNode = useMemo(() => {
    const result = new Map<string, GraphRelation[]>();
    nodes.forEach((node) => result.set(node.id, []));
    relations.forEach((relation) => {
      result.get(relation.source_id)?.push(relation);
      result.get(relation.target_id)?.push(relation);
    });
    return result;
  }, [nodes, relations]);

  const nodeMetrics = useMemo(() => {
    const working = new Map<string, {
      relationIds: Set<string>;
      evidenceIds: Set<string>;
      highestStage: string;
      highestRank: number;
    }>();
    nodes.forEach((node) => working.set(node.id, {
      relationIds: new Set<string>(),
      evidenceIds: new Set<string>(),
      highestStage: "尚未标注",
      highestRank: -1,
    }));
    relations.forEach((relation) => {
      [relation.source_id, relation.target_id].forEach((id) => {
        const metric = working.get(id);
        if (!metric) return;
        metric.relationIds.add(relation.id);
        relation.evidence_ids.forEach((evidenceId) => metric.evidenceIds.add(evidenceId));
        const rank = stageWeight(relation.research_stage);
        if (rank > metric.highestRank) {
          metric.highestRank = rank;
          metric.highestStage = relation.research_stage;
        }
      });
    });
    return new Map<string, NodeMetric>(
      [...working.entries()].map(([id, metric]) => [id, {
        relationCount: metric.relationIds.size,
        evidenceCount: metric.evidenceIds.size,
        highestStage: metric.highestStage,
      }]),
    );
  }, [nodes, relations]);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
          interests?: string[];
        };
        setPreferredNodeIds(
          (stored.interests ?? []).flatMap((interest) => interestNodeMap[interest] ?? []),
        );
      } catch {
        setPreferredNodeIds([]);
      }
    };
    loadPreferences();
    window.addEventListener("med-tech-preferences-updated", loadPreferences);
    return () => window.removeEventListener("med-tech-preferences-updated", loadPreferences);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    url.searchParams.delete("group");
    url.searchParams.delete("focus");
    url.searchParams.delete("relation");
    if (layer.kind === "group") {
      url.searchParams.set("view", "framework");
      url.searchParams.set("group", layer.groupId);
    }
    if (layer.kind === "theme") {
      url.searchParams.set("view", "theme");
      url.searchParams.set("focus", layer.focusId);
    }
    if (layer.kind === "evidence") {
      url.searchParams.set("view", "evidence");
      url.searchParams.set("relation", layer.relationId);
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [layer]);

  const resetLocalView = () => {
    setSelection(null);
    setQuery("");
    setSortBy("default");
  };

  const openRoots = () => {
    resetLocalView();
    setLayer({ kind: "roots" });
  };

  const openGroup = (groupId: string) => {
    const group = groupMap.get(groupId);
    if (group?.axis === "evidence") {
      setTypes((current) => current.includes("research") ? current : [...current, "research"]);
    }
    resetLocalView();
    setLayer({ kind: "group", groupId });
  };

  const openTheme = (focusId: string) => {
    setLastFocusId(focusId);
    setThemeDepth(1);
    resetLocalView();
    setLayer({ kind: "theme", focusId });
  };

  const openEvidence = (relationId: string) => {
    const relation = relationMap.get(relationId);
    if (relation) setLastFocusId(relation.source_id);
    setLastRelationId(relationId);
    resetLocalView();
    setLayer({ kind: "evidence", relationId });
  };

  const currentGroup = layer.kind === "group" ? groupMap.get(layer.groupId) : undefined;
  const currentFocus = layer.kind === "theme" ? nodeMap.get(layer.focusId) : undefined;
  const currentEvidenceRelation = layer.kind === "evidence"
    ? relationMap.get(layer.relationId)
    : undefined;
  const selectedNode = selection?.kind === "node" ? nodeMap.get(selection.id) : undefined;
  const selectedRelation = selection?.kind === "relation"
    ? relationMap.get(selection.id)
    : undefined;

  const groupTrail = (group: NavigationGroup | undefined) => {
    const trail: NavigationGroup[] = [];
    let current = group;
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      trail.unshift(current);
      visited.add(current.id);
      current = current.parent_id ? groupMap.get(current.parent_id) : undefined;
    }
    return trail;
  };

  const breadcrumbGroups = layer.kind === "group"
    ? groupTrail(currentGroup)
    : layer.kind === "theme"
      ? groupTrail(primaryGroupByNode.get(layer.focusId))
      : layer.kind === "evidence"
        ? groupTrail(primaryGroupByNode.get(currentEvidenceRelation?.source_id ?? ""))
        : [];

  const backOneLevel = () => {
    if (layer.kind === "group") {
      if (currentGroup?.parent_id) openGroup(currentGroup.parent_id);
      else openRoots();
      return;
    }
    if (layer.kind === "theme") {
      const group = primaryGroupByNode.get(layer.focusId);
      if (group) openGroup(group.id);
      else openRoots();
      return;
    }
    if (layer.kind === "evidence" && currentEvidenceRelation) {
      openTheme(currentEvidenceRelation.source_id);
    }
  };

  const toggleType = (type: NodeType) => {
    setTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };

  const normalizedQuery = query.trim().toLowerCase();
  const isNodeInScope = (id: string) =>
    scope === "global"
    || preferredNodeIds.length === 0
    || recommendedNodeIds.has(id);
  const nodeMatchesQuery = (node: GraphNode) => {
    if (!normalizedQuery) return true;
    return [node.name, ...node.aliases, ...node.tags]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  };
  const isVisibleNode = (node: GraphNode) =>
    types.includes(node.type) && isNodeInScope(node.id) && nodeMatchesQuery(node);

  const sortNodes = (items: GraphNode[]) => {
    const sorted = [...items];
    if (sortBy === "name") {
      sorted.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
    }
    if (sortBy === "evidence") {
      sorted.sort((left, right) => {
        const difference = (nodeMetrics.get(right.id)?.evidenceCount ?? 0)
          - (nodeMetrics.get(left.id)?.evidenceCount ?? 0);
        return difference || left.name.localeCompare(right.name, "zh-CN");
      });
    }
    return sorted;
  };

  const themeNeighborhood = useMemo(() => {
    if (layer.kind !== "theme") {
      return { nodes: [] as GraphNode[], depths: new Map<string, 1 | 2>(), secondHopCount: 0 };
    }
    const acceptsNode = (id: string) => {
      const candidate = nodeMap.get(id);
      if (!candidate || !types.includes(candidate.type)) return false;
      return scope === "global"
        || preferredNodeIds.length === 0
        || recommendedNodeIds.has(id);
    };
    const oneHopIds = new Set<string>();
    relations.forEach((relation) => {
      if (relation.source_id === layer.focusId && acceptsNode(relation.target_id)) {
        oneHopIds.add(relation.target_id);
      }
      if (relation.target_id === layer.focusId && acceptsNode(relation.source_id)) {
        oneHopIds.add(relation.source_id);
      }
    });
    const secondHopIds = new Set<string>();
    relations.forEach((relation) => {
      const fromSource = oneHopIds.has(relation.source_id);
      const fromTarget = oneHopIds.has(relation.target_id);
      if (!fromSource && !fromTarget) return;
      const otherId = fromSource ? relation.target_id : relation.source_id;
      if (
        otherId !== layer.focusId
        && !oneHopIds.has(otherId)
        && acceptsNode(otherId)
      ) {
        secondHopIds.add(otherId);
      }
    });
    const depths = new Map<string, 1 | 2>();
    oneHopIds.forEach((id) => depths.set(id, 1));
    secondHopIds.forEach((id) => depths.set(id, 2));
    const visibleIds = [
      ...oneHopIds,
      ...(themeDepth === 2 ? secondHopIds : []),
    ].slice(0, MAX_THEME_NODES);
    return {
      nodes: visibleIds.map((id) => nodeMap.get(id)).filter((node): node is GraphNode => Boolean(node)),
      depths,
      secondHopCount: secondHopIds.size,
    };
  }, [layer, nodeMap, preferredNodeIds.length, recommendedNodeIds, relations, scope, themeDepth, types]);

  const childGroups = currentGroup
    ? currentGroup.child_group_ids
        .map((id) => groupMap.get(id))
        .filter((group): group is NavigationGroup => Boolean(group))
    : [];

  const groupNodeCandidates = currentGroup && childGroups.length === 0
    ? [...new Set([...currentGroup.primary_node_ids, ...currentGroup.cross_node_ids])]
        .map((id) => nodeMap.get(id))
        .filter((node): node is GraphNode => Boolean(node))
    : [];

  const visibleNodes = sortNodes(
    (layer.kind === "theme" ? themeNeighborhood.nodes : groupNodeCandidates)
      .filter(isVisibleNode),
  );

  const nodeSections = nodeTypeOrder
    .map((type) => ({ type, nodes: visibleNodes.filter((node) => node.type === type) }))
    .filter((section) => section.nodes.length > 0);

  const groupStats = (group: NavigationGroup) => {
    const ids = descendantNodeIds.get(group.id) ?? new Set<string>();
    const evidenceIds = new Set<string>();
    ids.forEach((id) => {
      relationsByNode.get(id)?.forEach((relation) => {
        relation.evidence_ids.forEach((evidenceId) => evidenceIds.add(evidenceId));
      });
    });
    return { nodeCount: ids.size, evidenceCount: evidenceIds.size };
  };

  const groupMatchesView = (group: NavigationGroup) => {
    const ids = descendantNodeIds.get(group.id) ?? new Set<string>();
    const hasScopedNode = scope === "global"
      || preferredNodeIds.length === 0
      || [...ids].some((id) => recommendedNodeIds.has(id));
    if (!hasScopedNode) return false;
    if (!normalizedQuery) return true;
    const ownText = [group.name, group.description, ...group.planned_items]
      .join(" ")
      .toLowerCase();
    if (ownText.includes(normalizedQuery)) return true;
    return [...ids].some((id) => {
      const node = nodeMap.get(id);
      return node ? nodeMatchesQuery(node) : false;
    });
  };

  const sortGroups = (items: NavigationGroup[]) => {
    const sorted = [...items];
    if (sortBy === "name") {
      sorted.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
    }
    if (sortBy === "evidence") {
      sorted.sort((left, right) => {
        const difference = groupStats(right).evidenceCount - groupStats(left).evidenceCount;
        return difference || left.name.localeCompare(right.name, "zh-CN");
      });
    }
    return sorted;
  };

  const visibleGroups = sortGroups(
    (layer.kind === "roots" ? rootGroups : childGroups).filter(groupMatchesView),
  );

  const selectedNodeRelations = selectedNode
    ? [...(relationsByNode.get(selectedNode.id) ?? [])].sort((left, right) => {
        if (currentFocus) {
          const leftTouchesFocus = left.source_id === currentFocus.id || left.target_id === currentFocus.id;
          const rightTouchesFocus = right.source_id === currentFocus.id || right.target_id === currentFocus.id;
          if (leftTouchesFocus !== rightTouchesFocus) return leftTouchesFocus ? -1 : 1;
        }
        return right.evidence_ids.length - left.evidence_ids.length;
      })
    : [];

  const selectedRelationGroups = selectedNode
    ? nodeTypeOrder
        .map((type) => ({
          type,
          relations: selectedNodeRelations.filter((relation) => {
            const otherId = relation.source_id === selectedNode.id
              ? relation.target_id
              : relation.source_id;
            return nodeMap.get(otherId)?.type === type;
          }),
        }))
        .filter((group) => group.relations.length > 0)
    : [];

  const evidenceCards = currentEvidenceRelation
    ? currentEvidenceRelation.evidence_ids
        .map((id) => evidenceMap.get(id))
        .filter((item): item is EvidenceItem => Boolean(item))
        .filter((item) => !normalizedQuery || [item.title, item.claim, item.findings]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery))
    : [];

  const currentLayerLabel = layer.kind === "roots"
    ? "第 0 层 · 全局框架"
    : layer.kind === "group"
      ? `第 ${Math.min(2, (currentGroup?.level ?? 0) + 1)} 层 · 分组浏览`
      : layer.kind === "theme"
        ? "第 3 层 · 主题关联"
        : "第 4 层 · 证据卡";

  const mainTitle = layer.kind === "roots"
    ? "选择一条探索入口"
    : currentGroup?.name
      ?? currentFocus?.name
      ?? (currentEvidenceRelation
        ? `${nodeMap.get(currentEvidenceRelation.source_id)?.name ?? "来源节点"} → ${nodeMap.get(currentEvidenceRelation.target_id)?.name ?? "目标节点"}`
        : "内容浏览");

  const mainDescription = layer.kind === "roots"
    ? "从科学能力、医学问题或研究证据进入；每一层只展示当前范围内的内容。"
    : currentGroup?.description
      ?? (layer.kind === "theme"
        ? `按类型查看与“${currentFocus?.name ?? "当前节点"}”直接相关的内容，需要时可展开第二跳。`
        : currentEvidenceRelation?.mechanism_summary ?? "查看这条关系所绑定的直接证据。");

  const renderGroupCard = (group: NavigationGroup) => {
    const metrics = groupStats(group);
    return (
      <article className="catalog-card catalog-group-card" style={{ borderTopColor: axisColors[group.axis] }} key={group.id}>
        <button type="button" className="catalog-card-action" onClick={() => openGroup(group.id)}>
          <span className="catalog-card-kicker" style={{ color: axisColors[group.axis] }}>
            {axisLabels[group.axis]} · 第 {group.level} 层
          </span>
          <span className="catalog-card-title">{group.name}</span>
          <span className="catalog-card-description">{group.description}</span>
          <span className="catalog-card-metrics">
            <span><strong>{metrics.nodeCount}</strong> 节点</span>
            <span><strong>{metrics.evidenceCount}</strong> 证据</span>
            <span>{group.child_group_ids.length > 0 ? `${group.child_group_ids.length} 个下级分组` : "进入内容"}</span>
          </span>
          {group.planned_items.length > 0 && (
            <span className="catalog-card-planned">待扩展：{group.planned_items.slice(0, 3).join("、")}</span>
          )}
          <span className="catalog-card-enter">进入这一层 <i aria-hidden="true">→</i></span>
        </button>
      </article>
    );
  };

  const renderNodeCard = (node: GraphNode) => {
    const metric = nodeMetrics.get(node.id) ?? {
      relationCount: 0,
      evidenceCount: 0,
      highestStage: "尚未标注",
    };
    const depth = themeNeighborhood.depths.get(node.id);
    const contextualRelations = currentFocus
      ? (relationsByNode.get(node.id) ?? []).filter((relation) =>
          relation.source_id === currentFocus.id || relation.target_id === currentFocus.id)
      : [];
    const supportingText = contextualRelations.length > 0
      ? [...new Set(contextualRelations.map((relation) => relation.label))].slice(0, 2).join(" · ")
      : node.aliases.length > 0
        ? `也称：${node.aliases.slice(0, 2).join("、")}`
        : node.tags.slice(0, 3).join(" · ") || "查看关联与证据";
    return (
      <article
        className={`catalog-card catalog-node-card${selection?.kind === "node" && selection.id === node.id ? " active" : ""}`}
        style={{ borderTopColor: colors[node.type] }}
        key={node.id}
      >
        <button type="button" className="catalog-card-action" onClick={() => setSelection({ kind: "node", id: node.id })}>
          <span className="catalog-card-kicker" style={{ color: colors[node.type] }}>
            {typeLabels[node.type]}{depth ? ` · ${depth === 1 ? "直接关联" : "第二跳"}` : ""}
          </span>
          <span className="catalog-card-title">{node.name}</span>
          <span className="catalog-card-description">{supportingText}</span>
          <span className="catalog-card-metrics">
            <span><strong>{metric.relationCount}</strong> 关联</span>
            <span><strong>{metric.evidenceCount}</strong> 证据</span>
          </span>
          <span className="catalog-card-stage">
            {metric.evidenceCount > 0 ? `最高阶段：${metricStageLabel(metric)}` : metricStageLabel(metric)}
          </span>
          <span className="catalog-card-enter">查看关联 <i aria-hidden="true">→</i></span>
        </button>
      </article>
    );
  };

  const hasGridResults = visibleGroups.length > 0 || nodeSections.length > 0;
  const evidenceSourceNode = currentEvidenceRelation
    ? nodeMap.get(currentEvidenceRelation.source_id)
    : undefined;
  const evidenceTargetNode = currentEvidenceRelation
    ? nodeMap.get(currentEvidenceRelation.target_id)
    : undefined;

  return (
    <div className="layered-explorer catalog-explorer">
      <header className="graph-level-toolbar">
        <div className="graph-view-tabs" role="tablist" aria-label="图谱视图层级">
          <button className={layer.kind === "roots" || layer.kind === "group" ? "active" : ""} type="button" onClick={openRoots}>
            全局框架
          </button>
          <button className={layer.kind === "theme" ? "active" : ""} type="button" disabled={!lastFocusId} onClick={() => lastFocusId && openTheme(lastFocusId)}>
            主题探索
          </button>
          <button className={layer.kind === "evidence" ? "active" : ""} type="button" disabled={!lastRelationId} onClick={() => lastRelationId && openEvidence(lastRelationId)}>
            证据链
          </button>
        </div>
        <nav className="graph-level-breadcrumb" aria-label="图谱层级路径">
          <button type="button" onClick={openRoots}>全局</button>
          {breadcrumbGroups.map((group) => (
            <span key={group.id}><i aria-hidden="true">/</i><button type="button" onClick={() => openGroup(group.id)}>{group.name}</button></span>
          ))}
          {currentFocus && <span><i aria-hidden="true">/</i><strong>{currentFocus.name}</strong></span>}
          {currentEvidenceRelation && <span><i aria-hidden="true">/</i><strong>证据链</strong></span>}
        </nav>
        <span className="graph-level-label">{currentLayerLabel}</span>
      </header>

      <div className={`catalog-explorer-app${selection ? " has-drawer" : ""}`}>
        <aside className="explorer-controls catalog-controls" aria-label="内容筛选">
          <div className="control-block">
            <span className="control-label">当前层级</span>
            <strong className="current-layer-name">
              {currentGroup?.name ?? currentFocus?.name ?? (currentEvidenceRelation ? "单条关系证据链" : "全局框架")}
            </strong>
            <p className="control-note">点击格子查看关联；导航分组会直接进入下一层。</p>
            {layer.kind === "theme" && themeNeighborhood.secondHopCount > 0 && (
              <button
                className="button button-quiet full-button graph-secondary-action"
                type="button"
                aria-pressed={themeDepth === 2}
                onClick={() => setThemeDepth((current) => current === 1 ? 2 : 1)}
              >
                {themeDepth === 1
                  ? `展开第二跳（${themeNeighborhood.secondHopCount} 个节点）`
                  : "收起第二跳"}
              </button>
            )}
          </div>
          <div className="control-block">
            <span className="control-label">内容范围</span>
            <div className="segmented-control">
              <button className={scope === "global" ? "active" : ""} type="button" onClick={() => setScope("global")}>全局</button>
              <button className={scope === "recommended" ? "active" : ""} type="button" onClick={() => setScope("recommended")}>与我相关</button>
            </div>
            {scope === "recommended" && preferredNodeIds.length === 0 && <p className="control-note">请先在首页设置研究方向；当前仍显示完整内容。</p>}
          </div>
          <div className="control-block">
            <span className="control-label">节点类型</span>
            <div className="filter-list">
              {nodeTypeOrder.map((type) => (
                <label key={type}>
                  <input type="checkbox" checked={types.includes(type)} onChange={() => toggleType(type)} />
                  <i style={{ backgroundColor: colors[type] }}></i>
                  {typeLabels[type]}
                </label>
              ))}
            </div>
            <p className="control-note">研究节点默认折叠，可在此手动展开。</p>
          </div>
          <button className="button button-quiet full-button" type="button" disabled={layer.kind === "roots"} onClick={backOneLevel}>← 返回上一层</button>
        </aside>

        <main className="catalog-main">
          <header className="catalog-main-header">
            <div>
              <span className="eyebrow">{currentLayerLabel}</span>
              <h2>{mainTitle}</h2>
              <p>{mainDescription}</p>
            </div>
            <div className="catalog-view-note"><strong>格子视图</strong><span>按类型分区，不再绘制全量连线</span></div>
          </header>

          <div className="catalog-toolbar" role="search">
            <label className="catalog-search">
              <span>搜索当前层</span>
              <input
                type="search"
                value={query}
                placeholder={layer.kind === "evidence" ? "搜索证据标题、结论或发现" : "搜索名称、别名或标签"}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {layer.kind !== "evidence" && (
              <label className="catalog-sort">
                <span>排序</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)}>
                  <option value="default">默认顺序</option>
                  <option value="name">按名称</option>
                  <option value="evidence">按证据数量</option>
                </select>
              </label>
            )}
          </div>

          {(layer.kind === "roots" || (layer.kind === "group" && childGroups.length > 0)) && (
            <section className="catalog-section">
              <div className="catalog-section-header">
                <div><span className="catalog-section-index">01</span><h3>{layer.kind === "roots" ? "探索入口" : "下级分组"}</h3></div>
                <span>{visibleGroups.length} 个分组</span>
              </div>
              {visibleGroups.length > 0 ? (
                <div className="catalog-card-grid catalog-group-grid">{visibleGroups.map(renderGroupCard)}</div>
              ) : (
                <div className="catalog-empty"><strong>当前筛选下没有分组</strong><p>可以清空搜索、恢复“全局”范围，或调整节点类型。</p></div>
              )}
            </section>
          )}

          {((layer.kind === "group" && childGroups.length === 0) || layer.kind === "theme") && (
            <div className="catalog-sections">
              {nodeSections.map((section, index) => (
                <section className="catalog-section" key={section.type}>
                  <div className="catalog-section-header">
                    <div><span className="catalog-section-index">{String(index + 1).padStart(2, "0")}</span><h3>{typeLabels[section.type]}</h3></div>
                    <span>{section.nodes.length} 个节点</span>
                  </div>
                  <div className="catalog-card-grid">{section.nodes.map(renderNodeCard)}</div>
                </section>
              ))}
              {!hasGridResults && (
                <div className="catalog-empty"><strong>当前筛选下没有节点</strong><p>可以清空搜索、恢复“全局”范围，或勾选更多节点类型。</p></div>
              )}
            </div>
          )}

          {layer.kind === "evidence" && currentEvidenceRelation && (
            <div className="catalog-sections">
              <section className="catalog-section">
                <div className="catalog-section-header">
                  <div><span className="catalog-section-index">01</span><h3>关系路径</h3></div>
                  <span>{currentEvidenceRelation.research_stage}</span>
                </div>
                <div className="catalog-relation-path">
                  {evidenceSourceNode && (
                    <button type="button" className="catalog-path-node" onClick={() => setSelection({ kind: "node", id: evidenceSourceNode.id })} style={{ borderColor: colors[evidenceSourceNode.type] }}>
                      <span>{typeLabels[evidenceSourceNode.type]}</span>
                      <strong>{evidenceSourceNode.name}</strong>
                    </button>
                  )}
                  <button type="button" className="catalog-path-relation" onClick={() => setSelection({ kind: "relation", id: currentEvidenceRelation.id })}>
                    <span>{currentEvidenceRelation.label}</span><i aria-hidden="true">→</i>
                  </button>
                  {evidenceTargetNode && (
                    <button type="button" className="catalog-path-node" onClick={() => setSelection({ kind: "node", id: evidenceTargetNode.id })} style={{ borderColor: colors[evidenceTargetNode.type] }}>
                      <span>{typeLabels[evidenceTargetNode.type]}</span>
                      <strong>{evidenceTargetNode.name}</strong>
                    </button>
                  )}
                </div>
              </section>
              <section className="catalog-section">
                <div className="catalog-section-header">
                  <div><span className="catalog-section-index">02</span><h3>直接证据</h3></div>
                  <span>{evidenceCards.length} 张证据卡</span>
                </div>
                {evidenceCards.length > 0 ? (
                  <div className="catalog-card-grid catalog-evidence-grid">
                    {evidenceCards.map((item) => (
                      <a className="catalog-evidence-card" href={`/evidence/${item.id}`} key={item.id}>
                        <span className="catalog-card-kicker">{item.id} · {item.study_type}</span>
                        <strong>{item.title}</strong>
                        <p>{item.claim}</p>
                        <span className="catalog-card-metrics">
                          <span>{item.research_stage}</span>
                          <span>样本：{item.sample_size ?? "未报告"}</span>
                          <span>可信度：{item.confidence}</span>
                        </span>
                        <span className="catalog-card-enter">打开证据卡 <i aria-hidden="true">→</i></span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="catalog-empty"><strong>{query ? "没有匹配的证据卡" : "尚未绑定直接证据"}</strong><p>{query ? "尝试缩短关键词或清空搜索。" : "这条关系会保留透明的证据空状态。"}</p></div>
                )}
              </section>
            </div>
          )}
        </main>

        {selection && (
          <aside className="catalog-detail-drawer" aria-live="polite" aria-label="所选内容详情">
            <div className="catalog-drawer-inner">
              <div className="catalog-drawer-head">
                <span className="eyebrow">所选内容</span>
                <button type="button" aria-label="关闭详情" title="关闭详情" onClick={() => setSelection(null)}>×</button>
              </div>
              {selectedNode && (
                <div>
                  <span className="catalog-drawer-type" style={{ color: colors[selectedNode.type] }}>{typeLabels[selectedNode.type]}</span>
                  <h2>{selectedNode.name}</h2>
                  <p className="muted">{selectedNode.aliases.length ? `别名：${selectedNode.aliases.join("、")}` : "暂无别名"}</p>
                  <div className="tag-row">{selectedNode.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <dl className="detail-list">
                    <div><dt>直接关联</dt><dd>{nodeMetrics.get(selectedNode.id)?.relationCount ?? 0}</dd></div>
                    <div><dt>关联证据</dt><dd>{nodeMetrics.get(selectedNode.id)?.evidenceCount ?? 0}</dd></div>
                    <div>
                      <dt>{(nodeMetrics.get(selectedNode.id)?.evidenceCount ?? 0) > 0 ? "最高阶段" : "证据状态"}</dt>
                      <dd>{metricStageLabel(nodeMetrics.get(selectedNode.id) ?? {
                        relationCount: 0,
                        evidenceCount: 0,
                        highestStage: "尚未标注",
                      })}</dd>
                    </div>
                  </dl>
                  {selectedRelationGroups.length > 0 && (
                    <div className="catalog-related-groups">
                      <h3>直接关联</h3>
                      {selectedRelationGroups.map((group) => (
                        <section key={group.type}>
                          <strong>{typeLabels[group.type]} · {group.relations.length}</strong>
                          <div>
                            {group.relations.slice(0, 10).map((relation) => {
                              const otherId = relation.source_id === selectedNode.id ? relation.target_id : relation.source_id;
                              const otherNode = nodeMap.get(otherId);
                              return (
                                <button type="button" key={relation.id} onClick={() => { setLastRelationId(relation.id); setSelection({ kind: "relation", id: relation.id }); }}>
                                  <span>{otherNode?.name ?? otherId}</span>
                                  <small>{relation.label}{relation.evidence_ids.length ? ` · ${relation.evidence_ids.length} 证据` : ""}</small>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                  {layer.kind !== "theme" || layer.focusId !== selectedNode.id ? (
                    <button className="button button-primary full-button" type="button" onClick={() => openTheme(selectedNode.id)}>以此节点展开主题</button>
                  ) : null}
                  <a className="button button-quiet full-button graph-secondary-action" href={`/entity/${selectedNode.id}`}>打开实体详情</a>
                </div>
              )}
              {selectedRelation && (
                <div>
                  <span className="catalog-drawer-type">关系 · {selectedRelation.id}</span>
                  <h2>{nodeMap.get(selectedRelation.source_id)?.name} → {nodeMap.get(selectedRelation.target_id)?.name}</h2>
                  <dl className="detail-list">
                    <div><dt>关系</dt><dd>{selectedRelation.label}</dd></div>
                    <div><dt>研究阶段</dt><dd>{selectedRelation.research_stage}</dd></div>
                    <div><dt>机制摘要</dt><dd>{selectedRelation.mechanism_summary ?? "待补充"}</dd></div>
                    <div><dt>主要限制</dt><dd>{selectedRelation.limitations}</dd></div>
                  </dl>
                  {selectedRelation.evidence_ids.length > 0 ? (
                    <div className="panel-evidence">
                      <h3>相关证据</h3>
                      {selectedRelation.evidence_ids.map((id) => {
                        const item = evidenceMap.get(id);
                        return item ? <a href={`/evidence/${id}`} key={id}>{item.title}</a> : null;
                      })}
                    </div>
                  ) : <p className="review-warning">这条关系尚未绑定直接证据。</p>}
                  <a className="button button-quiet full-button graph-secondary-action" href={`/relation/${selectedRelation.id}`}>打开关联详情</a>
                  {selectedRelation.evidence_ids.length > 0 && <button className="button button-primary full-button graph-secondary-action" type="button" onClick={() => openEvidence(selectedRelation.id)}>进入证据链</button>}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
