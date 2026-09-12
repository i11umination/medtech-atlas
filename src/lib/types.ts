export type NodeType =
  | "domain"
  | "capability"
  | "disease"
  | "clinical_problem"
  | "technology"
  | "research";

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  slug: string;
  aliases: string[];
  tags: string[];
  content_ref: string | null;
  status: "draft" | "needs-review" | "approved" | "blocked";
  last_verified: string | null;
}

export interface NodeSummary {
  node_id: string;
  content_ref: string;
  source_ids: string[];
  review_status: "needs-review" | "approved" | "blocked";
  last_verified: string;
}

export interface GraphRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  label: string;
  mechanism_summary: string | null;
  research_stage: string;
  evidence_ids: string[];
  limitations: string;
  status: "draft" | "needs-review" | "approved" | "blocked";
  last_verified: string | null;
}

export interface EvidenceItem {
  id: string;
  title: string;
  claim: string;
  relation_ids: string[];
  source_ids: string[];
  study_type: string;
  research_stage: string;
  population_or_model: string;
  sample_size: number | string | null;
  intervention: string | null;
  comparator: string | null;
  outcomes: string[];
  findings: string;
  limitations: string;
  confidence: "low" | "medium" | "high";
  content_ref: string;
  review_status: "needs-review" | "approved" | "revise" | "blocked";
  last_verified: string;
}

export interface SourceItem {
  id: string;
  title: string;
  authors: string[];
  institution: string | null;
  year: number | null;
  source_type: string;
  doi: string | null;
  registry_id: string | null;
  url: string;
  access_note: string;
  status: "needs-review" | "approved" | "blocked";
  verified_at: string;
}

export interface FutureDirection {
  id: string;
  title: string;
  basis_evidence_ids: string[];
  horizon: "近期可验证" | "中期转化" | "长期前沿";
  uncertainty: string;
  risks: string;
  content_ref: string;
  review_status: "draft" | "needs-review" | "approved" | "blocked";
  last_verified: string | null;
}

export interface PreferenceOption {
  id: string;
  category: "role" | "research_interest";
  value: string;
  label: string;
  description: string;
}

export interface NavigationGroup {
  id: string;
  name: string;
  description: string;
  level: number;
  axis: "science" | "medicine" | "evidence";
  parent_id: string | null;
  child_group_ids: string[];
  primary_node_ids: string[];
  cross_node_ids: string[];
  planned_items: string[];
  status: "active" | "planned";
}
