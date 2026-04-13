export function buildResultFromJob(job) {
  if (!job) {
    return null;
  }

  if (job.status === "MALICIOUS") {
    return {
      type: "malicious",
      title: "악성코드 탐지",
      message: "치명적 악성 행위가 탐지되어 즉시 차단되었습니다.",
      detail:
        "격리된 샌드박스 내부에서만 실행되었으며, 실제 사용자 환경은 보호되었습니다.",
    };
  }

  if (job.status === "CLEAN" || job.status === "DESTROYED") {
    const summary = job.result?.summary || "";
    const isMalicious = /malware|악성|위협|suspicious/i.test(summary);

    return {
      type: isMalicious ? "malicious" : "safe",
      title: isMalicious ? "위험 파일" : "안전 확인",
      message: isMalicious
        ? "위험 요소가 발견되었습니다."
        : "위협 요소가 발견되지 않았습니다.",
      detail: isMalicious
        ? "보안을 위해 추가 검토가 필요합니다."
        : "격리 분석이 완료되었으며, 고객 환경에는 영향이 없습니다.",
    };
  }

  if (job.status === "FAILED") {
    return {
      type: "malicious",
      title: "분석 실패",
      message: "분석 중 오류가 발생했습니다.",
      detail: "잠시 후 다시 시도해 주세요.",
    };
  }

  return null;
}