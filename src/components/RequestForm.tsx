import { useState } from "react";

const requestTypes = [
  { value: "disease", label: "疾病与健康状态" },
  { value: "clinical_problem", label: "临床问题" },
  { value: "domain", label: "科学门类" },
  { value: "technology", label: "技术或疗法" },
  { value: "research", label: "研究问题" },
  { value: "other", label: "还不确定" },
];

const depthOptions = [
  { value: "plain", label: "入门解释" },
  { value: "research", label: "科研综述" },
  { value: "evidence", label: "证据追踪" },
];

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; requestId: string }
  | { kind: "error"; message: string };

export default function RequestForm() {
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [consent, setConsent] = useState(false);

  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!consent) {
      setState({ kind: "error", message: "请先确认不提交个人健康信息。" });
      return;
    }

    setState({ kind: "submitting" });
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: formData.get("request_type"),
          title: formData.get("title"),
          details: formData.get("details"),
          depth: formData.get("depth"),
          source_hint: formData.get("source_hint"),
          website: formData.get("website"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        request_id?: string;
        error?: string;
      };
      if (response.status === 404) {
        throw new Error("当前预览尚未连接需求接口；部署到 Cloudflare Pages 并配置 D1 后即可提交。");
      }
      if (!response.ok) {
        throw new Error(payload.error ?? "需求暂时没有提交成功，请稍后再试。");
      }
      setState({ kind: "success", requestId: payload.request_id ?? "已登记" });
      form.reset();
      setConsent(false);
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "当前预览尚未连接需求接口；部署到 Cloudflare Pages 并配置 D1 后即可提交。",
      });
    }
  };

  return (
    <form className="request-form" onSubmit={submit}>
      <div className="form-field">
        <label htmlFor="request-type">你想补充哪类内容？</label>
        <select id="request-type" name="request_type" defaultValue="other" required>
          {requestTypes.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="request-title">用一句话描述你想了解的主题</label>
        <input
          id="request-title"
          name="title"
          maxLength={120}
          placeholder="例如：脑机接口能否帮助脊髓损伤患者恢复运动？"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="request-details">你希望网站具体回答什么？</label>
        <textarea
          id="request-details"
          name="details"
          maxLength={4000}
          rows={7}
          placeholder="可以写下你关心的机制、研究阶段、临床证据、技术瓶颈或未来方向。不要填写个人病历或具体健康情况。"
          required
        ></textarea>
        <small>最多 4000 字；越具体，后续检索越容易聚焦。</small>
      </div>

      <div className="request-form-grid">
        <div className="form-field">
          <label htmlFor="request-depth">希望看到的内容深度</label>
          <select id="request-depth" name="depth" defaultValue="research" required>
            {depthOptions.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="request-source">可选：来源线索</label>
          <input
            id="request-source"
            name="source_hint"
            maxLength={1000}
            placeholder="论文题名、DOI、注册号或关键词"
          />
        </div>
      </div>

      <label className="privacy-confirmation">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        <span>我确认不会提交姓名、联系方式、病历、检查结果或其他个人健康信息。</span>
      </label>

      <input
        className="request-honeypot"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="request-submit-row">
        <button className="button button-primary" type="submit" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "正在提交…" : "提交需求"}
        </button>
        <span className="form-hint">匿名提交 · 仅用于内容策展，不用于诊疗</span>
      </div>

      {state.kind === "success" && (
        <div className="form-feedback form-success" role="status">
          <strong>需求已进入待处理队列</strong>
          <p>登记编号：{state.requestId}。后续将经过归类、来源检索、事实提取和发布检查，不会直接自动发布为医学结论。</p>
        </div>
      )}
      {state.kind === "error" && (
        <div className="form-feedback form-error" role="alert">
          <strong>暂时无法提交</strong>
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
