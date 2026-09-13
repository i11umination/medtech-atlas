import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef } from "react";
import type { GraphNode, GraphRelation } from "../lib/types";

const colors: Record<GraphNode["type"], string> = {
  domain: "#d97706",
  capability: "#2f7d62",
  disease: "#b84b62",
  clinical_problem: "#7c3aed",
  technology: "#087f8c",
  research: "#64748b",
};

export default function MiniGraph({
  nodes,
  relations,
}: {
  nodes: GraphNode[];
  relations: GraphRelation[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);

  const zoomBy = (factor: number) => {
    const graph = graphRef.current;
    if (!graph) return;
    const level = Math.max(
      graph.minZoom(),
      Math.min(graph.maxZoom(), graph.zoom() * factor),
    );
    graph.zoom({
      level,
      renderedPosition: { x: graph.width() / 2, y: graph.height() / 2 },
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const visibleNodes = nodes.filter((node) => node.type !== "research");
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const visibleRelations = relations.filter(
      (relation) =>
        visibleIds.has(relation.source_id) && visibleIds.has(relation.target_id),
    );

    let graph: Core | null = null;
    const handleWheel = (event: WheelEvent) => {
      if (!graph) return;
      event.preventDefault();
      const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? container.clientHeight
          : 1;
      const clampDelta = (value: number) => Math.max(-140, Math.min(140, value));
      if (event.ctrlKey) {
        const bounds = container.getBoundingClientRect();
        const zoomFactor = Math.exp(-clampDelta(event.deltaY * deltaScale) * 0.008);
        const level = Math.max(
          graph.minZoom(),
          Math.min(graph.maxZoom(), graph.zoom() * zoomFactor),
        );
        graph.zoom({
          level,
          renderedPosition: {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          },
        });
        return;
      }
      graph.panBy({
        x: -clampDelta(event.deltaX * deltaScale),
        y: -clampDelta(event.deltaY * deltaScale),
      });
    };

    container.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    graph = cytoscape({
      container,
      elements: [
        ...visibleNodes.map((node) => ({
          data: {
            id: node.id,
            label: node.name,
            type: node.type,
            color: colors[node.type],
          },
        })),
        ...visibleRelations.map((relation) => ({
          data: {
            id: relation.id,
            source: relation.source_id,
            target: relation.target_id,
          },
        })),
      ],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#24323d",
            "font-size": 10,
            "text-wrap": "wrap",
            "text-max-width": "86px",
            "text-valign": "bottom",
            "text-margin-y": 8,
            width: 18,
            height: 18,
            "border-width": 3,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.2,
            "line-color": "#c7d5d8",
            "target-arrow-color": "#c7d5d8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.76,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        randomize: true,
        nodeRepulsion: () => 7000,
        idealEdgeLength: () => 78,
      },
      minZoom: 0.55,
      maxZoom: 2.2,
      panningEnabled: true,
      userPanningEnabled: true,
      userZoomingEnabled: false,
    });
    graphRef.current = graph;

    graph.on("tap", "node", (event) => {
      window.location.href = `/entity/${event.target.id()}`;
    });

    return () => {
      container.removeEventListener("wheel", handleWheel, { capture: true });
      graph?.destroy();
      graphRef.current = null;
    };
  }, [nodes, relations]);

  return (
    <div className="mini-graph-shell">
      <div className="graph-zoom-controls" role="group" aria-label="云图缩放控制">
        <button type="button" aria-label="放大云图" title="放大" onClick={() => zoomBy(1.22)}>＋</button>
        <button type="button" aria-label="缩小云图" title="缩小" onClick={() => zoomBy(1 / 1.22)}>−</button>
        <button type="button" className="mini-graph-fit" aria-label="显示完整云图" title="显示完整云图" onClick={() => graphRef.current?.fit(undefined, 42)}>适应</button>
      </div>
      <div
        className="graph-canvas mini-graph"
        ref={containerRef}
        role="img"
        aria-label="可自由平移并通过触控板捏合缩放的疾病、临床问题、科学门类和技术知识图谱"
      ></div>
      <div className="canvas-help mini-graph-help">双指滑动或拖动空白处自由平移 · 双指捏合或使用＋−缩放</div>
      <div className="graph-legend" aria-label="图谱图例">
        {Object.entries(colors).filter(([type]) => type !== "research").map(([type, color]) => (
          <span key={type}>
            <i style={{ backgroundColor: color }}></i>
            {{ domain: "科学门类", capability: "核心能力", disease: "疾病与健康状态", clinical_problem: "临床问题", technology: "技术" }[type]}
          </span>
        ))}
      </div>
    </div>
  );
}
