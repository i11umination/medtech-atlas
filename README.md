# 医学与先进技术图谱

“技术的终极目的，就是解决人类疾苦。”本项目是面向科研人员并兼顾公众理解的中文医学技术知识图谱原型，以真实医学问题为起点，追踪技术、证据与患者结局之间的距离。

## 技术结构

- Astro：生成首页、实体页、证据页和方法页等静态内容；
- React：承载自然语言归纳、阅读偏好和交互式图谱；
- Cytoscape.js：绘制和操作可逐层下钻的点线知识图谱；
- TypeScript：约束页面组件与图谱数据字段；
- JSON + Markdown：分别保存结构化关系、简介索引与可审核内容原稿；41 个实体均有独立的通俗简介文件。
- Cloudflare Pages Functions + D1：保存用户提交的内容需求，不直接写入公开医学知识库。

## 本地运行

```bash
npm install
npm run dev
```

默认预览地址为 `http://localhost:4321`。

## 需求收集部署准备

1. 复制 `wrangler.toml.example` 为 `wrangler.toml`，填入实际的 Cloudflare D1 `database_id`；
2. 使用 `migrations/0001_content_requests.sql` 创建 D1 表；
3. 将项目连接到 Cloudflare Pages，并配置 `DB` D1 binding；
4. 合并到 `main` 后，Cloudflare Pages 可构建静态内容并加载 `functions/api/requests.ts`；
5. 需求进入 `submitted` 队列，人工审核通过后才修改 `data/` 与 `evidence/` 内容。

本地 Astro 预览不会自动提供 Cloudflare D1 binding；未部署到 Pages 时，表单会明确提示数据库尚未连接，不会伪造提交成功。

## 验证

```bash
npm run check
npm run validate:data
npm run build
```

`npm run validate:data` 会检查 JSON Schema、跨文件 ID 引用、Markdown 存在性、导航归属、阻断来源和高风险措辞。构建结果写入 `dist/`，可部署到静态托管平台。

## 当前内容状态

- 六个首批临床主题已经进入首页；
- 41 个实体节点和 48 条关系均可进入图谱；
- 图谱已建立 10 个导航分组，以“全局框架 → 学科/疾病分组 → 主题子图 → 关系证据链”的方式逐层展开；
- 首页右上角采用原创矢量徽标，页眉品牌图标与 favicon 使用同源紧凑版本；均以扳手、锤子、试管和医疗十字表达技术、科学与医学的连接；
- 41 个实体详情页均已接入通俗简介、可靠来源和最近核验日期；
- 18 张证据卡均可生成独立页面；
- 脑卒中和神经血管介入两条主线各新增两张真实研究证据卡，并各有两条项目分析方向；
- 所有证据仍为 `needs-review`，不应作为已审核临床结论公开发布；
- 未来研究方向页面已生成，但仍属于项目分析，不能替代临床指南或研究结论。
