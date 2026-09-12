import cytoscape from "cytoscape";
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

  useEffect(() => {
    if (!containerRef.current) return;
    const visibleNodes = nodes.filter((node) => node.type !== "research");
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const visibleRelations = relations.filter(
      (relation) =>
        visibleIds.has(relation.source_id) && visibleIds.has(relation.target_id),
    );

    const graph = cytoscape({
      container: containerRef.current,
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
    });

    graph.on("tap", "node", (event) => {
      window.location.href = `/entity/${event.target.id()}`;
    });

    return () => graph.destroy();
  }, [nodes, relations]);

  return (
    <div className="mini-graph-shell">
      <div
        className="graph-canvas mini-graph"
        ref={containerRef}
        role="img"
        aria-label="疾病、临床问题、科学门类和技术之间的简化知识图谱"
      ></div>
      <div className="graph-legend" aria-label="图谱图例">
        {Object.entries(colors).filter(([type]) => type !== "research").map(([type, color]) => (
          <span key={type}>
            <i style={{ backgroundColor: color }}></i>
            {{ domain: "科学门类", capability: "核心能力", disease: "疾病", clinical_problem: "临床问题", technology: "技术" }[type]}
          </span>
        ))}
      </div>
    </div>
  );
}
