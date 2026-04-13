export const TERMINAL_STATUSES = new Set([
  "MALICIOUS",
  "CLEAN",
  "DESTROYED",
  "FAILED",
]);

export const STATUS_MESSAGE_MAP = {
  UPLOADED: "의심 파일이 업로드되었습니다. 보안 샌드박스를 준비합니다.",
  POD_REQUESTED: "보안 샌드박스(K8s Pod) 프로비저닝 요청 중...",
  POD_RUNNING: "격리실 생성 완료. 안전한 분석 환경이 준비되었습니다.",
  ANALYZING: "파일 실행 및 행위 분석 중...",
  MALICIOUS: "치명적 악성코드가 탐지되었습니다. 위험 행위를 즉시 차단합니다.",
  CLEAN: "위협 요소가 발견되지 않았습니다. 정상 파일로 판정되었습니다.",
  TERMINATING: "격리실 즉시 파괴 중...",
  DESTROYED: "격리실 완전 삭제 완료. 고객님의 인프라는 안전합니다.",
  FAILED: "분석 중 오류가 발생했습니다. 작업을 종료합니다.",
};

export function mapBackendStatusToUiStatus(backendStatus) {
  const statusMap = {
    UPLOADED: "uploading",
    POD_REQUESTED: "provisioning",
    POD_RUNNING: "provisioning",
    ANALYZING: "analyzing",
    MALICIOUS: "malicious",
    CLEAN: "safe",
    TERMINATING: "terminating",
    DESTROYED: "done",
    FAILED: "error",
  };

  return statusMap[backendStatus] || "idle";
}