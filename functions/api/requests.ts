interface D1DatabaseLike {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
    };
  };
}

interface PagesContext {
  request: Request;
  env: { DB?: D1DatabaseLike };
}

const allowedTypes = new Set([
  "disease",
  "clinical_problem",
  "domain",
  "technology",
  "research",
  "other",
]);
const allowedDepths = new Set(["plain", "research", "evidence"]);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const textField = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const onRequestPost = async ({ request, env }: PagesContext) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "请求格式无法识别。" }, 400);
  }

  // Honeypot requests receive a neutral response without touching the database.
  if (textField(body.website, 200)) {
    return json({ ok: true, request_id: "已登记" }, 201);
  }

  const requestType = textField(body.request_type, 40);
  const title = textField(body.title, 120);
  const details = textField(body.details, 4000);
  const depth = textField(body.depth, 40);
  const sourceHint = textField(body.source_hint, 1000);

  if (!allowedTypes.has(requestType)) {
    return json({ error: "请选择有效的需求类型。" }, 400);
  }
  if (!allowedDepths.has(depth)) {
    return json({ error: "请选择有效的内容深度。" }, 400);
  }
  if (title.length < 2 || details.length < 8) {
    return json({ error: "请至少填写主题和具体想了解的问题。" }, 400);
  }
  if (!env.DB) {
    return json({ error: "需求数据库尚未连接，请稍后再试。" }, 503);
  }

  const requestId = `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO content_requests
      (id, request_type, title, details, depth, source_hint, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
  )
    .bind(requestId, requestType, title, details, depth, sourceHint || null, now, now)
    .run();

  return json({ ok: true, request_id: requestId }, 201);
};
