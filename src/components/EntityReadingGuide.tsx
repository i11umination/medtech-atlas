import { useEffect, useState } from "react";

interface SavedPreferences {
  role?: string;
}

interface ReadingRoute {
  label: string;
  title: string;
  description: string;
  href: string;
}

const STORAGE_KEY = "med-tech-preferences-v1";

const defaultRoute: ReadingRoute = {
  label: "通用阅读路径",
  title: "建议从通俗概览开始",
  description: "先建立概念，再查看关系位置与证据边界。你也可以在首页设置阅读角色。",
  href: "#entity-overview",
};

const roleRoutes: Record<string, ReadingRoute> = {
  public: {
    label: "普通公众",
    title: "先看通俗简介",
    description: "先理解概念与当前研究阶段，再决定是否继续查看关系和证据。",
    href: "#entity-overview",
  },
  patient_family: {
    label: "患者及家属",
    title: "先看通俗简介与适用边界",
    description: "优先核对研究阶段和局限；页面内容不构成个体化诊疗建议。",
    href: "#entity-overview",
  },
  undergraduate: {
    label: "本科生或跨学科学习者",
    title: "先看概念在图谱中的位置",
    description: "从相邻学科、技术和临床问题建立知识框架，再进入证据细节。",
    href: "#entity-position",
  },
  researcher: {
    label: "研究生或科研人员",
    title: "优先进入证据与研究边界",
    description: "先核对研究设计、样本、结局和局限，再回看概念性总结。",
    href: "#entity-evidence",
  },
  medical_professional: {
    label: "医学工作者",
    title: "优先核对临床证据",
    description: "从研究阶段、适用人群与局限入手，再判断与临床问题的关联。",
    href: "#entity-evidence",
  },
  engineering_industry_education_media: {
    label: "工程、产业、教育或媒体从业者",
    title: "优先查看关系与转化路径",
    description: "先了解它连接了哪些能力、技术和临床问题，再核对支持证据。",
    href: "#entity-relations",
  },
};

function readRole() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return "";
  try {
    return (JSON.parse(stored) as SavedPreferences).role ?? "";
  } catch {
    return "";
  }
}

export default function EntityReadingGuide({ hasSummary }: { hasSummary: boolean }) {
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(readRole());
    const updateRole = () => setRole(readRole());
    window.addEventListener("med-tech-preferences-updated", updateRole);
    window.addEventListener("storage", updateRole);
    return () => {
      window.removeEventListener("med-tech-preferences-updated", updateRole);
      window.removeEventListener("storage", updateRole);
    };
  }, []);

  const preferredRoute = roleRoutes[role] ?? defaultRoute;
  const route = !hasSummary && preferredRoute.href === "#entity-overview"
    ? {
        ...preferredRoute,
        title: "先看这个节点的关系位置",
        description: "该节点的通俗简介仍待完善；可以先从相邻学科、技术和临床问题建立理解。",
        href: "#entity-position",
      }
    : preferredRoute;

  return (
    <aside className="entity-reading-guide" aria-label="个性化阅读建议">
      <div>
        <span className="entity-reading-role">你的阅读路径 · {route.label}</span>
        <strong>{route.title}</strong>
        <p>{route.description}</p>
      </div>
      <div className="entity-reading-guide-actions">
        <a className="button button-primary" href={route.href}>从这里开始</a>
        <a className="text-link" href={`${import.meta.env.BASE_URL}#reading-preferences`}>
          {role ? "调整阅读偏好" : "设置阅读偏好"}
        </a>
      </div>
    </aside>
  );
}
