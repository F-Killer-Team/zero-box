import React, { useState } from "react";

function DropZone({ selectedFile, setSelectedFile, handleUpload, isRunning }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`dropzone ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2>의심 파일 업로드</h2>

      <p>
        {isDragging
          ? "파일을 놓으면 선택됩니다"
          : "파일을 드래그하거나 선택한 뒤 분석을 실행하세요"}
      </p>

      <input type="file" onChange={handleChange} disabled={isRunning} />

      <button onClick={handleUpload} disabled={isRunning || !selectedFile}>
        {isRunning ? "분석 진행 중..." : "격리실로 전송"}
      </button>
    </div>
  );
}

export default DropZone;