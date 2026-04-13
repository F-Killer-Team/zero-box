import React, { useEffect, useRef, useState } from "react";
import DropZone from "./components/DropZone";
import ProgressPanel from "./components/ProgressPanel";
import LogPanel from "./components/LogPanel";
import ResultCard from "./components/ResultCard";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const TERMINAL_STATUSES = new Set(["MALICIOUS", "CLEAN", "DESTROYED", "FAILED"]);

const STATUS_MESSAGE_MAP = {
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

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [currentTypingLog, setCurrentTypingLog] = useState(null);
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const eventSourceRef = useRef(null);
  const logQueueRef = useRef([]);
  const isProcessingLogRef = useRef(false);
  const lastMessageRef = useRef("");
  const typingIntervalRef = useRef(null);
  const nextLineTimeoutRef = useRef(null);

  const closeEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const clearLogTimers = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (nextLineTimeoutRef.current) {
      clearTimeout(nextLineTimeoutRef.current);
      nextLineTimeoutRef.current = null;
    }
  };

  const clearLogState = () => {
    logQueueRef.current = [];
    isProcessingLogRef.current = false;
    lastMessageRef.current = "";
    clearLogTimers();
    setLogs([]);
    setCurrentTypingLog(null);
  };

  const resetScreen = () => {
    closeEventStream();
    clearLogState();
    setJobId(null);
    setResult(null);
    setTargetProgress(0);
    setDisplayProgress(0);
    setStatus("idle");
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      closeEventStream();
      clearLogTimers();
    };
  }, []);

  useEffect(() => {
    if (displayProgress === targetProgress) {
      return;
    }

    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(timer);
          return targetProgress;
        }

        const next = prev + 1;
        return next > targetProgress ? targetProgress : next;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [targetProgress, displayProgress]);

  const processNextLog = () => {
    if (isProcessingLogRef.current) {
      return;
    }

    const nextLog = logQueueRef.current.shift();

    if (!nextLog) {
      return;
    }

    isProcessingLogRef.current = true;
    setCurrentTypingLog({
      ...nextLog,
      text: "",
    });

    let index = 0;

    typingIntervalRef.current = setInterval(() => {
      index += 1;

      const nextText = nextLog.fullText.slice(0, index);

      setCurrentTypingLog({
        ...nextLog,
        text: nextText,
      });

      if (index >= nextLog.fullText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        setLogs((prev) => [
          ...prev,
          {
            ...nextLog,
            text: nextLog.fullText,
          },
        ]);

        setCurrentTypingLog(null);

        nextLineTimeoutRef.current = setTimeout(() => {
          isProcessingLogRef.current = false;
          nextLineTimeoutRef.current = null;
          processNextLog();
        }, 700);
      }
    }, 60);
  };

  const enqueueLog = (message, type = "normal") => {
    if (!message) {
      return;
    }

    if (lastMessageRef.current === message) {
      return;
    }

    lastMessageRef.current = message;

    const now = new Date().toLocaleTimeString();

    logQueueRef.current.push({
      id: `${Date.now()}-${Math.random()}`,
      time: `[${now}]`,
      fullText: message,
      type,
    });

    processNextLog();
  };

  const mapBackendStatusToUiStatus = (backendStatus) => {
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
  };

  const buildResultFromJob = (job) => {
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
  };

  const fetchFinalJob = async (currentJobId) => {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${currentJobId}`);

    if (!response.ok) {
      throw new Error("최종 분석 결과를 불러오지 못했습니다.");
    }

    const job = await response.json();
    const nextResult = buildResultFromJob(job);

    if (nextResult) {
      setResult(nextResult);
    }
  };

  const connectJobEvents = (currentJobId) => {
    closeEventStream();

    const eventSource = new EventSource(
      `${API_BASE_URL}/api/jobs/${currentJobId}/events`
    );

    eventSource.onmessage = async (event) => {
      const payload = JSON.parse(event.data);

      setStatus(mapBackendStatusToUiStatus(payload.status));
      setTargetProgress(payload.progress ?? 0);

      const message =
        STATUS_MESSAGE_MAP[payload.status] || "작업을 처리하고 있습니다.";

      if (payload.status === "MALICIOUS" || payload.status === "FAILED") {
        enqueueLog(message, "danger");
      } else {
        enqueueLog(message);
      }

      if (TERMINAL_STATUSES.has(payload.status)) {
        if (payload.status === "FAILED") {
          setIsRunning(false);
          closeEventStream();
          return;
        }

        try {
          await fetchFinalJob(currentJobId);
        } catch (error) {
          enqueueLog(error.message || "결과 조회 중 오류가 발생했습니다.", "danger");
        }

        if (payload.status === "DESTROYED") {
          setIsRunning(false);
          closeEventStream();
        }
      }
    };

    eventSource.onerror = () => {
      enqueueLog("실시간 연결이 종료되었습니다.", "danger");
      setStatus("error");
      setIsRunning(false);
      closeEventStream();
    };

    eventSourceRef.current = eventSource;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("파일을 먼저 선택하세요.");
      return;
    }

    try {
      closeEventStream();
      clearLogState();

      setIsRunning(true);
      setJobId(null);
      setResult(null);
      setTargetProgress(0);
      setDisplayProgress(0);
      setStatus("idle");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("파일 업로드에 실패했습니다.");
      }

      const data = await response.json();
      setJobId(data.job_id);

      connectJobEvents(data.job_id);
    } catch (error) {
      enqueueLog(error.message || "요청 처리 중 오류가 발생했습니다.", "danger");
      setStatus("error");
      setIsRunning(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>1회용 격리실 파일 분석 시스템</h1>

        <p className="subtitle">
          의심 파일을 내 PC 대신 격리 컨테이너에서 분석합니다.
        </p>

        <DropZone
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          handleUpload={handleUpload}
          isRunning={isRunning}
        />

        <div className="test-button-group">
          <button
            className="test-button reset-button"
            onClick={resetScreen}
            disabled={isRunning}
          >
            화면 초기화
          </button>
        </div>

        {jobId && <p className="job-id">현재 작업 ID: {jobId}</p>}

        <ProgressPanel status={status} progress={displayProgress} />
        <LogPanel logs={logs} currentTypingLog={currentTypingLog} />
        <ResultCard result={result} />
      </div>
    </div>
  );
}

export default App;