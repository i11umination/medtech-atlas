import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const verifiedAt = "2026-09-14";

const nodes = [
  { id: "CAP-0038", type: "capability", name: "放射性配体设计与核素标记", slug: "radioligand-design-and-radionuclide-labeling", aliases: ["放射性配体化学", "核素标记"], tags: ["化学", "放射性药物", "可复用能力", "第三阶段第一波"], content_ref: "node-summaries/CAP-0038.md", status: "source-checked", last_verified: verifiedAt },
  { id: "TEC-0033", type: "technology", name: "PSMA 靶向镥-177 放射性配体治疗（Pluvicto）", slug: "psma-targeted-lutetium-177-radioligand-therapy-pluvicto", aliases: ["lutetium Lu 177 vipivotide tetraxetan", "177Lu-PSMA-617", "Pluvicto"], tags: ["化学", "放射性配体治疗", "已获监管批准", "第三阶段第一波"], content_ref: "node-summaries/TEC-0033.md", status: "source-checked", last_verified: verifiedAt },
  { id: "DIS-0026", type: "disease", name: "PSMA 阳性转移性去势抵抗性前列腺癌", slug: "psma-positive-metastatic-castration-resistant-prostate-cancer", aliases: ["PSMA 阳性 mCRPC", "转移性去势抵抗性前列腺癌"], tags: ["泌尿系统", "实体肿瘤", "第三阶段第一波"], content_ref: "node-summaries/DIS-0026.md", status: "source-checked", last_verified: verifiedAt },
  { id: "CLP-0023", type: "clinical_problem", name: "PSMA 阳性 mCRPC 的靶向放射递送与累积毒性", slug: "targeted-radiation-delivery-and-cumulative-toxicity-in-psma-positive-mcrpc", aliases: ["PSMA 靶向放射递送"], tags: ["放射性药物", "患者结局", "第三阶段第一波"], content_ref: "node-summaries/CLP-0023.md", status: "source-checked", last_verified: verifiedAt },

  { id: "CAP-0039", type: "capability", name: "脂质体包封与肺部气溶胶递送", slug: "liposomal-encapsulation-and-pulmonary-aerosol-delivery", aliases: ["吸入脂质体递送", "肺部纳米递送"], tags: ["纳米科学", "吸入制剂", "可复用能力", "第三阶段第一波"], content_ref: "node-summaries/CAP-0039.md", status: "source-checked", last_verified: verifiedAt },
  { id: "TEC-0034", type: "technology", name: "吸入用阿米卡星脂质体（ARIKAYCE）", slug: "amikacin-liposome-inhalation-suspension-arikayce", aliases: ["ALIS", "amikacin liposome inhalation suspension", "ARIKAYCE"], tags: ["纳米科学", "吸入抗菌药", "加速批准", "第三阶段第一波"], content_ref: "node-summaries/TEC-0034.md", status: "source-checked", last_verified: verifiedAt },
  { id: "DIS-0027", type: "disease", name: "难治性鸟分枝杆菌复合群肺病", slug: "treatment-refractory-mycobacterium-avium-complex-lung-disease", aliases: ["难治性 MAC 肺病", "难治性非结核分枝杆菌肺病"], tags: ["感染性疾病", "肺部感染", "第三阶段第一波"], content_ref: "node-summaries/DIS-0027.md", status: "source-checked", last_verified: verifiedAt },
  { id: "CLP-0024", type: "clinical_problem", name: "难治性 MAC 肺病的局部抗菌递送与持续培养转阴", slug: "local-antimicrobial-delivery-and-durable-culture-conversion-in-refractory-mac-lung-disease", aliases: ["MAC 肺病持续培养转阴"], tags: ["肺部递送", "抗菌治疗", "患者结局", "第三阶段第一波"], content_ref: "node-summaries/CLP-0024.md", status: "source-checked", last_verified: verifiedAt },

  { id: "CAP-0040", type: "capability", name: "脐带血造血祖细胞离体扩增与组成控制", slug: "ex-vivo-expansion-and-composition-control-of-cord-blood-progenitor-cells", aliases: ["脐带血细胞扩增", "烟酰胺修饰造血祖细胞"], tags: ["再生医学", "细胞制造", "可复用能力", "第三阶段第一波"], content_ref: "node-summaries/CAP-0040.md", status: "source-checked", last_verified: verifiedAt },
  { id: "TEC-0035", type: "technology", name: "烟酰胺修饰脐带血造血祖细胞（Omisirge）", slug: "nicotinamide-modified-cord-blood-progenitor-cells-omisirge", aliases: ["omidubicel-onlv", "omidubicel", "Omisirge"], tags: ["再生医学", "造血细胞移植", "已获监管批准", "第三阶段第一波"], content_ref: "node-summaries/TEC-0035.md", status: "source-checked", last_verified: verifiedAt },
  { id: "DIS-0028", type: "disease", name: "计划接受脐带血移植的血液系统恶性肿瘤", slug: "hematologic-malignancies-planned-for-cord-blood-transplantation", aliases: ["需脐带血移植的血液恶性肿瘤"], tags: ["血液系统", "造血细胞移植", "第三阶段第一波"], content_ref: "node-summaries/DIS-0028.md", status: "source-checked", last_verified: verifiedAt },
  { id: "CLP-0025", type: "clinical_problem", name: "脐带血移植后的延迟植入与早期感染", slug: "delayed-engraftment-and-early-infection-after-cord-blood-transplantation", aliases: ["脐带血移植植入延迟"], tags: ["造血恢复", "感染", "患者结局", "第三阶段第一波"], content_ref: "node-summaries/CLP-0025.md", status: "source-checked", last_verified: verifiedAt },

  { id: "CAP-0041", type: "capability", name: "工程化溶瘤病毒设计与局部免疫激活", slug: "engineered-oncolytic-virus-design-and-local-immune-activation", aliases: ["溶瘤病毒工程", "工程化 HSV-1"], tags: ["合成生物学", "病毒载体", "可复用能力", "第三阶段第一波"], content_ref: "node-summaries/CAP-0041.md", status: "source-checked", last_verified: verifiedAt },
  { id: "TEC-0036", type: "technology", name: "工程化 HSV-1 溶瘤病毒（T-VEC）", slug: "engineered-hsv-1-oncolytic-virus-t-vec", aliases: ["talimogene laherparepvec", "IMLYGIC", "T-VEC"], tags: ["合成生物学", "溶瘤病毒", "已获监管批准", "第三阶段第一波"], content_ref: "node-summaries/TEC-0036.md", status: "source-checked", last_verified: verifiedAt },
  { id: "DIS-0029", type: "disease", name: "术后复发且具有可注射病灶的不可切除黑色素瘤", slug: "unresectable-recurrent-melanoma-with-injectable-lesions", aliases: ["可注射病灶复发黑色素瘤", "不可切除晚期黑色素瘤"], tags: ["皮肤系统", "实体肿瘤", "第三阶段第一波"], content_ref: "node-summaries/DIS-0029.md", status: "source-checked", last_verified: verifiedAt },
  { id: "CLP-0026", type: "clinical_problem", name: "不可切除黑色素瘤的局部病灶控制与全身获益边界", slug: "local-lesion-control-and-systemic-benefit-boundary-in-unresectable-melanoma", aliases: ["黑色素瘤局部溶瘤治疗边界"], tags: ["局部治疗", "免疫治疗", "患者结局", "第三阶段第一波"], content_ref: "node-summaries/CLP-0026.md", status: "source-checked", last_verified: verifiedAt }
];

