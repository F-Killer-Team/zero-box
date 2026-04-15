# ZERO BOX

> KT Cloud Hackathon 2026 | 2nd Place  
> K3S 기반 1회용 격리실을 동적으로 생성해 의심 파일을 격리 분석하는 랜섬웨어 대응 서비스

## Team

`F-Killer Team`  
고객사 시스템의 고질적인 레거시와 인프라 문제를 해결하는 것을 목표로 한 `클라우드 보안 · 인프라 자동화 팀`

## Service Overview

ZERO BOX는 기업 임직원이 의심스러운 파일을 직접 실행하지 않고도, 웹에서 안전하게 분석을 요청할 수 있도록 설계된 서비스입니다.

- 서비스 타겟: `기업 임직원`
- 서비스 분야: `사이버 보안`
- 핵심 개념: `1회용 격리실`, `On-Demand Sandbox`, `실시간 분석 가시화`

## Background & Motivation

샌드박스는 의심스러운 파일을 실제 환경과 분리된 격리 공간에서 안전하게 실행·분석하는 보안 기술입니다.

하지만 기존 상용 샌드박스는 다음과 같은 한계를 가집니다.

1. 기존 상용 샌드박스 솔루션은 도입 비용과 운영 부담이 크고, 유연한 확장과 즉각적인 대응에 한계가 있습니다.
2. 기존 패턴 매칭 중심 보안 방식은 실행 전까지 식별이 어려운 신종·변종 랜섬웨어 대응에 한계가 있습니다.
3. 실무자는 업무상 의심 파일을 확인해야 하지만, 번거로운 보안 절차로 인해 파일을 직접 실행할 위험에 노출됩니다.
4. 클라우드 전환이 가속화되면서, 보안 솔루션 역시 더 유연하고 즉각적으로 대응할 수 있는 구조가 필요해졌습니다.

ZERO BOX는 이 문제를 `K3S 기반 1회용 샌드박스`로 해결합니다.

## Why ZERO BOX

기존 샌드박스가 별도 분석 환경을 상시 운영하는 구조라면, ZERO BOX는 `필요한 순간에만 격리실을 생성하고 분석 후 즉시 삭제`하는 구조입니다.

- 상시 운영형 분석 환경 대신 `On-Demand Sandbox`
- 고정형 운영 대신 `동적 생성·즉시 폐기`
- 서비스형 의존 대신 `직접 통제 가능한 실행 흐름`
- 무거운 분석 인프라 대신 `K3S 기반 경량 격리실`

## Sandbox Solution Comparison

| 비교 항목 | FortiSandbox | WildFire | ZERO BOX |
|---|---|---|---|
| 분석 환경 | 장비 · VM 기반 분석 환경 | 클라우드 분석 서비스 | K3S 기반 1회용 격리실 |
| 운영 방식 | 별도 환경 상시 운영 | 서비스형 분석 제공 | 필요 시 생성 후 즉시 삭제 |
| 비용 구조 | 도입 · 운영 비용 부담 | 구독형 비용 | 사용량 기반 |
| 확장 방식 | 장비 · VM 자원 중심 | 서비스 범위 내 확장 | 클러스터 기반 유연 확장 |
| 통제 수준 | 내부 환경 운영 가능 | 직접 통제 제한 | 생성 · 삭제 흐름 직접 제어 |

## System Architecture

![System Architecture](./demo_assets/architecture.png)

### Layer 1. 사용자 / 클라이언트 계층

- 웹 브라우저
- 파일 업로드 기반 접근
- HTTPS · REST · SSE

### Layer 2. 애플리케이션 / 서비스 계층

- FastAPI Backend
- Frontend Pod · Backend Pod · Sandbox Job/Pod

### Layer 3. 클라우드 인프라 / 운영 계층

- Terraform · Ansible
- AWS EC2 기반 K3S 클러스터
- VPC · RBAC

### Core Flow

1. 사용자가 프론트엔드에서 의심 파일 업로드
2. 백엔드 API가 파일을 저장하고 Job 생성
3. 백엔드가 Kubernetes API에 Sandbox Job 생성 요청
4. Master Node가 Worker Node에 1회용 격리실 Pod 스케줄링
5. Sandbox Pod가 백엔드로부터 파일을 다운로드해 실행 및 분석
6. 분석 결과를 백엔드로 콜백
7. 프론트엔드가 결과를 실시간으로 표시
8. 분석 완료 후 Sandbox Pod 즉시 종료 및 삭제

