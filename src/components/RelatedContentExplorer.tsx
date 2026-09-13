import { useMemo, useState } from "react";
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
}: {
  items: RelatedItem[];
}) {
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);
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
  const selectedItems = selectedType
    ? items.filter((item) => item.other?.type === selectedType)
    : [];

  return (
    <div className="related-content-explorer">
      <div className="related-type-grid" role="tablist" aria-label="关联内容类型">
        {typeOrder.map((type) => (
          <button
            className={`related-type-option ${selectedType === type ? "active" : ""}`}
            type="button"
            role="tab"
            aria-selected={selectedType === type}
            aria-controls={`related-panel-${type}`}
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

      {!selectedType && (
        <div className="related-selection-hint">
          <span className="eyebrow">选择一种类型</span>
          <p>先按内容类型缩小范围，再查看对应的关联内容与证据。</p>
        </div>
      )}

      {selectedType && (
        <div id={`related-panel-${selectedType}`} className="related-results" role="tabpanel">
          <div className="related-results-heading">
            <h3>{typeLabels[selectedType]} · {selectedItems.length} 条</h3>
            <button className="related-clear" type="button" onClick={() => setSelectedType(null)}>
              收起
            </button>
          </div>
          {selectedItems.length > 0 ? (
            <div className="relation-list">
              {selectedItems.map(({ relation, other, evidence }) => (
                <article className="relation-card" key={relation.id}>
                  <div className="relation-card-head">
                    <div>
                      <small>{relation.label} · {relation.id}</small>
                      <h3>{other?.name ?? "未知节点"}</h3>
                    </div>
                    <span className="stage-chip">{relation.research_stage}</span>
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
              <strong>当前没有已建立的{typeLabels[selectedType]}关联。</strong>
              <p>可以选择其他类型，或回到完整图谱查看待补充关系。</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
