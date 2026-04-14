import React from "react";
import DropZone from "./components/DropZone";
import ProgressPanel from "./components/ProgressPanel";
import LogPanel from "./components/LogPanel";
import ResultCard from "./components/ResultCard";
import { useSandboxAnalysis } from "./hooks/useSandboxAnalysis";
import "./App.css";

function App() {
  const {
    selectedFile,
    setSelectedFile,
    jobId,
    status,
    progress,
    logs,
    currentTypingLog,
    result,
    isRunning,
    handleUpload,
    resetScreen,
  } = useSandboxAnalysis();

  return (
    <div className="app">
      <div className="container">
        <h1>ZERO BOX</h1>

        <p className="subtitle">
          의심 파일을 내 PC 대신 안전한 격리 환경에서 분석합니다.
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

        <ProgressPanel status={status} progress={progress} />
        <LogPanel logs={logs} currentTypingLog={currentTypingLog} />
        <ResultCard result={result} />
      </div>
    </div>
  );
}

export default App;