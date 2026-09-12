import cytoscape, { type Core } from "cytoscape";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EvidenceItem, GraphNode, GraphRelation } from "../lib/types";

const STORAGE_KEY = "med-tech-preferences-v1";
const typeLabels: Record<GraphNode["type"], string> = {
  domain: "科学门类",
  capability: "核心能力",
  disease: "疾病",
  clinical_problem: "临床问题",
  technology: "技术",
  research: "研究",
};
const colors: Record<GraphNode["type"], string> = {
  domain: "#d97706",
  capability: "#2f7d62",
  disease: "#b84b62",
  clinical_problem: "#7c3aed",
  technology: "#087f8c",
  research: "#64748b",
};
const interestNodeMap: Record<string, string[]> = {
  rehabilitation_robotics: ["TEC-0001"],
  surgical_robotics: ["TEC-0004", "TEC-0007"],
  prosthetics_exoskeletons: ["TEC-0002", "TEC-0003"],
  micro_interventional_robotics: ["TEC-0004"],
  medical_imaging_automation: ["TEC-0005"],
  laboratory_automation: ["TEC-0006"],
};

type Selection =
  | { kind: "node"; id: string }
  | { kind: "relation"; id: string }
  | null;

export default function GraphExplorer({
  nodes,
  relations,
  evidenceItems,
}: {
  nodes: GraphNode[];
  relations: GraphRelation[];
  evidenceItems: EvidenceItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [view, setView] = useState<"global" | "recommended">("global");
  const [types, setTypes] = useState<GraphNode["type"][]>([
    "domain",
    "disease",
    "clinical_problem",
    "technology",
    "research",
  ]);
  const [preferredNodeIds, setPreferredNodeIds] = useState<string[]>([]);

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const relationMap = useMemo(
    () => new Map(relations.map((relation) => [relation.id, relation])),
    [relations],
  );
  const evidenceMap = useMemo(
    () => new Map(evidenceItems.map((item) => [item.id, item])),
    [evidenceItems],
  );

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(STORAGE_KEY) ?? "{}",
        ) as { interests?: string[] };
        setPreferredNodeIds(
          (stored.interests ?? []).flatMap(
            (interest) => interestNodeMap[interest] ?? [],
          ),
        );
      } catch {
        setPreferredNodeIds([]);
      }
    };
    loadPreferences();
    window.addEventListener("med-tech-preferences-updated", loadPreferences);
    return () =>
      window.removeEventListener("med-tech-preferences-updated", loadPreferences);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const graph = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.name,
            type: node.type,
            color: colors[node.type],
          },
        })),
        ...relations.map((relation) => ({
          data: {
            id: relation.id,
            source: relation.source_id,
            target: relation.target_id,
            label: relation.label,
          },
        })),
      ],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#1f2d36",
            "font-size": 10,
            "font-weight": 600,
            "text-wrap": "wrap",
            "text-max-width": "94px",
            "text-valign": "bottom",
            "text-margin-y": 9,
            width: 22,
            height: 22,
            "border-width": 3,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.4,
            "line-color": "#bfd0d4",
            "target-arrow-color": "#bfd0d4",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.7,
          },
        },
        {
          selector: ":selected",
          style: {
            "border-color": "#102f3a",
            "border-width": 5,
            "line-color": "#0f6f76",
            "target-arrow-color": "#0f6f76",
            opacity: 1,
          },
        },
        {
          selector: ".faded",
          style: { opacity: 0.12 },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8500,
        idealEdgeLength: () => 92,
      },
      minZoom: 0.35,
      maxZoom: 2.6,
    });
    graphRef.current = graph;

    graph.on("tap", "node", (event) => {
      const id = event.target.id();
      setSelection({ kind: "node", id });
      graph.elements().addClass("faded");
      event.target.closedNeighborhood().removeClass("faded");
    });
    graph.on("tap", "edge", (event) => {
      setSelection({ kind: "relation", id: event.target.id() });
      graph.elements().addClass("faded");
      event.target.removeClass("faded");
      event.target.connectedNodes().removeClass("faded");
    });
    graph.on("tap", (event) => {
      if (event.target !== graph) return;
      setSelection(null);
      graph.elements().removeClass("faded");
    });

    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (focusId && graph.getElementById(focusId).length) {
      const element = graph.getElementById(focusId);
      element.select();
      graph.animate({ center: { eles: element }, zoom: 1.35 }, { duration: 350 });
      if (element.isNode()) setSelection({ kind: "node", id: focusId });
    }

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [nodes, relations]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const allowedIds = new Set(
      nodes.filter((node) => types.includes(node.type)).map((node) => node.id),
    );

    if (view === "recommended" && preferredNodeIds.length > 0) {
      const recommended = new Set(preferredNodeIds);
      for (let step = 0; step < 2; step += 1) {
        relations.forEach((relation) => {
          if (recommended.has(relation.source_id)) recommended.add(relation.target_id);
          if (recommended.has(relation.target_id)) recommended.add(relation.source_id);
        });
      }
      for (const id of [...allowedIds]) {
        if (!recommended.has(id)) allowedIds.delete(id);
      }
    }

    graph.nodes().forEach((node) => {
      node.style("display", allowedIds.has(node.id()) ? "element" : "none");
    });
    graph.edges().forEach((edge) => {
      const visible =
        allowedIds.has(edge.source().id()) && allowedIds.has(edge.target().id());
      edge.style("display", visible ? "element" : "none");
    });
    graph.layout({ name: "cose", animate: false, fit: true }).run();
  }, [nodes, preferredNodeIds, relations, types, view]);

  const selectedNode =
    selection?.kind === "node" ? nodeMap.get(selection.id) : undefined;
  const selectedRelation =
    selection?.kind === "relation" ? relationMap.get(selection.id) : undefined;

  const toggleType = (type: GraphNode["type"]) => {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  return (
    <div className="explorer-app">
      <aside className="explorer-controls" aria-label="图谱筛选">
        <div className="control-block">
          <span className="control-label">视图</span>
          <div className="segmented-control">
            <button
              className={view === "global" ? "active" : ""}
              type="button"
              onClick={() => setView("global")}
            >
              全局
            </button>
            <button
              className={view === "recommended" ? "active" : ""}
              type="button"
              onClick={() => setView("recommended")}
            >
              与我相关
            </button>
          </div>
          {view === "recommended" && preferredNodeIds.length === 0 && (
            <p className="control-note">请先在首页设置研究方向；当前仍显示全局内容。</p>
          )}
        </div>
        <div className="control-block">
          <span className="control-label">节点类型</span>
          <div className="filter-list">
            {(Object.keys(typeLabels) as GraphNode["type"][]).map((type) => (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <i style={{ backgroundColor: colors[type] }}></i>
                {typeLabels[type]}
              </label>
            ))}
          </div>
        </div>
        <button
          className="button button-quiet full-button"
          type="button"
          onClick={() => {
            graphRef.current?.elements().removeClass("faded").unselect();
            graphRef.current?.fit(undefined, 36);
            setSelection(null);
          }}
        >
          重置视图
        </button>
      </aside>

      <div className="explorer-canvas-wrap">
        <div
          className="graph-canvas explorer-canvas"
          ref={containerRef}
          role="img"
          aria-label="可缩放、拖动和选择的医学与先进技术知识图谱"
        ></div>
        <div className="canvas-help">滚轮缩放 · 拖动平移 · 点击节点或连线查看详情</div>
      </div>

      <aside className="detail-panel" aria-live="polite">
        {!selection && (
          <div className="detail-empty">
            <span className="eyebrow">详情面板</span>
            <h2>从一个需要解决的问题开始</h2>
            <p>选择疾病或临床问题，追踪哪些技术正在尝试回应，以及证据走到了哪一步。</p>
          </div>
        )}
        {selectedNode && (
          <div>
            <span className="eyebrow">{typeLabels[selectedNode.type]}</span>
            <h2>{selectedNode.name}</h2>
            <p className="muted">
              {selectedNode.aliases.length
                ? `别名：${selectedNode.aliases.join("、")}`
                : "暂无别名"}
            </p>
            <div className="tag-row">
              {selectedNode.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <a className="button button-primary full-button" href={`/entity/${selectedNode.id}`}>
              打开实体详情
            </a>
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
            ) : (
              <p className="review-warning">这条关系尚未绑定直接证据。</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
