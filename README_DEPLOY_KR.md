# 배포 안내 (간단 버전)

이 프로젝트는 Vite + React 기반 정적 사이트입니다. 백엔드 없이 Netlify로 배포할 수 있습니다.

## 1) 로컬 실행 (선택)
- Node.js 18 이상 설치
- 터미널에서:
  ```bash
  npm i
  npm run dev
  ```
- http://localhost:3000 에서 확인

## 2) Netlify에 배포 (Git 연동)
1. GitHub에 새 저장소 생성 → 이 폴더 전체 업로드
2. Netlify → "New site from Git" → GitHub 저장소 연결
3. Build command: `npm run build`
   Publish directory: `build`
   (이 파일에 `netlify.toml`이 포함되어 있어서 자동으로 인식됩니다.)

## 3) Netlify에 배포 (드래그&드롭)
1. 빌드:
   ```bash
   npm run build
   ```
   → `build/` 폴더 생성
2. Netlify 웹에서 "Deploy site" → `build/` 폴더를 그대로 드래그하여 업로드

## 커스터마이징 위치
- 화면 문구/라벨: `src/components/*.tsx`, `src/utils/messageGenerator.ts`
- 색/테마: `src/index.css` (하단 CSS 변수들)
- 저장 위치: 브라우저 `localStorage` 사용 (별도 서버 불필요)

## 자주 묻는 질문
- 포트가 이미 사용 중이라며 dev가 안 될 때 → 3000 포트 점유 프로세스 종료 후 재시도
- Netlify 빌드 실패 → Node 버전을 18~20으로 설정 (이 파일의 설정으로 해결됨)
