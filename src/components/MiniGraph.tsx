import cytoscape, { type Core, type NodeSingular } from "cytoscape";
import { useEffect, useRef } from "react";
import type { GraphNode, GraphRelation } from "../lib/types";

const homepageCenterId = "homepage-med-tech-center";

const colors: Record<GraphNode["type"], string> = {
  domain: "#d97706",
  capability: "#2f7d62",
  disease: "#b84b62",
  clinical_problem: "#7c3aed",
  technology: "#2563eb",
  research: "#64748b",
};

const separateOverlappingLabels = (graph: Core) => {
  const graphNodes = graph.nodes().toArray();
  const gap = 6;

  for (let pass = 0; pass < 24; pass += 1) {
    let adjusted = false;

    for (let firstIndex = 0; firstIndex < graphNodes.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < graphNodes.length; secondIndex += 1) {
        const first = graphNodes[firstIndex];
        const second = graphNodes[secondIndex];
        const firstBox = first.boundingBox({ includeLabels: true, includeOverlays: false });
        const secondBox = second.boundingBox({ includeLabels: true, includeOverlays: false });
        const overlapX = Math.min(firstBox.x2, secondBox.x2) - Math.max(firstBox.x1, secondBox.x1) + gap;
        const overlapY = Math.min(firstBox.y2, secondBox.y2) - Math.max(firstBox.y1, secondBox.y1) + gap;

        if (overlapX <= 0 || overlapY <= 0) continue;

        const firstIsCenter = first.id() === homepageCenterId;
        const secondIsCenter = second.id() === homepageCenterId;
        const split = firstIsCenter || secondIsCenter ? 1 : 0.5;
        const firstPosition = first.position();
        const secondPosition = second.position();

        if (overlapX < overlapY) {
          const direction = secondPosition.x >= firstPosition.x ? 1 : -1;
          if (!firstIsCenter) first.position("x", firstPosition.x - direction * overlapX * split);
          if (!secondIsCenter) second.position("x", secondPosition.x + direction * overlapX * split);
        } else {
          const direction = secondPosition.y >= firstPosition.y ? 1 : -1;
          if (!firstIsCenter) first.position("y", firstPosition.y - direction * overlapY * split);
          if (!secondIsCenter) second.position("y", secondPosition.y + direction * overlapY * split);
        }

        adjusted = true;
      }
    }

    if (!adjusted) break;
  }
};

