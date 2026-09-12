import { useMemo, useState } from "react";
import type { GraphNode } from "../lib/types";

const typeLabels: Record<GraphNode["type"], string> = {
  domain: "科学门类",
  capability: "核心能力",
  disease: "疾病",
  clinical_problem: "临床问题",
  technology: "技术",
  research: "研究",
};

const normalize = (value: string) =>
  value.toLocaleLowerCase("zh-CN").replace(/[\s，。！？、；：,.!?;:()（）/\\-]+/g, "");

function longestCommonSubstringLength(left: string, right: string) {
  const row = new Array(right.length + 1).fill(0);
  let longest = 0;
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = right.length; rightIndex >= 1; rightIndex -= 1) {
      if (left[leftIndex - 1] === right[rightIndex - 1]) {
        row[rightIndex] = row[rightIndex - 1] + 1;
        longest = Math.max(longest, row[rightIndex]);
      } else {
        row[rightIndex] = 0;
      }
    }
  }
  return longest;
}

function scoreNode(node: GraphNode, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;
  const name = normalize(node.name);
  const aliases = node.aliases.map(normalize);
  const tags = node.tags.map(normalize);
  const tokens = query
    .split(/[\s，。！？、；：,.!?;:()（）/\\-]+/)
    .map(normalize)
    .filter((token) => token.length > 1);

  let score = 0;
  let reason = "关键词相关";
  if (name === normalizedQuery) {
    score = 120;
    reason = "名称完全匹配";
  } else if (aliases.includes(normalizedQuery)) {
    score = 110;
    reason = "常用别名匹配";
  } else if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) {
    score = 85;
    reason = "名称包含匹配";
  } else if (
    aliases.some(
      (alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias),
    )
  ) {
    score = 75;
    reason = "别名包含匹配";
  } else if (tags.some((tag) => normalizedQuery.includes(tag))) {
    score = 55;
    reason = "主题标签匹配";
  }

  if (score === 0) {
    const longestFragment = Math.max(
      ...[name, ...aliases, ...tags].map((candidate) =>
        longestCommonSubstringLength(candidate, normalizedQuery),
      ),
    );
    if (longestFragment >= 2) {
      score = 20 + longestFragment * 9;
      reason = "概念片段匹配";
    }
  }

  const tokenMatches = tokens.filter((token) =>
    [name, ...aliases, ...tags].some(
      (candidate) => candidate.includes(token) || token.includes(candidate),
    ),
  ).length;
  score += tokenMatches * 12;

  return score > 0 ? { node, score, reason } : null;
}

export default function SearchExplorer({ nodes }: { nodes: GraphNode[] }) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const results = useMemo(
    () =>
      nodes
        .map((node) => scoreNode(node, submittedQuery))
        .filter((result): result is NonNullable<typeof result> => Boolean(result))
        .sort((left, right) => right.score - left.score)
        .slice(0, 6),
    [nodes, submittedQuery],
  );

  const submit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <div className="search-explorer">
      <form className="semantic-search" onSubmit={submit}>
        <label htmlFor="knowledge-query">用你自己的话描述想了解的问题</label>
        <div className="search-row">
          <input
            id="knowledge-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：中风以后，机器人训练真的能恢复手臂功能吗？"
          />
          <button className="button button-accent" type="submit">
            归纳方向
          </button>
        </div>
        <p className="form-hint">
          首版使用关键词、别名与规则在本地归纳，不调用付费 AI，也不作疾病诊断。
        </p>
      </form>

      {submittedQuery && (
        <section className="search-results" aria-live="polite">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">本地语义归纳</span>
              <h2>可能相关的方向</h2>
            </div>
            <a
              className="text-link"
              href={`/explore?q=${encodeURIComponent(submittedQuery)}`}
            >
              在图谱中继续探索 →
            </a>
          </div>
          {results.length > 0 ? (
            <div className="result-grid">
              {results.map(({ node, reason }) => (
                <a className="result-card" href={`/entity/${node.id}`} key={node.id}>
                  <span className={`node-dot node-${node.type}`} aria-hidden="true"></span>
                  <span>
                    <small>{typeLabels[node.type]} · {reason}</small>
                    <strong>{node.name}</strong>
                    <span>{node.aliases.length ? `也称：${node.aliases.join("、")}` : "查看相关关系与证据"}</span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>当前示范库还没有找到可靠匹配。</strong>
              <p>可尝试输入“脑卒中”“外骨骼”“手术机器人”或“实验室自动化”。</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
