import { useMemo, useState } from "react";
import {
  relationStageHint,
  relationStageLabel,
  researchStageWeight,
} from "../lib/researchStage";
import type {
  EvidenceItem,
  GraphNode,
  GraphRelation,
  NodeType,
} from "../lib/types";

interface RelatedItem {
  relation: GraphRelation;
  other?: GraphNode;
  evidence: EvidenceItem[];
}

const typeOrder: NodeType[] = [
  "domain",
  "capability",
  "disease",
  "clinical_problem",
  "technology",
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

export default function RelatedContentExplorer({
  items,
  nodeId,
}: {
  items: RelatedItem[];
  nodeId: string;
}) {
  const [selectedType, setSelectedType] = useState<NodeType | "all">("all");
  const counts = useMemo(
    () =>
      typeOrder.reduce<Record<NodeType, number>>(
        (result, type) => {
          result[type] = items.filter((item) => item.other?.type === type).length;
          return result;
        },
        {
          domain: 0,
          capability: 0,
          disease: 0,
          clinical_problem: 0,
          technology: 0,
          research: 0,
        },
      ),
    [items],
  );
  const selectedItems = useMemo(
    () =>
      (selectedType === "all"
        ? items
        : items.filter((item) => item.other?.type === selectedType)
      ).toSorted((left, right) => {
        const evidenceDifference = right.evidence.length - left.evidence.length;
        if (evidenceDifference !== 0) return evidenceDifference;
        const stageDifference =
          researchStageWeight(right.relation.research_stage) -
          researchStageWeight(left.relation.research_stage);
        if (stageDifference !== 0) return stageDifference;
        return (left.other?.name ?? "").localeCompare(right.other?.name ?? "", "zh-CN");
      }),
    [items, selectedType],
  );

  return (
    <div className="related-content-explorer">
      <details className="related-filter-disclosure">
        <summary>
          <span className="related-filter-copy">
            <strong>选择你想继续了解的内容类型</strong>
            <small>按科学门类、技术、疾病等类型筛选</small>
          </span>
          <span className="related-filter-state">
            {selectedType === "all" ? `当前：全部 ${items.length} 条` : `当前：${typeLabels[selectedType]} ${selectedItems.length} 条`}
          </span>
        </summary>
        <div className="related-type-grid" role="group" aria-label="按关联内容类型筛选">
          <button
            className={`related-type-option related-type-all ${selectedType === "all" ? "active" : ""}`}
            type="button"
            aria-pressed={selectedType === "all"}
            onClick={() => setSelectedType("all")}
          >
            <span className="related-all-mark" aria-hidden="true">∑</span>
            <span>
              <strong>全部关联</strong>
              <small>{items.length} 条关联</small>
            </span>
            <span className="related-type-arrow" aria-hidden="true">→</span>
          </button>
          {typeOrder.map((type) => (
            <button
              className={`related-type-option ${selectedType === type ? "active" : ""}`}
              type="button"
              aria-pressed={selectedType === type}
              disabled={counts[type] === 0}
              key={type}
              onClick={() => setSelectedType(type)}
            >
              <span className={`node-dot node-${type}`} aria-hidden="true"></span>
              <span>
                <strong>{typeLabels[type]}</strong>
                <small>{counts[type]} 条关联</small>
              </span>
              <span className="related-type-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </details>

      <div className="related-results" aria-live="polite">
          <div className="related-results-heading">
            <h3>{selectedType === "all" ? "全部关联" : typeLabels[selectedType]} · {selectedItems.length} 条</h3>
            {selectedType !== "all" && (
              <button className="related-clear" type="button" onClick={() => setSelectedType("all")}>
                查看全部
              </button>
            )}
          </div>
          {selectedItems.length > 0 ? (
            <div className="relation-list">
              {selectedItems.map(({ relation, other, evidence }) => (
                <article className="relation-card" key={relation.id}>
                  <div className="relation-card-head">
                    <div>
                      <small>
                        {relation.source_id === nodeId ? "当前节点 → 此节点" : "此节点 → 当前节点"}
                        {` · ${relation.label} · ${relation.id}`}
                      </small>
                      <h3>{other?.name ?? "未知节点"}</h3>
                    </div>
                    <span
                      className="stage-chip"
                      title={relationStageHint(relation.research_stage)}
                    >
                      {relationStageLabel(relation.research_stage)}
                    </span>
                  </div>
                  <p>{relation.mechanism_summary ?? "该关系的机制解释尚待补充。"}</p>
                  <div className="limitation-box"><strong>主要限制</strong><span>{relation.limitations}</span></div>
                  {evidence[0] && (
                    <div className="relation-evidence-preview">
                      <div className="relation-evidence-preview-head">
                        <small>代表性证据 · {evidence[0].study_type}</small>
                        <span>样本量：{evidence[0].sample_size ?? "未报告"}</span>
                      </div>
                      <p>{evidence[0].findings}</p>
                    </div>
                  )}
                  <div className="relation-actions">
                    <a className="text-link" href={`${import.meta.env.BASE_URL}relation/${relation.id}`}>查看关联详情 →</a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>
                {selectedType === "all"
                  ? "当前没有已建立的关联内容。"
                  : `当前没有已建立的${typeLabels[selectedType]}关联。`}
              </strong>
              <p>可以选择其他类型，或回到完整图谱查看待补充关系。</p>
            </div>
          )}
      </div>
    </div>
  );
}
