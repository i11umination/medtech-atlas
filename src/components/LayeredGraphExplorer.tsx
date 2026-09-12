import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  EvidenceItem,
  GraphNode,
  GraphRelation,
  NavigationGroup,
  NodeType,
} from "../lib/types";

const STORAGE_KEY = "med-tech-preferences-v1";
const MAX_THEME_NODES = 40;
const typeLabels: Record<NodeType, string> = {
  domain: "科学门类",
  capability: "核心能力",
  disease: "疾病",
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
  | { kind: "group"; id: string }
  | { kind: "node"; id: string }
  | { kind: "relation"; id: string }
  | null;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
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
    layer.kind === "theme" ? layer.focusId : layer.kind === "evidence" ? relationMap.get(layer.relationId)?.source_id ?? null : null,
  );
  const [lastRelationId, setLastRelationId] = useState<string | null>(() =>
    layer.kind === "evidence" ? layer.relationId : null,
  );
  const [scope, setScope] = useState<"global" | "recommended">("global");
  const [types, setTypes] = useState<NodeType[]>([
    "domain",
    "disease",
    "clinical_problem",
    "technology",
  ]);
  const [preferredNodeIds, setPreferredNodeIds] = useState<string[]>([]);

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

  const openGroup = (groupId: string) => {
    const group = groupMap.get(groupId);
    if (group?.axis === "evidence") {
      setTypes((current) => current.includes("research") ? current : [...current, "research"]);
    }
    setSelection({ kind: "group", id: groupId });
    setLayer({ kind: "group", groupId });
  };

  const openTheme = (focusId: string) => {
    setLastFocusId(focusId);
    setSelection({ kind: "node", id: focusId });
    setLayer({ kind: "theme", focusId });
  };

  const openEvidence = (relationId: string) => {
    const relation = relationMap.get(relationId);
    if (relation) setLastFocusId(relation.source_id);
    setLastRelationId(relationId);
    setSelection({ kind: "relation", id: relationId });
    setLayer({ kind: "evidence", relationId });
  };

  const graphData = useMemo(() => {
    const elements: ElementDefinition[] = [];
    const currentNodeIds = new Set<string>();
    const addGroupNode = (group: NavigationGroup, isCenter = false) => {
      const count = descendantNodeIds.get(group.id)?.size ?? 0;
      const plannedCount = group.planned_items.length;
      elements.push({
        data: {
          id: group.id,
          label: `${group.name}\n${count > 0 ? `${count} 个已收录节点` : `规划 ${plannedCount} 项`}`,
          kind: "group",
          color: axisColors[group.axis],
          isCenter,
        },
      });
    };
    const addEntityNode = (node: GraphNode, isFocus = false) => {
      currentNodeIds.add(node.id);
      elements.push({
        data: {
          id: node.id,
          label: node.name,
          kind: "entity",
          nodeType: node.type,
          color: colors[node.type],
          isFocus,
        },
      });
    };

    if (layer.kind === "roots") {
      rootGroups.forEach((group) => addGroupNode(group));
      const science = rootGroups.find((group) => group.axis === "science");
      const medicine = rootGroups.find((group) => group.axis === "medicine");
      const evidence = rootGroups.find((group) => group.axis === "evidence");
      if (science && medicine) {
        elements.push({ data: { id: "NAV-EDGE-SM", source: science.id, target: medicine.id, kind: "nav-edge", label: "技术回应医学问题" } });
      }
      if (medicine && evidence) {
        elements.push({ data: { id: "NAV-EDGE-ME", source: medicine.id, target: evidence.id, kind: "nav-edge", label: "研究检验与修正" } });
      }
      if (science && evidence) {
        elements.push({ data: { id: "NAV-EDGE-SE", source: science.id, target: evidence.id, kind: "nav-edge", label: "工程能力形成证据" } });
      }
    }

    if (layer.kind === "group") {
      const group = groupMap.get(layer.groupId);
      if (group) {
        addGroupNode(group, true);
        const childGroups = group.child_group_ids
          .map((id) => groupMap.get(id))
          .filter((item): item is NavigationGroup => Boolean(item));
        if (childGroups.length > 0) {
          childGroups.forEach((child) => {
            addGroupNode(child);
            elements.push({ data: { id: `NAV-EDGE-${group.id}-${child.id}`, source: group.id, target: child.id, kind: "nav-edge", label: "进入下一层" } });
          });
        } else {
          const memberIds = [...new Set([...group.primary_node_ids, ...group.cross_node_ids])];
          memberIds
            .map((id) => nodeMap.get(id))
            .filter((item): item is GraphNode => Boolean(item))
            .filter((item) => group.axis === "evidence" || types.includes(item.type))
            .forEach((member) => {
              addEntityNode(member);
              elements.push({ data: { id: `NAV-EDGE-${group.id}-${member.id}`, source: group.id, target: member.id, kind: "nav-edge", label: "组内成员" } });
            });
        }
      }
    }

    if (layer.kind === "theme") {
      const visibleIds = new Set<string>([layer.focusId]);
      let frontier = new Set<string>([layer.focusId]);
      const acceptsNode = (id: string) => {
        const candidate = nodeMap.get(id);
        if (!candidate || !types.includes(candidate.type)) return false;
        if (scope === "recommended" && preferredNodeIds.length > 0) {
          return recommendedNodeIds.has(id) || id === layer.focusId;
        }
        return true;
      };
      for (let depth = 0; depth < 2 && visibleIds.size < MAX_THEME_NODES; depth += 1) {
        const next = new Set<string>();
        relations.forEach((relation) => {
          const fromSource = frontier.has(relation.source_id);
          const fromTarget = frontier.has(relation.target_id);
          if (!fromSource && !fromTarget) return;
          const otherId = fromSource ? relation.target_id : relation.source_id;
          if (!visibleIds.has(otherId) && acceptsNode(otherId) && visibleIds.size < MAX_THEME_NODES) {
            visibleIds.add(otherId);
            next.add(otherId);
          }
        });
        frontier = next;
      }
      visibleIds.forEach((id) => {
        const node = nodeMap.get(id);
        if (node) addEntityNode(node, id === layer.focusId);
      });
      relations
        .filter((relation) => visibleIds.has(relation.source_id) && visibleIds.has(relation.target_id))
        .forEach((relation) => {
          elements.push({
            data: {
              id: relation.id,
              source: relation.source_id,
              target: relation.target_id,
              kind: "relation",
              label: relation.label,
            },
          });
        });
    }

    if (layer.kind === "evidence") {
      const relation = relationMap.get(layer.relationId);
      if (relation) {
        [relation.source_id, relation.target_id].forEach((id) => {
          const node = nodeMap.get(id);
          if (node) addEntityNode(node, id === relation.source_id);
        });
        elements.push({
          data: {
            id: relation.id,
            source: relation.source_id,
            target: relation.target_id,
            kind: "relation",
            label: relation.label,
          },
        });
        relation.evidence_ids.forEach((evidenceId) => {
          const researchNode = nodes.find(
            (node) => node.type === "research" && node.content_ref?.includes(evidenceId),
          );
          if (!researchNode) return;
          addEntityNode(researchNode);
          elements.push({
            data: {
              id: `EVIDENCE-EDGE-${evidenceId}`,
              source: researchNode.id,
              target: relation.target_id,
              kind: "evidence-edge",
              relationId: relation.id,
              label: evidenceId,
            },
          });
        });
      }
    }

    return { elements, nodeCount: currentNodeIds.size };
  }, [
    descendantNodeIds,
    groupMap,
    layer,
    nodeMap,
    nodes,
    preferredNodeIds.length,
    recommendedNodeIds,
    relationMap,
    relations,
    rootGroups,
    scope,
    types,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;
    const graph = cytoscape({
      container: containerRef.current,
      elements: graphData.elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#1f2d36",
            "font-size": 10,
            "font-weight": 650,
            "text-wrap": "wrap",
            "text-max-width": "110px",
            "text-valign": "bottom",
            "text-margin-y": 10,
            width: 24,
            height: 24,
            "border-width": 4,
            "border-color": "#ffffff",
          },
        },
        {
          selector: 'node[kind = "group"]',
          style: {
            color: "#ffffff",
            "font-size": 12,
            "font-weight": 800,
            "text-valign": "center",
            "text-margin-y": 0,
            "text-max-width": "120px",
            width: 126,
            height: 82,
            shape: "round-rectangle",
            "border-width": 0,
          },
        },
        {
          selector: "node[?isCenter]",
          style: {
            width: 150,
            height: 96,
            "border-width": 6,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "node[?isFocus]",
          style: {
            width: 34,
            height: 34,
            "border-color": "#173f49",
            "border-width": 6,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#bfd0d4",
            "target-arrow-color": "#bfd0d4",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: "#6f8388",
            "font-size": 7,
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.82,
            "text-background-padding": "2px",
            opacity: 0.75,
          },
        },
        {
          selector: 'edge[kind = "nav-edge"]',
          style: {
            width: 2,
            "line-style": "dashed",
            "line-color": "#c2d4d0",
            "target-arrow-color": "#c2d4d0",
            opacity: 0.9,
          },
        },
        {
          selector: 'edge[kind = "evidence-edge"]',
          style: {
            "line-style": "dotted",
            "line-color": "#d09237",
            "target-arrow-color": "#d09237",
            width: 2.2,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#102f3a",
            "border-width": 6,
            "line-color": "#0f6f76",
            "target-arrow-color": "#0f6f76",
            opacity: 1,
          },
        },
        { selector: ".faded", style: { opacity: 0.12 } },
      ],
      layout:
        layer.kind === "theme"
          ? { name: "cose", animate: false, nodeRepulsion: () => 9000, idealEdgeLength: () => 105, padding: 45 }
          : layer.kind === "evidence"
            ? { name: "breadthfirst", directed: true, spacingFactor: 1.25, padding: 60 }
            : { name: "concentric", animate: false, minNodeSpacing: 70, padding: 70, concentric: (node) => node.data("isCenter") ? 2 : 1, levelWidth: () => 1 },
      minZoom: 0.35,
      maxZoom: 2.6,
    });
    graphRef.current = graph;

    graph.on("tap", "node", (event) => {
      const id = event.target.id();
      const kind = event.target.data("kind");
      if (kind === "group") {
        const isCurrentCenter = layer.kind === "group" && layer.groupId === id;
        setSelection({ kind: "group", id });
        if (!isCurrentCenter) openGroup(id);
        return;
      }
      setSelection({ kind: "node", id });
      if (layer.kind === "group") {
        openTheme(id);
        return;
      }
      graph.elements().addClass("faded");
      event.target.closedNeighborhood().removeClass("faded");
    });
    graph.on("tap", "edge", (event) => {
      if (event.target.data("kind") === "nav-edge") return;
      const relationId = event.target.data("relationId") ?? event.target.id();
      if (!relationMap.has(relationId)) return;
      setLastRelationId(relationId);
      setSelection({ kind: "relation", id: relationId });
      graph.elements().addClass("faded");
      event.target.removeClass("faded");
      event.target.connectedNodes().removeClass("faded");
    });
    graph.on("tap", (event) => {
      if (event.target !== graph) return;
      setSelection(null);
      graph.elements().removeClass("faded");
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [graphData.elements, layer, relationMap]);

  const selectedGroup = selection?.kind === "group" ? groupMap.get(selection.id) : undefined;
  const selectedNode = selection?.kind === "node" ? nodeMap.get(selection.id) : undefined;
  const selectedRelation = selection?.kind === "relation" ? relationMap.get(selection.id) : undefined;
  const currentGroup = layer.kind === "group" ? groupMap.get(layer.groupId) : undefined;
  const currentFocus = layer.kind === "theme" ? nodeMap.get(layer.focusId) : undefined;
  const currentEvidenceRelation = layer.kind === "evidence" ? relationMap.get(layer.relationId) : undefined;

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
      else {
        setSelection(null);
        setLayer({ kind: "roots" });
      }
      return;
    }
    if (layer.kind === "theme") {
      const group = primaryGroupByNode.get(layer.focusId);
      if (group) openGroup(group.id);
      else setLayer({ kind: "roots" });
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

  const currentLayerLabel = layer.kind === "roots"
    ? "第 0 层 · 全局框架"
    : layer.kind === "group"
      ? `第 ${Math.min(2, (currentGroup?.level ?? 0) + 1)} 层 · 分组下钻`
      : layer.kind === "theme"
        ? "第 3 层 · 主题子图"
        : "第 4 层 · 证据链";

  return (
    <div className="layered-explorer">
      <header className="graph-level-toolbar">
        <div className="graph-view-tabs" role="tablist" aria-label="图谱视图层级">
          <button className={layer.kind === "roots" || layer.kind === "group" ? "active" : ""} type="button" onClick={() => { setSelection(null); setLayer({ kind: "roots" }); }}>
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
          <button type="button" onClick={() => { setSelection(null); setLayer({ kind: "roots" }); }}>全局</button>
          {breadcrumbGroups.map((group) => (
            <span key={group.id}><i aria-hidden="true">/</i><button type="button" onClick={() => openGroup(group.id)}>{group.name}</button></span>
          ))}
          {currentFocus && <span><i aria-hidden="true">/</i><strong>{currentFocus.name}</strong></span>}
          {currentEvidenceRelation && <span><i aria-hidden="true">/</i><strong>证据链</strong></span>}
        </nav>
        <span className="graph-level-label">{currentLayerLabel}</span>
      </header>

      <div className="explorer-app">
        <aside className="explorer-controls" aria-label="图谱筛选">
          <div className="control-block">
            <span className="control-label">当前层级</span>
            <strong className="current-layer-name">
              {currentGroup?.name ?? currentFocus?.name ?? (currentEvidenceRelation ? "单条关系证据链" : "全局框架")}
            </strong>
            <p className="control-note">点击节点进入下层；滚轮只缩放当前层。</p>
          </div>
          <div className="control-block">
            <span className="control-label">内容范围</span>
            <div className="segmented-control">
              <button className={scope === "global" ? "active" : ""} type="button" onClick={() => setScope("global")}>全局</button>
              <button className={scope === "recommended" ? "active" : ""} type="button" onClick={() => setScope("recommended")}>与我相关</button>
            </div>
            {scope === "recommended" && preferredNodeIds.length === 0 && <p className="control-note">请先在首页设置研究方向；当前仍显示完整主题内容。</p>}
          </div>
          <div className="control-block">
            <span className="control-label">节点类型</span>
            <div className="filter-list">
              {(Object.keys(typeLabels) as NodeType[]).map((type) => (
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
          <button className="button button-quiet full-button graph-reset-button" type="button" onClick={() => graphRef.current?.fit(undefined, 44)}>重置当前视图</button>
        </aside>

        <div className="explorer-canvas-wrap">
          <div className="graph-canvas explorer-canvas" ref={containerRef} role="img" aria-label={`${currentLayerLabel}的医学与先进技术知识图谱`}></div>
          <div className="canvas-help">点击下钻 · 滚轮缩放 · 拖动平移 · 当前显示 {graphData.nodeCount || graphData.elements.filter((item) => !item.data.source).length} 个节点</div>
        </div>

        <aside className="detail-panel" aria-live="polite">
          {!selection && (
            <div className="detail-empty">
              <span className="eyebrow">当前层说明</span>
              <h2>{currentGroup?.name ?? currentFocus?.name ?? (currentEvidenceRelation ? "关系证据链" : "从大框架开始")}</h2>
              <p>{currentGroup?.description ?? (layer.kind === "theme" ? "当前只展示焦点节点周围两跳以内的关系，避免全量图谱拥挤。" : layer.kind === "evidence" ? "选择研究节点可打开实体资料，选择中间关系可查看完整证据卡。" : "选择科学、医学或证据入口，再逐层进入具体结构。")}</p>
            </div>
          )}
          {selectedGroup && (
            <div>
              <span className="eyebrow">导航分组 · 第 {selectedGroup.level} 层</span>
              <h2>{selectedGroup.name}</h2>
              <p className="muted">{selectedGroup.description}</p>
              <dl className="detail-list">
                <div><dt>已收录节点</dt><dd>{descendantNodeIds.get(selectedGroup.id)?.size ?? 0}</dd></div>
                <div><dt>下级分组</dt><dd>{selectedGroup.child_group_ids.length}</dd></div>
                <div><dt>建设状态</dt><dd>{selectedGroup.status === "active" ? "已有内容" : "已批准扩展"}</dd></div>
              </dl>
              {selectedGroup.planned_items.length > 0 && (
                <div className="planned-topic-list"><strong>已批准扩展项</strong><div>{selectedGroup.planned_items.map((item) => <span key={item}>{item}</span>)}</div></div>
              )}
              <button className="button button-primary full-button" type="button" onClick={() => openGroup(selectedGroup.id)}>进入这一层</button>
            </div>
          )}
          {selectedNode && (
            <div>
              <span className="eyebrow">{typeLabels[selectedNode.type]}</span>
              <h2>{selectedNode.name}</h2>
              <p className="muted">{selectedNode.aliases.length ? `别名：${selectedNode.aliases.join("、")}` : "暂无别名"}</p>
              <div className="tag-row">{selectedNode.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              {layer.kind !== "theme" || layer.focusId !== selectedNode.id ? (
                <button className="button button-primary full-button" type="button" onClick={() => openTheme(selectedNode.id)}>以此节点展开主题</button>
              ) : null}
              <a className="button button-quiet full-button graph-secondary-action" href={`/entity/${selectedNode.id}`}>打开实体详情</a>
            </div>
          )}
          {selectedRelation && (
            <div>
              <span className="eyebrow">关系 · {selectedRelation.id}</span>
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
        </aside>
      </div>
    </div>
  );
}
