export const REFERENCE_REVIEW_WORKFLOW_VERSION = "reference-review-v1-2026.08.01";
export const REFERENCE_REVIEW_RUBRIC_VERSION = "reading-level-rubric-v1-2026.08.01";

export const REFERENCE_LEVEL_RUBRIC = Object.freeze({
  L1: { label: "基础识别和短句", sentence: "以短句、直接陈述和单一步骤为主", vocabulary: "绝大部分为最常见生活词", comprehension: "定位显性事实即可" },
  L2: { label: "生活功能文本", sentence: "简单连接句和少量从句", vocabulary: "常见生活与服务场景词", comprehension: "理解通知、安排和直接原因" },
  L3: { label: "多段生活与工作文本", sentence: "多段信息、常见从句和指代", vocabulary: "生活、工作及培训词汇混合", comprehension: "跨句整合细节与顺序" },
  L4: { label: "复杂信息与一般推断", sentence: "较长句、嵌套关系和信息转折", vocabulary: "出现较低频或抽象常用词", comprehension: "需要一般推断、对比或识别作者目的" },
  L5: { label: "抽象观点和密集论证", sentence: "复杂句法和较高信息密度", vocabulary: "抽象词、名词化和学术常用词增加", comprehension: "追踪论证、隐含关系与立场" },
  L6: { label: "高级连续文本", sentence: "长距离依存、灵活句式和高密度衔接", vocabulary: "低频、抽象或领域词较多", comprehension: "综合复杂论证、语气和多层推断" },
});

export const REFERENCE_EVIDENCE_CODES = Object.freeze([
  "sentence-load",
  "vocabulary-rarity",
  "inference-load",
  "discourse-density",
  "format-support",
]);

const LEVELS = new Set(Object.keys(REFERENCE_LEVEL_RUBRIC));
const CONFIDENCE = new Set(["low", "medium", "high"]);
const EVIDENCE = new Set(REFERENCE_EVIDENCE_CODES);

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function buildBlindedReviewPacket(records, reviewerSlot) {
  if (!/^[AB]$/.test(reviewerSlot)) throw new Error("reviewerSlot must be A or B");
  const packetId = `voa-seed-120-reviewer-${reviewerSlot.toLowerCase()}-v1`;
  const order = records
    .map((record) => record.id)
    .sort((a, b) => stableHash(`${packetId}:${a}`) - stableHash(`${packetId}:${b}`) || a.localeCompare(b));
  return {
    workflowVersion: REFERENCE_REVIEW_WORKFLOW_VERSION,
    rubricVersion: REFERENCE_REVIEW_RUBRIC_VERSION,
    packetId,
    reviewerSlot,
    blindFields: ["provisionalInternalLevel", "features", "split", "source.officialLevel", "otherReviewerAnswers"],
    itemCount: order.length,
    order,
  };
}

export function materializeBlindedPacket(packet, records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  return {
    ...packet,
    rubric: REFERENCE_LEVEL_RUBRIC,
    evidenceCodes: REFERENCE_EVIDENCE_CODES,
    items: packet.order.map((itemId, index) => {
      const record = byId.get(itemId);
      if (!record) throw new Error(`Unknown corpus item: ${itemId}`);
      return {
        sequence: index + 1,
        itemId,
        title: record.title,
        text: record.text,
        response: { level: null, confidence: null, evidenceCodes: [], note: "" },
      };
    }),
  };
}

