import { useEffect, useRef, useState } from "react";
import { createJobEventSource, fetchJob, uploadFile } from "../api/sandboxApi";
import {
  mapBackendStatusToUiStatus,
  STATUS_MESSAGE_MAP,
  TERMINAL_STATUSES,
} from "../utils/statusMapper";
import { buildResultFromJob } from "../utils/resultBuilder";

export function useSandboxAnalysis() {
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

  const fetchFinalJob = async (currentJobId) => {
    const job = await fetchJob(currentJobId);
    const nextResult = buildResultFromJob(job);

    if (nextResult) {
      setResult(nextResult);
    }
  };

  const connectJobEvents = (currentJobId) => {
    closeEventStream();

    const eventSource = createJobEventSource(currentJobId);

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

      const data = await uploadFile(selectedFile);
      setJobId(data.job_id);

      connectJobEvents(data.job_id);
    } catch (error) {
      enqueueLog(error.message || "요청 처리 중 오류가 발생했습니다.", "danger");
      setStatus("error");
      setIsRunning(false);
    }
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

  return {
    selectedFile,
    setSelectedFile,
    jobId,
    status,
    progress: displayProgress,
    logs,
    currentTypingLog,
    result,
    isRunning,
    handleUpload,
    resetScreen,
  };
}