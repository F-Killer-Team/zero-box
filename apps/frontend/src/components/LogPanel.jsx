import React, { useEffect, useRef } from "react";

function LogPanel({ logs, currentTypingLog }) {
  const logBoxRef = useRef(null);

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs, currentTypingLog]);

  return (
    <div className="panel">
      <h2>실시간 분석 로그</h2>
      <div className="log-box" ref={logBoxRef}>
        {logs.length === 0 && !currentTypingLog ? (
          <p>대기 중입니다.</p>
        ) : (
          <>
            {logs.map((log) => (
              <p key={log.id} className={log.type === "danger" ? "log-danger" : ""}>
                <span className="log-time">{log.time}</span>{" "}
                <span>{log.text}</span>
              </p>
            ))}

            {currentTypingLog && (
              <p
                className={currentTypingLog.type === "danger" ? "log-danger" : ""}
              >
                <span className="log-time">{currentTypingLog.time}</span>{" "}
                <span className="typing-text">{currentTypingLog.text}</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LogPanel;