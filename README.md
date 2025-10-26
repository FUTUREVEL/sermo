# Sermo - OpenAI Realtime Chat Application

🎤 **실시간 음성 AI 채팅 애플리케이션**

OpenAI의 GPT Realtime API를 활용한 실시간 음성 대화 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🎙️ 실시간 음성 대화
- OpenAI GPT Realtime 모델과 실시간 음성 대화
- 낮은 지연시간으로 자연스러운 대화 경험
- 한국어 및 다국어 지원

### 🎛️ 마이크 제어 기능
- **마이크 On/Off 토글**: 언제든지 마이크 켜기/끄기 가능
- **실시간 상태 표시**: 연결 상태 및 AI 응답 상태 실시간 표시
- **스마트 연결 관리**: 자동 재연결 및 오류 복구

### 📊 마이크 테스트 기능
- **시각적 음성 레벨 표시**: 8단계 볼륨 바로 입력 레벨 확인
- **실시간 피드백**: 음성 입력 상태를 색상과 메시지로 표시
- **마이크 테스트 팝업**: 연결 전 마이크 상태 미리 확인

### 🎨 현대적인 UI/UX
- **다크/라이트 모드 지원**: 시스템 설정에 따른 자동 테마 전환
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **부드러운 애니메이션**: 상태 변화에 따른 시각적 피드백

## 🚀 시작하기

### 사전 요구사항
- Node.js (v16 이상)
- 최신 웹 브라우저 (Chrome, Edge 권장)
- OpenAI API 키

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/FUTUREVEL/sermo.git
   cd sermo
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 접속**
   ```
   http://localhost:5173
   ```

### API 키 설정

1. **Ephemeral Key 생성**
   - OpenAI API 키가 필요합니다
   - 프로젝트 루트의 `RealTimeGptTest.py` 실행하여 ephemeral key 생성
   - 생성된 키를 `src/realtime.ts`에서 업데이트

2. **Python 스크립트 실행** (새로운 키 생성용)
   ```bash
   python RealTimeGptTest.py
   ```

## 🎯 사용 방법

1. **연결 단계**
   - "Connect to OpenAI" 버튼 클릭
   - 브라우저에서 마이크 권한 허용
   - 연결 완료 대기

2. **마이크 테스트**
   - "🎤 Test Mic" 버튼으로 마이크 상태 확인
   - 볼륨 바를 통해 입력 레벨 확인
   - 적절한 음량으로 조정

3. **대화 시작**
   - 연결 완료 후 자연스럽게 말하기 시작
   - "🎤 Mic On/Off" 버튼으로 마이크 제어
   - 실시간으로 AI와 대화 진행

## 🛠️ 기술 스택

- **Frontend**: TypeScript, Vite, HTML5, CSS3
- **AI**: OpenAI GPT Realtime API
- **Audio**: Web Audio API, WebRTC
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 프로젝트 구조

```
sermo/
├── src/
│   ├── main.ts          # 메인 애플리케이션 진입점
│   ├── realtime.ts      # OpenAI Realtime API 연결 로직
│   ├── style.css        # 스타일 시트
│   └── assets/          # 정적 리소스
├── public/              # 정적 파일
├── package.json         # 의존성 및 스크립트
├── tsconfig.json        # TypeScript 설정
└── README.md           # 프로젝트 문서
```

## 🔧 문제 해결

### 연결 실패 시
1. 페이지 새로고침 후 재시도
2. 새로운 ephemeral key 생성
3. 브라우저 마이크 권한 확인
4. 인터넷 연결 상태 확인

### 마이크 문제 시
1. 브라우저 설정에서 마이크 권한 허용
2. 마이크 테스트 기능으로 상태 확인
3. 다른 브라우저에서 시도
4. 시스템 마이크 설정 확인

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🤝 기여하기

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

---

**Sermo** - *라틴어로 "대화"를 의미*

OpenAI의 최신 실시간 AI 기술로 자연스러운 음성 대화를 경험해보세요! 🚀