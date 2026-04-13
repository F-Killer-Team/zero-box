import React from "react";

function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className={`result-card ${result.type}`}>
      <div className="result-badge">{result.title}</div>

      <h2>최종 판정 결과</h2>
      <p>{result.message}</p>
      {result.detail && <pre className="result-detail">{result.detail}</pre>}
    </div>
  );
}

export default ResultCard;