export function validateReviewSubmission(packet, submission) {
  const issues = [];
  if (submission?.packetId !== packet.packetId) issues.push("packet-id-mismatch");
  if (submission?.workflowVersion !== packet.workflowVersion) issues.push("workflow-version-mismatch");
  if (submission?.rubricVersion !== packet.rubricVersion) issues.push("rubric-version-mismatch");
  if (!submission?.reviewerId?.trim()) issues.push("missing-reviewer-id");
  if (!submission?.completedAt || Number.isNaN(Date.parse(submission.completedAt))) issues.push("invalid-completed-at");
  const responses = Array.isArray(submission?.responses) ? submission.responses : [];
  const responseIds = responses.map((response) => response.itemId);
  if (responses.length !== packet.itemCount) issues.push("incomplete-response-count");
  if (new Set(responseIds).size !== responseIds.length) issues.push("duplicate-response-id");
  if (packet.order.some((itemId) => !responseIds.includes(itemId)) || responseIds.some((itemId) => !packet.order.includes(itemId))) issues.push("response-set-mismatch");
  for (const response of responses) {
    if (!LEVELS.has(response.level)) issues.push(`invalid-level:${response.itemId}`);
    if (!CONFIDENCE.has(response.confidence)) issues.push(`invalid-confidence:${response.itemId}`);
    if (!Array.isArray(response.evidenceCodes) || response.evidenceCodes.length === 0 || response.evidenceCodes.some((code) => !EVIDENCE.has(code))) issues.push(`invalid-evidence:${response.itemId}`);
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

function validatePair(packets, submissions) {
  if (packets.length !== 2 || submissions.length !== 2) throw new Error("Exactly two review packets and submissions are required");
  const validations = submissions.map((submission, index) => validateReviewSubmission(packets[index], submission));
  if (validations.some((result) => !result.valid)) throw new Error(`Invalid review submission: ${validations.flatMap((result) => result.issues).join(",")}`);
  if (submissions[0].reviewerId.trim() === submissions[1].reviewerId.trim()) throw new Error("Independent reviewers must use different reviewer IDs");
}

export function reconcileIndependentReviews(records, packets, submissions, adjudications = []) {
  validatePair(packets, submissions);
  const responses = submissions.map((submission) => new Map(submission.responses.map((response) => [response.itemId, response])));
  const adjudicationById = new Map(adjudications.map((item) => [item.itemId, item]));
  const reviewerIds = new Set(submissions.map((submission) => submission.reviewerId.trim()));
  let agreements = 0;
  let adjudicated = 0;
  const unresolved = [];
  const mergedRecords = records.map((record) => {
    const first = responses[0].get(record.id);
    const second = responses[1].get(record.id);
    const humanLabels = [
      { reviewerId: submissions[0].reviewerId.trim(), level: first.level, confidence: first.confidence, evidenceCodes: first.evidenceCodes, note: first.note ?? "", completedAt: submissions[0].completedAt },
      { reviewerId: submissions[1].reviewerId.trim(), level: second.level, confidence: second.confidence, evidenceCodes: second.evidenceCodes, note: second.note ?? "", completedAt: submissions[1].completedAt },
    ];
    let internalLevel = null;
    let reviewStatus = record.reviewStatus;
    if (first.level === second.level) {
      agreements += 1;
      internalLevel = first.level;
      reviewStatus = "label-reviewed";
    } else {
      const decision = adjudicationById.get(record.id);
      const validAdjudication = decision && LEVELS.has(decision.level) && decision.reviewerId?.trim() && !reviewerIds.has(decision.reviewerId.trim()) && Array.isArray(decision.evidenceCodes) && decision.evidenceCodes.length > 0 && decision.evidenceCodes.every((code) => EVIDENCE.has(code));
      if (validAdjudication) {
        adjudicated += 1;
        internalLevel = decision.level;
        reviewStatus = "label-reviewed";
        humanLabels.push({ reviewerId: decision.reviewerId.trim(), level: decision.level, confidence: decision.confidence ?? "medium", evidenceCodes: decision.evidenceCodes, note: decision.note ?? "", completedAt: decision.completedAt ?? null, role: "adjudicator" });
      } else {
        unresolved.push(record.id);
      }
    }
    return { ...record, humanLabels, internalLevel, reviewStatus, scoreEligible: false };
  });
  return {
    records: mergedRecords,
    summary: {
      total: records.length,
      agreements,
      agreementRate: records.length ? Number((agreements / records.length).toFixed(4)) : 0,
      adjudicated,
      unresolvedCount: unresolved.length,
      unresolved,
      labelReviewed: mergedRecords.filter((record) => record.reviewStatus === "label-reviewed").length,
      scoreEligible: 0,
    },
  };
}