const relations = [
  { id: "REL-0210", source_id: "DOM-0015", target_id: "CAP-0038", relation_type: "enables", label: "提供配体设计、螯合与核素标记基础", mechanism_summary: "通过靶向配体、螯合结构和放射性核素标记，把分子识别与可测量的放射递送组合成放射性药物。", research_stage: "不适用", evidence_ids: [], limitations: "标记稳定性和体外亲和力不能替代人体分布、剂量学、骨髓与肾脏安全评价。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0211", source_id: "CAP-0038", target_id: "TEC-0033", relation_type: "enables", label: "支撑 PSMA 靶向镥-177 放射性配体", mechanism_summary: "将识别 PSMA 的小分子配体与镥-177 标记体系组合，使 β 辐射富集于 PSMA 表达病灶及其邻近微环境。", research_stage: "已获监管批准", evidence_ids: [], limitations: "PSMA 表达和器官分布存在异质性，治疗还需要核医学设施、辐射防护与个体化安全监测。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0212", source_id: "TEC-0033", target_id: "CLP-0023", relation_type: "applies_to", label: "用于 PSMA PET 筛选后的转移性去势抵抗性前列腺癌", mechanism_summary: "先用获批 PSMA 影像确认病灶表达，再以镥-177 标记配体递送辐射，比较疾病进展、生存和累积毒性。", research_stage: "已获监管批准", evidence_ids: ["EVD-0095", "EVD-0096", "EVD-0097"], limitations: "结论限定于相应既往治疗、PSMA PET 筛选和试验人群；放射暴露、骨髓抑制、肾毒性及高交叉率影响解释。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0213", source_id: "DIS-0026", target_id: "CLP-0023", relation_type: "has_clinical_problem", label: "相关临床问题", mechanism_summary: "转移性去势抵抗性疾病常在雄激素受体通路治疗后进展，PSMA 表达提供候选靶点，但病灶异质性和既往治疗影响获益。", research_stage: "不适用", evidence_ids: [], limitations: "PSMA 阳性是成像和治疗选择条件，不等同于所有病灶持续、均一表达。", status: "source-checked", last_verified: verifiedAt },

  { id: "REL-0214", source_id: "DOM-0017", target_id: "CAP-0039", relation_type: "enables", label: "提供脂质体纳米载体与气溶胶界面控制", mechanism_summary: "通过脂质体包封、粒径与雾化过程控制药物稳定性、肺部沉积和局部释放。", research_stage: "不适用", evidence_ids: [], limitations: "气溶胶粒径和体外释放不能直接预测不同肺部结构、分泌物负荷和基础肺病中的真实暴露。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0215", source_id: "CAP-0039", target_id: "TEC-0034", relation_type: "enables", label: "支撑阿米卡星脂质体吸入递送", mechanism_summary: "把阿米卡星封装于脂质体并经专用雾化器形成吸入气溶胶，以增加肺部局部暴露。", research_stage: "已获监管批准", evidence_ids: [], limitations: "局部递送仍可能引起严重呼吸不良反应，也不能消除耳毒性、肾毒性和耐药风险。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0216", source_id: "TEC-0034", target_id: "CLP-0024", relation_type: "applies_to", label: "用于多药背景方案后仍培养阳性的难治性 MAC 肺病", mechanism_summary: "在指南基础多药方案上加入每日吸入脂质体阿米卡星，以痰培养转阴及其持续性评价微生物学反应。", research_stage: "已获监管批准", evidence_ids: ["EVD-0098", "EVD-0099", "EVD-0100"], limitations: "适应证限于选择余地有限的成人，并基于替代终点加速批准；临床获益尚未确立，呼吸不良反应有黑框警告。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0217", source_id: "DIS-0027", target_id: "CLP-0024", relation_type: "has_clinical_problem", label: "相关临床问题", mechanism_summary: "持续培养阳性提示既有多药方案未清除 MAC，但痰培养、症状、肺功能和长期疾病负担属于不同结局层级。", research_stage: "不适用", evidence_ids: [], limitations: "基础支气管扩张、慢阻肺、菌株敏感性和既往疗程差异会影响结果，不能把培养转阴等同于所有临床获益。", status: "source-checked", last_verified: verifiedAt },

  { id: "REL-0218", source_id: "DOM-0018", target_id: "CAP-0040", relation_type: "enables", label: "提供细胞扩增、组成控制与移植物制造框架", mechanism_summary: "利用离体培养和烟酰胺相关工艺扩增脐带血造血祖细胞，同时保留未扩增的髓系和淋巴细胞组分。", research_stage: "不适用", evidence_ids: [], limitations: "细胞数增加和放行质量属性不能单独预测植入、免疫重建、移植物抗宿主病或长期生存。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0219", source_id: "CAP-0040", target_id: "TEC-0035", relation_type: "enables", label: "支撑单份脐带血来源 Omisirge 制造", mechanism_summary: "从适当 HLA 匹配的单份脐带血制备扩增祖细胞和未扩增免疫细胞组分，用于异基因造血细胞移植。", research_stage: "已获监管批准", evidence_ids: [], limitations: "产品制造、HLA 选择、清髓预处理、支持治疗和移植中心经验共同影响结果。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0220", source_id: "TEC-0035", target_id: "CLP-0025", relation_type: "applies_to", label: "用于缩短脐带血移植后的中性粒细胞恢复并减少早期感染", mechanism_summary: "通过提高可用造血祖细胞数量加快早期造血恢复，再比较感染、住院、移植物抗宿主病和生存结局。", research_stage: "已获监管批准", evidence_ids: ["EVD-0101", "EVD-0102", "EVD-0103"], limitations: "随机试验中生存和移植物抗宿主病差异未显著；长期资料为多试验合并队列，且标签包含严重移植相关风险。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0221", source_id: "DIS-0028", target_id: "CLP-0025", relation_type: "has_clinical_problem", label: "相关临床问题", mechanism_summary: "脐带血细胞剂量有限可延缓造血恢复，增加中性粒细胞缺乏期的感染、住院和移植失败风险。", research_stage: "不适用", evidence_ids: [], limitations: "血液恶性肿瘤类型、疾病状态、供者选择、预处理和支持治疗差异限制跨人群外推。", status: "source-checked", last_verified: verifiedAt },

  { id: "REL-0222", source_id: "DOM-0019", target_id: "CAP-0041", relation_type: "enables", label: "提供工程病毒设计与可编程效应表达框架", mechanism_summary: "通过删除、插入和调控病毒基因，改变复制选择性并表达 GM-CSF 等免疫效应分子。", research_stage: "不适用", evidence_ids: [], limitations: "工程设计目标不保证在所有肿瘤、免疫状态或给药位置产生可预测的体内行为。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0223", source_id: "CAP-0041", target_id: "TEC-0036", relation_type: "enables", label: "支撑工程化 HSV-1 局部溶瘤治疗", mechanism_summary: "T-VEC 在病灶内注射后尝试在肿瘤细胞中复制、裂解，并局部表达 GM-CSF 促进抗肿瘤免疫反应。", research_stage: "已获监管批准", evidence_ids: [], limitations: "活病毒产品需要处理意外暴露和疱疹感染风险，且局部注射能力限制可治疗病灶范围。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0224", source_id: "TEC-0036", target_id: "CLP-0026", relation_type: "applies_to", label: "用于术后复发黑色素瘤的不可切除局部可注射病灶", mechanism_summary: "向皮肤、皮下或淋巴结病灶内注射工程病毒，以持续缓解率、客观缓解、生存和传播相关风险评价局部治疗价值。", research_stage: "已获监管批准", evidence_ids: ["EVD-0104", "EVD-0105", "EVD-0106"], limitations: "标签未证明总生存改善或内脏转移作用；联合 pembrolizumab 的 III 期试验未显著改善 PFS 或 OS。", status: "source-checked", last_verified: verifiedAt },
  { id: "REL-0225", source_id: "DIS-0029", target_id: "CLP-0026", relation_type: "has_clinical_problem", label: "相关临床问题", mechanism_summary: "可注射病灶允许局部给药和直接观察反应，但局部缓解能否转化为全身控制与生存获益需要独立验证。", research_stage: "不适用", evidence_ids: [], limitations: "不同分期、内脏转移负荷、既往免疫治疗和可注射病灶数量会改变适用性。", status: "source-checked", last_verified: verifiedAt }
];