## Infra-to-Deployment Pipeline

ZERO BOX는 인프라부터 배포까지 전 과정을 자동화했습니다.

- `Terraform`: AWS 인프라 구성
- `Ansible`: K3S 설치 및 초기 리소스 배포
- `Docker`: Frontend / Backend / Sandbox 이미지 분리
- `GitHub Actions`: 빌드 · 배포 자동화

전체 파이프라인 흐름:

`GitHub Actions -> 이미지 빌드 -> Docker Hub Push -> Terraform Apply -> Ansible 배포 -> K3S 서비스 실행`

## Demo Scenario

### 1. 의심 파일 업로드 UI

사용자는 웹 UI에서 의심 파일을 선택하고 즉시 분석을 시작할 수 있습니다.

### 2. 진행 상태 및 실시간 로그

프론트엔드는 진행 상태와 분석 로그를 실시간으로 보여주며, 사용자는 현재 단계와 결과를 한눈에 확인할 수 있습니다.

## Normal File Analysis (`normal.py`)

정상 파일은 1회용 샌드박스에서 실행된 뒤 `CLEAN` 판정을 받고 종료됩니다.

![Clean UI](./demo_assets/clean-analysis-ui.gif)

정상 파일 업로드 후 1회용 Sandbox Pod가 생성되고, 분석 완료 후 종료되는 흐름을 확인할 수 있습니다.

![Clean Pod Lifecycle](./demo_assets/clean-pod-lifecycle.gif)

격리실 내부에서 파일이 실제로 실행되며, 정상 실행 로그와 최종 `CLEAN` 판정 결과를 확인할 수 있습니다.

![Clean Analysis Log](./demo_assets/clean-analysis-log.png)

## Malicious File Analysis (`ransomware.py`)

악성 파일은 샌드박스 내부에서 실행되며, 악성 행위 로그를 기반으로 `MALICIOUS` 판정을 받습니다.

![Malicious UI](./demo_assets/malicious-analysis-ui.gif)

악성 파일 업로드 후 1회용 Sandbox Pod가 생성되고, 분석 완료 후 종료되는 흐름을 확인할 수 있습니다.

![Malicious Pod Lifecycle](./demo_assets/malicious-pod-lifecycle.gif)

격리실 내부에서 파일이 실제로 실행되며, 악성 행위 로그와 최종 `MALICIOUS` 판정 결과를 확인할 수 있습니다.

![Malicious Analysis Log](./demo_assets/malicious-analysis-log.png)

## Tech Stack

### Frontend

- React
- Vite
- CSS
- SSE

### Backend

- FastAPI
- Python
- Pydantic

### Sandbox

- Docker
- Bash
- Python

### Infra / DevOps

- AWS EC2
- K3S
- Kubernetes Job / Pod
- Terraform
- Ansible
- GitHub Actions
- Docker Hub

## Repository Structure

```text
.
├─ apps
│  ├─ backend
│  ├─ frontend
│  └─ sandbox
├─ infra
├─ k8s
│  ├─ ansible
│  ├─ network
│  └─ pods
└─ demo_assets
```

## What We Built

### Backend

- 파일 업로드 API
- 작업 상태 조회 API
- SSE 이벤트 스트림
- Sandbox 결과 콜백 처리
- 업로드 파일 다운로드 엔드포인트

자세한 내용은 [apps/backend/README.md](./apps/backend/README.md)와 [apps/backend/API_CONTRACT.md](./apps/backend/API_CONTRACT.md)를 참고하세요.

### Infrastructure

- Terraform으로 AWS 네트워크 및 EC2 구성
- Ansible로 K3S 설치 및 초기 리소스 배포
- Backend / Frontend / Sandbox 이미지 빌드 및 배포 자동화

## Expected Impact

- 의심 파일을 실제 업무 환경과 분리해 안전하게 분석
- 1회용 격리실 구조로 분석 후 흔적 최소화
- 동적 프로비저닝을 통한 자원 효율성 향상
- 상시 운영형 샌드박스 대비 가벼운 운영 구조
- 기업 사용자를 위한 직관적이고 안전한 파일 분석 경험 제공
