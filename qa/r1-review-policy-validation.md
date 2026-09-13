# R1 来源核验发布策略验收记录

验收日期：2026-09-13  
适用 Schema：1.2.0

## 决策结果

项目不再把独立医学专家审核设为公开发布前提。R1 的强制发布门槛为：可追溯来源、逐条来源与事实核对、研究边界保留、自动数据验证、产品检查和明确风险披露。

来源核验不能被表述为医学专家背书。除非存在真实、可追溯的专家复核记录，公开页面必须显示“未经独立医学专家审核”，并明确内容不构成诊断、治疗或个体化医疗建议。

## 状态迁移

- 118 个原 `needs-review` 节点迁移为 `source-checked`；另有 14 个骨架节点保留 `draft`；
- 100 条原 `needs-review` 关系迁移为 `source-checked`；另有 72 条待补证据关系保留 `draft`；
- 82 张证据卡全部迁移为 `source-checked`；
- 104 条可用来源迁移为 `source-checked`；1 条撤稿来源继续保持 `blocked`；
- 132 篇实体简介和 4 条未来方向迁移为 `source-checked`。

每张证据卡新增并完成以下字段：

- `expert_review_status: not-performed`；
- `publication_status: public`；
- `curation_method: machine-assisted`。

## 自动关卡

- 公开证据卡必须达到 `source-checked`；
- `source-checked` 证据卡必须有关系、来源、主要发现、局限和最近核验日期；
- 公开证据卡引用的每条来源也必须达到 `source-checked`；
- 每张证据 Markdown 的四个状态字段必须与 JSON 索引一致；
- `blocked` 来源不得被证据卡引用；
- 前端只为 `publication_status: public` 的证据卡生成公开入口。

## 验证结果

- `npm run validate:data`：通过；132 个节点、172 条关系、82 张证据卡、105 条来源、4 条未来方向；
- `npm run check`：通过；35 个源文件，0 错误、0 警告、0 提示；
- `npm run build`：通过；生成 395 个静态页面；
- `npm run audit:coverage`：完成；82 张证据卡均为 `source-checked`，脑卒中疾病层占比 26.8%。

## 尚存但不阻塞 R1 的工作

- 17 个规划门类中仍缺少化学工程、化学、纳米科学、再生医学与组织工程、合成生物学 5 个门类；
- 自动化与控制科学仍有 3 个技术绕过核心能力层；
- 摘要级核验条目仍可逐步补充全文、利益冲突、注册信息和更新核验，但不得因此把现有内容冒充为专家结论；
- 如果未来获得真实专家资源，可将对应证据卡的 `expert_review_status` 改为 `completed` 并保存具名复核记录；这属于增强信息，不改变 R1 的基本发布逻辑。
