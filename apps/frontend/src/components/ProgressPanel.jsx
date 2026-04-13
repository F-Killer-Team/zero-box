import React from "react";

function ProgressPanel({ status, progress }) {
  const statusText = {
    idle: "대기 중",
    uploading: "파일 업로드 완료",
    provisioning: "격리 파드 생성 중",
    analyzing: "파일 분석 중",
    malicious: "악성코드 감지",
    safe: "정상 파일 판정",
    terminating: "격리실 삭제 중",
    done: "완료",
    error: "오류 발생",
  };

  return (
    <div className="panel">
      <h2>진행 상태</h2>

      <p className={`status-text ${status}`}>
        {statusText[status] || "알 수 없음"}
      </p>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="progress-percent">{progress}%</p>
    </div>
  );
}

export default ProgressPanel;