const sources = [
  { id: "SRC-0156", title: "FDA expands Pluvicto's metastatic castration-resistant prostate cancer indication", authors: [], institution: "U.S. Food and Drug Administration", year: 2025, source_type: "监管资料", doi: null, registry_id: "NCT04689828", url: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-expands-pluvictos-metastatic-castration-resistant-prostate-cancer-indication", access_note: "FDA 2025 年扩展适应证页面已核验，用于当前人群、PSMA PET 筛选、PSMAfore 疗效及标签风险。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0157", title: "Lutetium-177-PSMA-617 for Metastatic Castration-Resistant Prostate Cancer", authors: ["Oliver Sartor et al."], institution: "VISION Investigators", year: 2021, source_type: "原始研究", doi: "10.1056/NEJMoa2107322", registry_id: "NCT03511664", url: "https://pubmed.ncbi.nlm.nih.gov/34161051/", access_note: "PubMed 摘要与公开元数据已核验；提取随机人数、影像学无进展生存、总生存和严重不良事件。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0158", title: "Final overall survival and safety analyses of the phase III PSMAfore trial of [177Lu]Lu-PSMA-617 versus change of androgen receptor pathway inhibitor in taxane-naive patients with metastatic castration-resistant prostate cancer", authors: ["Karim Fizazi et al."], institution: "PSMAfore Investigators", year: 2025, source_type: "原始研究", doi: null, registry_id: "NCT04689828", url: "https://pubmed.ncbi.nlm.nih.gov/40680993/", access_note: "PubMed 摘要与公开元数据已核验；提取 468 人随机、最终总生存、60.3% 交叉和安全性。", status: "source-checked", verified_at: verifiedAt },

  { id: "SRC-0159", title: "ARIKAYCE prescribing information", authors: [], institution: "U.S. Food and Drug Administration", year: 2026, source_type: "监管资料", doi: null, registry_id: "NDA 207356", url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/207356s025lbl.pdf", access_note: "FDA 2026 当前标签已核验；提取有限人群、加速批准、临床获益未确立及呼吸不良反应黑框警告。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0160", title: "Amikacin Liposome Inhalation Suspension for Treatment-Refractory Lung Disease Caused by Mycobacterium avium Complex (CONVERT). A Prospective, Open-Label, Randomized Study", authors: ["David E Griffith et al."], institution: "CONVERT Study Group", year: 2018, source_type: "原始研究", doi: "10.1164/rccm.201807-1318OC", registry_id: "NCT02344004", url: "https://pubmed.ncbi.nlm.nih.gov/30216086/", access_note: "PubMed 摘要已核验；提取 336 人随机、6 月培养转阴及呼吸系统不良事件。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0161", title: "Amikacin Liposome Inhalation Suspension for Refractory Mycobacterium avium Complex Lung Disease: Sustainability and Durability of Culture Conversion and Safety of Long-term Exposure", authors: ["David E Griffith et al."], institution: "CONVERT Study Group", year: 2021, source_type: "原始研究", doi: "10.1016/j.chest.2021.03.070", registry_id: "NCT02344004", url: "https://pubmed.ncbi.nlm.nih.gov/33887244/", access_note: "PubMed 摘要已核验；提取持续且停药后耐久的培养转阴、复发与长期暴露安全性。", status: "source-checked", verified_at: verifiedAt },

  { id: "SRC-0162", title: "OMISIRGE (omidubicel-onlv) product information", authors: [], institution: "U.S. Food and Drug Administration", year: 2026, source_type: "监管资料", doi: null, registry_id: "STN 125738", url: "https://www.fda.gov/vaccines-blood-biologics/omisirge", access_note: "FDA 当前产品页及其公开说明书入口已核验；本批仅使用血液恶性肿瘤脐带血移植适应证及移植相关风险。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0163", title: "Omidubicel vs standard myeloablative umbilical cord blood transplantation: results of a phase 3 randomized study", authors: ["Mitchell E Horwitz et al."], institution: "International multicenter phase 3 study", year: 2021, source_type: "原始研究", doi: "10.1182/blood.2021011719", registry_id: "NCT02730299", url: "https://pubmed.ncbi.nlm.nih.gov/34157093/", access_note: "PubMed 摘要与公开全文元数据已核验；提取 125 人随机、植入、感染、住院、GVHD 和生存。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0164", title: "Multicenter Long-Term Follow-Up of Allogeneic Hematopoietic Cell Transplantation with Omidubicel: A Pooled Analysis of Five Prospective Clinical Trials", authors: ["Chenyu Lin et al."], institution: "26 academic transplantation centers", year: 2023, source_type: "原始研究", doi: "10.1016/j.jtct.2023.01.031", registry_id: null, url: "https://pubmed.ncbi.nlm.nih.gov/36775201/", access_note: "PubMed 摘要与公开全文元数据已核验；提取 105 人合并队列、随访、造血耐久、生存和继发移植失败。", status: "source-checked", verified_at: verifiedAt },

  { id: "SRC-0165", title: "IMLYGIC (talimogene laherparepvec) product information and package insert", authors: [], institution: "U.S. Food and Drug Administration", year: 2023, source_type: "监管资料", doi: null, registry_id: "STN 125518", url: "https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/imlygic", access_note: "FDA 当前产品页及 2023 说明书已核验；提取局部适应证、总生存与内脏转移限制、活病毒处理风险。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0166", title: "Talimogene Laherparepvec Improves Durable Response Rate in Patients With Advanced Melanoma", authors: ["Robert H I Andtbacka et al."], institution: "OPTiM Investigators", year: 2015, source_type: "原始研究", doi: "10.1200/JCO.2014.58.3377", registry_id: "NCT00769704", url: "https://pubmed.ncbi.nlm.nih.gov/26014293/", access_note: "PubMed 摘要已核验；提取 436 人随机、持续缓解率、客观缓解、总生存和不良事件。", status: "source-checked", verified_at: verifiedAt },
  { id: "SRC-0167", title: "Randomized, Double-Blind, Placebo-Controlled, Global Phase III Trial of Talimogene Laherparepvec Combined With Pembrolizumab for Advanced Melanoma", authors: ["Jason A Chesney et al."], institution: "Global phase 3 study", year: 2023, source_type: "原始研究", doi: "10.1200/JCO.22.00343", registry_id: "NCT02263508", url: "https://pubmed.ncbi.nlm.nih.gov/35998300/", access_note: "PubMed 摘要与公开全文元数据已核验；提取 692 人随机、PFS、OS、缓解和安全性阴性结果。", status: "source-checked", verified_at: verifiedAt }
];

const evidence = [
  { id: "EVD-0095", title: "FDA 扩展 Pluvicto 至化疗前 PSMA 阳性 mCRPC 人群", claim: "FDA 于 2025 年把 Pluvicto 适应证扩展至既往接受雄激素受体通路抑制剂、适合推迟紫杉类化疗的 PSMA 阳性 mCRPC 成人。", relation_ids: ["REL-0212"], source_ids: ["SRC-0156"], study_type: "监管批准与标签更新", research_stage: "已获监管批准", population_or_model: "经获批 PSMA PET 产品选择、既往接受 ARPI 且适合推迟紫杉类化疗的 PSMA 阳性 mCRPC 成人", sample_size: "批准依据包括 468 人 PSMAfore 随机试验", intervention: "Pluvicto", comparator: "更换另一种雄激素受体通路抑制剂", outcomes: ["适应证", "影像学无进展生存", "总生存", "安全性"], findings: "FDA 报告中位影像学无进展生存为 9.3 对 5.6 个月（HR 0.41）；总生存为 24.5 对 23.1 个月（HR 0.91），未达到统计学显著。", limitations: "适应证要求 PSMA PET 选择并限定既往治疗情境；辐射暴露、骨髓抑制和肾毒性需要监测，不能把延缓进展表述为已证实延长总生存。", confidence: "high", content_ref: "evidence/EVD-0095.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0096", title: "VISION III 期试验显示既往重度治疗 mCRPC 的进展与生存改善", claim: "VISION 在 PSMA 阳性、已接受 ARPI 和紫杉类治疗的 mCRPC 中显示，镥-177-PSMA-617 加允许的标准照护改善影像学无进展生存和总生存。", relation_ids: ["REL-0212"], source_ids: ["SRC-0157"], study_type: "国际多中心、开放标签、随机 III 期试验", research_stage: "临床试验", population_or_model: "既往接受至少一种 ARPI 和一至两种紫杉类方案、PSMA PET 阳性的 mCRPC 患者", sample_size: 831, intervention: "镥-177-PSMA-617加方案允许的标准照护", comparator: "方案允许的标准照护", outcomes: ["影像学无进展生存", "总生存", "客观缓解", "症状性骨事件", "安全性"], findings: "中位影像学无进展生存 8.7 对 3.4 个月（HR 0.40），中位总生存 15.3 对 11.3 个月（HR 0.62）；3 级及以上不良事件为 52.7% 对 38.0%。", limitations: "开放标签且对照组允许的标准照护有限；结果对应既往接受紫杉类治疗和 PSMA PET 筛选的人群，不应外推到未筛选或更早疾病阶段。", confidence: "high", content_ref: "evidence/EVD-0096.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0097", title: "PSMAfore 最终分析中总生存差异未显著且存在高比例交叉", claim: "PSMAfore 最终意向治疗分析未显示 Pluvicto 相对更换 ARPI 的总生存显著差异，60.3% 对照组患者交叉接受 Pluvicto。", relation_ids: ["REL-0212"], source_ids: ["SRC-0158", "SRC-0156"], study_type: "国际多中心、开放标签、随机 III 期试验最终分析", research_stage: "临床试验", population_or_model: "既往一种 ARPI 后进展、未接受紫杉类且适合更换 ARPI 的 PSMA 阳性 mCRPC 患者", sample_size: 468, intervention: "镥-177-PSMA-617", comparator: "更换为阿比特龙或恩扎卢胺", outcomes: ["影像学无进展生存", "总生存", "交叉治疗", "安全性"], findings: "中位总生存 24.48 对 23.13 个月（HR 0.91，P=0.20）；对照组 141/234 人交叉。Pluvicto 组常见口干和贫血。", limitations: "高交叉率使总生存解释复杂；交叉校正分析依赖模型假设，不能替代预先设定的意向治疗结果。", confidence: "high", content_ref: "evidence/EVD-0097.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },

  { id: "EVD-0098", title: "ARIKAYCE 为有限人群的加速批准且临床获益尚未确立", claim: "FDA 当前标签把 ARIKAYCE 限于至少 6 个月多药背景方案后仍培养阳性且替代选择有限的成人，并明确临床获益尚未确立。", relation_ids: ["REL-0216"], source_ids: ["SRC-0159"], study_type: "监管批准与当前标签", research_stage: "已获监管批准", population_or_model: "多药背景方案至少连续 6 个月后仍未获得痰培养阴性、治疗选择有限的成人 MAC 肺病患者", sample_size: "加速批准依据为 CONVERT 随机试验", intervention: "ARIKAYCE 590 mg 每日吸入并联合多药背景方案", comparator: "多药背景方案", outcomes: ["6 月痰培养转阴", "适应证边界", "呼吸不良反应", "耳毒性与肾毒性"], findings: "适应证依据第 6 月连续 3 次月度痰培养阴性的替代终点获得加速批准；标签明确临床获益尚未确立，并对严重呼吸不良反应设置黑框警告。", limitations: "仅适用于有限且具体的人群；培养转阴不能替代症状、肺功能、生活质量或生存等临床结局，获批不等于已确认长期临床获益。", confidence: "high", content_ref: "evidence/EVD-0098.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0099", title: "CONVERT 随机试验提高 6 月痰培养转阴但增加呼吸不良事件", claim: "CONVERT 中 ARIKAYCE 加背景方案使第 6 月培养转阴率高于单用背景方案，同时呼吸系统不良事件更常见。", relation_ids: ["REL-0216"], source_ids: ["SRC-0160"], study_type: "前瞻性、多中心、开放标签、随机试验", research_stage: "临床试验", population_or_model: "对阿米卡星敏感、稳定多药方案至少 6 个月后仍培养阳性的成人 MAC 肺病患者", sample_size: 336, intervention: "ALIS 590 mg 每日吸入加指南背景方案", comparator: "指南背景方案", outcomes: ["第 6 月培养转阴", "转阴时间", "呼吸系统不良事件", "严重不良事件"], findings: "培养转阴为 29.0%（65/224）对 8.9%（10/112），P<0.001；呼吸不良事件为 87.4% 对 50.0%，严重治疗期间不良事件为 20.2% 对 17.9%。", limitations: "开放标签且主要终点是微生物学替代终点；人群多有支气管扩张或慢阻肺，不能据此确定症状、功能或生存获益。", confidence: "high", content_ref: "evidence/EVD-0099.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0100", title: "CONVERT 延长分析显示部分培养转阴可持续至停药后三个月", claim: "在同一 CONVERT 队列中，ALIS 加背景方案达到持续且停药后三个月仍保持培养转阴的比例高于背景方案。", relation_ids: ["REL-0216"], source_ids: ["SRC-0161"], study_type: "随机试验队列延长与转换者分析", research_stage: "临床试验", population_or_model: "CONVERT 随机人群及第 6 月前达到培养转阴并继续治疗 12 个月的患者", sample_size: "原随机 336 人；第 6 月前转阴者为 65 人对 10 人", intervention: "ALIS 加背景方案并在转阴后继续 12 个月", comparator: "背景方案", outcomes: ["持续培养转阴", "停药后三个月耐久转阴", "复发", "长期暴露安全性"], findings: "意向治疗人群持续且耐久转阴为 16.1%（36/224）对 0%（0/112）；转阴者中为 55.4% 对 0%，停药后三个月内复发为 9.2% 对 30.0%。", limitations: "这是同一试验的转阴者和延长分析，转换者样本小且受筛选影响；随访仅至停药后三个月，仍不能确认患者感受或功能获益。", confidence: "medium", content_ref: "evidence/EVD-0100.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },

  { id: "EVD-0101", title: "Omisirge 获批用于缩短血液恶性肿瘤脐带血移植后的中性粒细胞恢复", claim: "FDA 当前产品信息包括 12 岁及以上、计划在清髓预处理后接受脐带血移植的血液恶性肿瘤患者，以缩短中性粒细胞恢复并减少感染。", relation_ids: ["REL-0220"], source_ids: ["SRC-0162"], study_type: "监管批准与产品信息", research_stage: "已获监管批准", population_or_model: "12 岁及以上、患血液系统恶性肿瘤并计划在清髓预处理后接受脐带血移植的患者", sample_size: "批准依据包括 125 人随机 III 期试验", intervention: "Omisirge", comparator: "标准未扩增脐带血移植", outcomes: ["中性粒细胞恢复", "感染", "移植相关安全风险"], findings: "获批目标是缩短中性粒细胞恢复时间并降低感染发生；当前 FDA 页面另列严重再生障碍性贫血适应证，本证据包不沿用血液恶性肿瘤随机结果解释该人群。", limitations: "造血细胞移植本身具有移植物抗宿主病、输注反应、移植失败和感染等严重风险；不同适应证、预处理和患者人群证据不可混用。", confidence: "high", content_ref: "evidence/EVD-0101.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0102", title: "Omidubicel III 期试验缩短中性粒细胞植入并减少早期感染", claim: "随机 III 期试验中，omidubicel 相对标准脐带血移植缩短中性粒细胞植入时间，并减少早期细菌或侵袭性真菌感染。", relation_ids: ["REL-0220"], source_ids: ["SRC-0163"], study_type: "国际多中心、开放标签、随机 III 期试验", research_stage: "临床试验", population_or_model: "13至65岁、患血液恶性肿瘤且接受清髓预处理和脐带血移植的患者", sample_size: 125, intervention: "omidubicel 移植", comparator: "标准未扩增脐带血移植", outcomes: ["中性粒细胞植入", "血小板恢复", "细菌或侵袭性真菌感染", "住院天数", "GVHD", "生存"], findings: "中位中性粒细胞植入 12 对 22 天；42 天血小板恢复 55% 对 35%，2至3级首次细菌或侵袭性真菌感染 37% 对 57%，前100天院外中位天数 61 对 48 天。", limitations: "GVHD 和生存差异未达到统计学显著；开放标签、样本量和移植中心流程限制对长期净获益的判断。", confidence: "high", content_ref: "evidence/EVD-0102.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0103", title: "五项 Omidubicel 前瞻性试验合并队列的长期随访", claim: "105 人多试验合并随访提示 omidubicel 可形成持久三系造血，但该资料没有同期随机对照。", relation_ids: ["REL-0220"], source_ids: ["SRC-0164"], study_type: "五项前瞻性临床试验的预设多中心合并长期随访", research_stage: "临床试验", population_or_model: "26 个中心接受 omidubicel 移植的血液恶性肿瘤或镰状细胞血红蛋白病患者", sample_size: 105, intervention: "omidubicel 异基因造血细胞移植", comparator: "无同期对照", outcomes: ["三系造血耐久性", "免疫细胞重建", "总生存", "无病生存", "继发移植失败", "供者来源肿瘤"], findings: "中位随访 22 个月，估计 3 年总生存 62.5%、无病生存 54.0%；首年继发移植失败 5 例（5%），报告 1 例供者来源髓系肿瘤。", limitations: "跨五项试验合并、疾病和方案异质且无同期对照；最长随访不代表所有人均随访多年，生存率不能与其他移植来源直接比较。", confidence: "medium", content_ref: "evidence/EVD-0103.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },

  { id: "EVD-0104", title: "IMLYGIC 获批仅限术后复发黑色素瘤的局部可注射病灶", claim: "FDA 将 T-VEC 定位为术后复发黑色素瘤不可切除皮肤、皮下和淋巴结病灶的局部治疗，并明确未证明改善总生存或作用于内脏转移。", relation_ids: ["REL-0224"], source_ids: ["SRC-0165"], study_type: "监管批准与当前说明书", research_stage: "已获监管批准", population_or_model: "初次手术后复发、具有不可切除皮肤、皮下或淋巴结病灶的黑色素瘤患者", sample_size: "批准依据包括 OPTiM 随机 III 期试验", intervention: "IMLYGIC 病灶内注射", comparator: "监管审评依据中的 GM-CSF 对照", outcomes: ["局部适应证", "总生存限制", "内脏转移限制", "疱疹传播与暴露风险"], findings: "说明书限定病灶内局部治疗；未显示总生存改善或对内脏转移有效，并要求管理意外暴露、疱疹感染和注射部位并发症。", limitations: "不可把局部可注射病灶的缓解外推为全身转移控制；免疫功能低下和妊娠患者禁用，活病毒处理要求影响实施。", confidence: "high", content_ref: "evidence/EVD-0104.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0105", title: "OPTiM III 期试验提高持续缓解率但总生存差异未显著", claim: "OPTiM 中 T-VEC 相对 GM-CSF 提高持续缓解率和客观缓解率，但预设总生存比较未达到统计学显著。", relation_ids: ["REL-0224"], source_ids: ["SRC-0166"], study_type: "多中心、开放标签、随机 III 期试验", research_stage: "临床试验", population_or_model: "具有可注射、不可手术切除 IIIB 至 IVM1c 期黑色素瘤的患者", sample_size: 436, intervention: "病灶内 T-VEC", comparator: "皮下 GM-CSF", outcomes: ["持续缓解率", "客观缓解率", "总生存", "不良事件"], findings: "持续缓解率 16.3% 对 2.1%，客观缓解率 26.4% 对 5.7%；中位总生存 23.3 对 18.9 个月，HR 0.79，P=0.051。", limitations: "开放标签且对照为 GM-CSF 而非现代免疫检查点治疗；获益在较早分期和初治亚组更明显，但亚组不应替代总体结论。", confidence: "high", content_ref: "evidence/EVD-0105.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt },
  { id: "EVD-0106", title: "T-VEC 联合 pembrolizumab 的 III 期试验未改善 PFS 或 OS", claim: "692 人双盲 III 期试验中，在 pembrolizumab 基础上加入 T-VEC 未显著改善无进展生存或总生存。", relation_ids: ["REL-0224"], source_ids: ["SRC-0167"], study_type: "全球多中心、随机、双盲、安慰剂对照 III 期试验", research_stage: "临床试验", population_or_model: "既往未接受抗 PD-1 治疗的不可切除 IIIB 至 IVM1c 期黑色素瘤患者", sample_size: 692, intervention: "T-VEC 加 pembrolizumab", comparator: "安慰剂加 pembrolizumab", outcomes: ["无进展生存", "总生存", "客观缓解", "完全缓解", "安全性"], findings: "PFS HR 0.86（P=0.13），OS HR 0.96（P=0.74），均未显著；客观缓解率 48.6% 对 41.3%，3级及以上治疗相关不良事件 20.7% 对 19.5%。", limitations: "较高缓解率不能覆盖共同主要终点的阴性结果；试验有企业资助和作者利益关系，且只回答与 pembrolizumab 联合这一特定方案。", confidence: "high", content_ref: "evidence/EVD-0106.md", review_status: "source-checked", expert_review_status: "not-performed", publication_status: "public", curation_method: "machine-assisted", last_verified: verifiedAt }
];

const pathSources = {
  "CAP-0038": ["SRC-0156", "SRC-0157", "SRC-0158"], "TEC-0033": ["SRC-0156", "SRC-0157", "SRC-0158"], "DIS-0026": ["SRC-0156", "SRC-0157", "SRC-0158"], "CLP-0023": ["SRC-0156", "SRC-0157", "SRC-0158"],
  "CAP-0039": ["SRC-0159", "SRC-0160", "SRC-0161"], "TEC-0034": ["SRC-0159", "SRC-0160", "SRC-0161"], "DIS-0027": ["SRC-0159", "SRC-0160", "SRC-0161"], "CLP-0024": ["SRC-0159", "SRC-0160", "SRC-0161"],
  "CAP-0040": ["SRC-0162", "SRC-0163", "SRC-0164"], "TEC-0035": ["SRC-0162", "SRC-0163", "SRC-0164"], "DIS-0028": ["SRC-0162", "SRC-0163", "SRC-0164"], "CLP-0025": ["SRC-0162", "SRC-0163", "SRC-0164"],
  "CAP-0041": ["SRC-0165", "SRC-0166", "SRC-0167"], "TEC-0036": ["SRC-0165", "SRC-0166", "SRC-0167"], "DIS-0029": ["SRC-0165", "SRC-0166", "SRC-0167"], "CLP-0026": ["SRC-0165", "SRC-0166", "SRC-0167"]
};

const nodeCopy = {
  "CAP-0038": ["把识别特定分子靶点的配体、螯合结构和放射性核素组合成可生产、可质控的放射性药物。", "Pluvicto 用这项能力将 PSMA 识别与镥-177 的 β 辐射递送连接起来，治疗前还要用 PSMA PET 确认适用病灶。", "化学稳定和靶点结合不等于人体中均匀分布；辐射剂量、骨髓抑制、肾毒性和核医学操作必须单独管理。", "怎样用成像和剂量学识别真正可能获益的人，并减少正常器官的累积辐射。"],
  "TEC-0033": ["一种把镥-177 标记的小分子配体递送到 PSMA 表达病灶的放射性配体治疗。", "VISION 支持既往接受 ARPI 和紫杉类治疗人群的进展与生存获益；PSMAfore 支持更早治疗情境的进展获益和 2025 年 FDA 扩展适应证。", "必须经获批 PSMA PET 产品筛选；PSMAfore 最终总生存差异未显著且对照组交叉率高，不能只报告进展终点。", "怎样平衡治疗时机、紫杉类化疗延后、总生存不确定性和累积毒性。"],
  "DIS-0026": ["指在去势水平雄激素环境下仍进展、已发生转移，并在获批影像检查中符合 PSMA 阳性标准的前列腺癌。", "PSMA 表达可作为放射性配体成像与治疗的入口，但不同病灶可能表达不一致，且会随病程和治疗改变。", "该节点是治疗相关人群定义，不表示所有前列腺癌都适用；既往 ARPI、紫杉类治疗和是否适合推迟化疗会改变证据边界。", "如何处理 PSMA 阴性病灶、表达异质性和治疗后影像变化。"],
  "CLP-0023": ["如何把电离辐射更多递送到 PSMA 表达转移灶，同时控制骨髓、肾脏和其他正常组织的累积暴露。", "治疗链同时依赖配体化学、核素标记、PSMA PET 选择、剂量学、放射防护和血液学监测。", "随机试验支持特定人群的疾病控制；不同线次的总生存结果并不一致，不能把影像学进展延缓自动等同为延长生命。", "需要更清楚识别长期受益者、最佳序列和重复治疗的安全上限。"],

  "CAP-0039": ["把抗菌药包封在纳米尺度脂质体中，再通过专用雾化器形成适合肺部吸入的气溶胶。", "ARIKAYCE 用脂质体和吸入途径提高肺部局部阿米卡星暴露，作为既有多药方案的附加治疗。", "局部递送不会消除全身和呼吸风险；粒径、雾化器、气道结构和分泌物会共同改变沉积与耐受性。", "哪些制剂和患者特征能预测病灶暴露、培养转阴和呼吸不良反应。"],
  "TEC-0034": ["一种每日经专用雾化器吸入的阿米卡星脂质体混悬液，用于有限的难治性 MAC 肺病成人。", "CONVERT 显示加入背景方案后第 6 月痰培养转阴率提高，部分转阴可持续到停药后三个月。", "这是基于替代终点的加速批准，临床获益尚未确立；严重呼吸不良反应有黑框警告，且存在耳毒性、肾毒性和耐药风险。", "培养转阴能否稳定转化为症状、肺功能、生活质量和长期疾病负担改善。"],
  "DIS-0027": ["指接受稳定多药背景方案至少 6 个月后，痰培养仍显示鸟分枝杆菌复合群的成人肺病。", "持续培养阳性提示微生物学治疗失败风险，但患者的咳嗽、气促、肺功能和结构性肺病负担未必与培养结果同步。", "现有 ARIKAYCE 证据集中于阿米卡星敏感且选择余地有限的人群，不能外推到所有非结核分枝杆菌肺病。", "怎样同时使用培养、症状、影像和功能指标判断长期净获益。"],
  "CLP-0024": ["如何在既有多药治疗无效时增加肺部局部抗菌暴露，并让培养转阴在完成治疗后仍能维持。", "脂质体吸入递送改变给药位置和暴露方式，但需要专用设备、长期每日操作和对呼吸反应的持续监测。", "随机证据证明的是培养转阴概率提高，不是已经确认的广泛临床获益；延长分析仍来自同一试验。", "需要确认更长期的复发、症状、功能、耐药和停药后结局。"],

  "CAP-0040": ["在体外扩增脐带血来源造血祖细胞，并控制扩增与未扩增细胞组分的身份、活性和剂量。", "Omisirge 试图克服单份脐带血细胞数量有限的问题，从而缩短移植后中性粒细胞缺乏期。", "细胞数和放行指标只是制造证据；植入、感染、GVHD、移植失败和长期生存还受患者、供者、预处理和中心流程影响。", "怎样兼顾快速植入、免疫重建、移植物抗宿主病和长期克隆安全。"],
  "TEC-0035": ["一种由单份脐带血制备、含烟酰胺修饰扩增造血祖细胞和未扩增免疫细胞组分的异基因移植产品。", "随机 III 期试验显示中性粒细胞植入更快、部分早期感染更少、前 100 天院外时间更多，FDA 已批准相应适应证。", "随机试验未显示 GVHD 或生存显著差异；产品仍承担异基因移植的严重风险，长期证据主要来自无同期对照的合并队列。", "更快植入能否在不同疾病、供者匹配和移植中心中转化为长期生存和生活质量获益。"],
  "DIS-0028": ["涵盖因血液系统恶性肿瘤计划在清髓预处理后接受脐带血移植的患者。", "当缺少合适成人供者时，脐带血可提供替代移植物，但较低细胞剂量会延长造血恢复并增加早期感染负担。", "疾病种类、缓解状态、HLA 匹配、预处理和支持治疗差异很大；本节点不包含严重再生障碍性贫血适应证的证据外推。", "哪些人群能从扩增脐带血产品中获得超过其他供者来源的长期净获益。"],
  "CLP-0025": ["如何缩短脐带血移植后的中性粒细胞缺乏期，减少早期感染和住院，同时保持持久、安全的造血与免疫重建。", "离体扩增可以增加早期可用祖细胞，但移植结局仍取决于供者匹配、清髓、免疫抑制、感染预防和中心经验。", "随机试验支持更快植入和较少早期感染，却没有证明生存或 GVHD 显著改善；长期队列没有同期对照。", "需要直接比较不同供者来源、长期生存、生活质量、晚期移植失败和克隆性风险。"],

  "CAP-0041": ["通过删除、插入和调控病毒基因，使病毒更偏向在肿瘤中复制并表达预设免疫效应分子。", "T-VEC 由 HSV-1 改造而来，病灶内注射后尝试局部裂解肿瘤并表达 GM-CSF。", "工程病毒仍是可传播的活生物制品；体内选择性、疱疹感染、意外暴露和注射位置都要按产品验证。", "怎样提高远隔病灶效应，同时让复制、传播和免疫毒性保持可控。"],
  "TEC-0036": ["一种经工程改造并表达 GM-CSF 的 HSV-1 溶瘤病毒，直接注射到可触及的黑色素瘤病灶。", "OPTiM 显示持续缓解率高于 GM-CSF，FDA 批准局部病灶适应证；后续与 pembrolizumab 联合的 III 期试验未改善 PFS 或 OS。", "标签未证明总生存改善或作用于内脏转移；免疫功能低下和妊娠患者禁用，并需防止疱疹传播和意外暴露。", "哪些联合方案或生物标志物能把局部反应转化为可靠的全身获益。"],
  "DIS-0029": ["指初次手术后复发、无法切除，并存在可见、可触及或超声可定位的皮肤、皮下或淋巴结黑色素瘤病灶。", "可注射病灶允许局部递送工程病毒并反复观察，但内脏转移和不可注射病灶仍决定整体疾病风险。", "现有适应证不代表所有晚期黑色素瘤都适用；分期、既往治疗、免疫状态和病灶分布会影响选择。", "怎样确定局部病灶控制在全身治疗序列中的合理位置。"],
  "CLP-0026": ["如何通过病灶内治疗控制可注射黑色素瘤，同时判断这种局部反应能否带来全身疾病和生存获益。", "工程病毒可局部复制、裂解和释放免疫信号，但远隔效应必须用全身终点而不是机制推断证明。", "T-VEC 提高了持续缓解率，却未在关键试验中证明总生存改善；与 pembrolizumab 联合也未显著改善 PFS 或 OS。", "需要区分局部缓解、远隔病灶反应、患者症状、全身治疗需求和生存。"]
};

const nodeSummaries = nodes.map((node) => ({ node_id: node.id, content_ref: node.content_ref, source_ids: pathSources[node.id], review_status: "source-checked", last_verified: verifiedAt }));
const publicConnections = nodes.map((node) => ({ node_id: node.id, paragraphs: nodeCopy[node.id].slice(0, 3), source_ids: pathSources[node.id], review_status: "source-checked", curation_method: "machine-assisted", last_verified: verifiedAt }));

function appendItems(relativePath, records, compact = false) {
  const file = path.join(root, relativePath);
  const text = fs.readFileSync(file, "utf8");
  const dataset = JSON.parse(text);
  const existing = new Set(dataset.items.map((item) => item.id ?? item.node_id));
  const pending = records.filter((item) => !existing.has(item.id ?? item.node_id));
  if (pending.length === 0) return;
  const match = text.match(/\r?\n  \]\r?\n}\s*$/);
  if (!match || match.index === undefined) throw new Error(`无法定位 ${relativePath} 的 items 结尾`);
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const rendered = pending.map((item) => compact
    ? `    ${JSON.stringify(item)}`
    : JSON.stringify(item, null, 2).split("\n").map((line) => `    ${line}`).join(newline)
  ).join(`,${newline}`);
  const comma = dataset.items.length > 0 ? "," : "";
  const appended = `${text.slice(0, match.index)}${comma}${newline}${rendered}${newline}  ]${newline}}${newline}`;
  fs.writeFileSync(file, appended.replace(/"updated_at": "[^"]+"/, `"updated_at": "${verifiedAt}"`), "utf8");
}

function addNavigationIds(groupId, ids) {
  const file = path.join(root, "data/navigation-groups.json");
  let text = fs.readFileSync(file, "utf8");
  const dataset = JSON.parse(text);
  const group = dataset.items.find((item) => item.id === groupId);
  if (!group) throw new Error(`找不到导航组 ${groupId}`);
  const merged = [...group.primary_node_ids, ...ids.filter((id) => !group.primary_node_ids.includes(id))];
  const pattern = new RegExp(`("id": "${groupId}"[\\s\\S]*?"primary_node_ids": \\[)[\\s\\S]*?(\\])`);
  if (!pattern.test(text)) throw new Error(`无法定位导航组 ${groupId} 的 primary_node_ids`);
  text = text.replace(pattern, `$1${merged.map((id) => `"${id}"`).join(", ")}$2`);
  fs.writeFileSync(file, text.replace(/"updated_at": "[^"]+"/, `"updated_at": "${verifiedAt}"`), "utf8");
}

function writeIfMissing(relativePath, content) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) fs.writeFileSync(file, content, "utf8");
}

function nodeMarkdown(node) {
  const [summary, connection, boundary, question] = nodeCopy[node.id];
  return `---\nid: ${node.id}\ntitle: ${node.name}\nreview_status: source-checked\n---\n\n# ${node.name}\n\n## 一句话说明\n\n${summary}\n\n## 医学连接\n\n${connection}\n\n## 当前证据边界\n\n${boundary}\n\n## 仍待回答的问题\n\n${question}\n`;
}

function evidenceMarkdown(card) {
  const refs = card.source_ids.map((id) => {
    const source = sources.find((item) => item.id === id);
    return `- [${source.title}](${source.url})`;
  }).join("\n");
  return `---\nid: ${card.id}\ntitle: ${card.title}\nrelation_ids:\n${card.relation_ids.map((id) => `  - ${id}`).join("\n")}\nsource_ids:\n${card.source_ids.map((id) => `  - ${id}`).join("\n")}\nreview_status: source-checked\nexpert_review_status: not-performed\npublication_status: public\ncuration_method: machine-assisted\n---\n\n# ${card.title}\n\n## 研究问题\n\n${card.claim}\n\n## 研究设计与对象\n\n${card.study_type}；对象为${card.population_or_model}；样本量：${card.sample_size}。\n\n## 干预与比较\n\n- 干预：${card.intervention}\n- 比较：${card.comparator}\n\n## 主要结果\n\n${card.findings}\n\n## 局限与谨慎解释\n\n${card.limitations}\n\n## 来源\n\n${refs}\n`;
}

appendItems("data/nodes.json", nodes, true);
appendItems("data/relations.json", relations, true);
appendItems("data/sources.json", sources);
appendItems("data/evidence-index.json", evidence);
appendItems("data/node-summaries.json", nodeSummaries, true);
appendItems("data/public-connections.json", publicConnections);

addNavigationIds("NAV-0011", ["CAP-0038", "TEC-0033"]);
addNavigationIds("NAV-0013", ["CAP-0039", "TEC-0034", "CAP-0040", "TEC-0035", "CAP-0041", "TEC-0036"]);
addNavigationIds("NAV-0027", ["DIS-0026", "CLP-0023", "DIS-0029", "CLP-0026"]);
addNavigationIds("NAV-0028", ["DIS-0028", "CLP-0025"]);
addNavigationIds("NAV-0029", ["DIS-0027", "CLP-0024"]);

for (const node of nodes) writeIfMissing(node.content_ref, nodeMarkdown(node));
for (const card of evidence) writeIfMissing(card.content_ref, evidenceMarkdown(card));

console.log(`第三阶段第一波入库完成：${nodes.length} 个节点、${relations.length} 条关系、${sources.length} 条来源、${evidence.length} 张证据卡。`);