const balanceRightSide = (graph: Core) => {
  const bounds = graph.nodes().boundingBox({
    includeEdges: false,
    includeLabels: true,
    includeOverlays: false,
  });
  const visualCenter = {
    x: bounds.x1 + bounds.w / 2,
    y: bounds.y1 + bounds.h / 2,
  };
  const rightSideNodes = graph
    .nodes()
    .toArray()
    .filter((node) => node.id() !== homepageCenterId && node.position("x") > visualCenter.x);
  const upperCount = rightSideNodes.filter((node) => node.position("y") < visualCenter.y).length;
  const lowerCount = rightSideNodes.length - upperCount;

  if (rightSideNodes.length === 0 || upperCount <= lowerCount + 2) return;

  const sortedY = rightSideNodes
    .map((node) => node.position("y"))
    .sort((first, second) => first - second);
  const medianY = sortedY[Math.floor(sortedY.length / 2)];
  const targetMedianY = visualCenter.y + bounds.h * 0.08;
  const verticalShift = Math.min(
    bounds.h * 0.14,
    Math.max(0, targetMedianY - medianY),
  );

  rightSideNodes.forEach((node) => {
    node.position("y", node.position("y") + verticalShift);
  });
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
    const domainNodes = visibleNodes.filter((node) => node.type === "domain");

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
        {
          data: {
            id: homepageCenterId,
            label: "医学×先进技术",
            color: "#103f47",
          },
          classes: "homepage-center",
        },
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
        ...domainNodes.map((node) => ({
          data: {
            id: `homepage-center-${node.id}`,
            source: homepageCenterId,
            target: node.id,
          },
          classes: "homepage-domain-edge",
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
          selector: "node[type = 'domain']",
          style: {
            width: 24,
            height: 24,
            "font-size": 11,
            "font-weight": 650,
            "text-max-width": "104px",
          },
        },
        {
          selector: ".homepage-center",
          style: {
            width: 144,
            height: 54,
            shape: "round-rectangle",
            "background-color": "#103f47",
            color: "#ffffff",
            "font-size": 16,
            "font-weight": 700,
            "text-valign": "center",
            "text-halign": "center",
            "text-margin-y": 0,
            "text-max-width": "132px",
            "border-width": 4,
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
        {
          selector: ".homepage-domain-edge",
          style: {
            width: 2.2,
            "line-color": "#dfa14d",
            "target-arrow-shape": "none",
            "curve-style": "straight",
            opacity: 0.9,
          },
        },
        {
          selector: "edge.related-highlight",
          style: {
            width: 3.6,
            "line-color": "data(highlightColor)",
            "target-arrow-color": "data(highlightColor)",
            opacity: 1,
            "z-index": 999,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        randomize: true,
        fit: false,
        nodeRepulsion: () => 6200,
        nodeOverlap: 24,
        idealEdgeLength: (edge) =>
          edge.hasClass("homepage-domain-edge") ? 104 : 62,
        edgeElasticity: () => 44,
        gravity: 1.1,
        numIter: 1000,
        nodeDimensionsIncludeLabels: false,
        padding: 56,
      },
      minZoom: 0.55,
      maxZoom: 2.2,
      panningEnabled: true,
      userPanningEnabled: true,
      userZoomingEnabled: false,
    });
    separateOverlappingLabels(graph);
    balanceRightSide(graph);
    separateOverlappingLabels(graph);
    graph.fit(undefined, 56);
    graphRef.current = graph;

    let highlightedNodeId: string | null = null;
    let dragState: { nodeId: string; moved: boolean } | null = null;
    let suppressedTapNodeId: string | null = null;
    let suppressedTapUntil = 0;
    let userPanUntil = 0;

    const clearRelatedHighlights = () => {
      graph?.edges().removeClass("related-highlight").removeData("highlightColor");
      highlightedNodeId = null;
    };

    const highlightRelatedEdges = (node: NodeSingular) => {
      clearRelatedHighlights();
      node
        .connectedEdges()
        .data("highlightColor", node.data("color"))
        .addClass("related-highlight");
      highlightedNodeId = node.id();
    };

    graph.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      if (nodeId === homepageCenterId) return;

      if (suppressedTapNodeId === nodeId && performance.now() < suppressedTapUntil) {
        suppressedTapNodeId = null;
        suppressedTapUntil = 0;
        return;
      }

      if (highlightedNodeId === nodeId) {
        window.location.href = `${import.meta.env.BASE_URL}entity/${nodeId}`;
        return;
      }

      highlightRelatedEdges(event.target);
    });
    graph.on("pan", (event) => {
      if (event.originalEvent) userPanUntil = performance.now() + 150;
    });
    graph.on("tap", (event) => {
      if (event.target !== graph) return;
      if (performance.now() < userPanUntil) return;
      clearRelatedHighlights();
    });
    graph.on("grab", "node", (event) => {
      const nodeId = event.target.id();
      if (nodeId === homepageCenterId) return;
      if (suppressedTapNodeId === nodeId) {
        suppressedTapNodeId = null;
        suppressedTapUntil = 0;
      }
      dragState = { nodeId, moved: false };
    });
    graph.on("drag", "node", (event) => {
      const nodeId = event.target.id();
      const currentDrag = dragState;
      if (!currentDrag || currentDrag.nodeId !== nodeId || currentDrag.moved) return;
      currentDrag.moved = true;
      highlightRelatedEdges(event.target);
    });
    graph.on("free", "node", (event) => {
      const nodeId = event.target.id();
      const currentDrag = dragState;
      if (currentDrag && currentDrag.nodeId === nodeId && currentDrag.moved) {
        suppressedTapNodeId = nodeId;
        suppressedTapUntil = performance.now() + 240;
      }
      dragState = null;
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
        aria-label="以医学×先进技术为中心、向外连接科学门类及相关能力与医学问题的知识图谱；点击或拖动节点高亮相连线，再次点击同一节点进入详情，点击空白处取消高亮；可自由平移并通过触控板捏合缩放"
      ></div>
      <div className="canvas-help mini-graph-help">点击或拖动节点高亮直接关联 · 再次点击同一节点进入详情 · 点击空白处取消高亮 · 双指滑动或拖动空白处平移 · 双指捏合或使用＋−缩放</div>
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
