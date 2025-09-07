# 🏆 Blitz-Q
> **단국대 제로톤 2025 최우수상 수상작 (전국대회 규모)**  
> 팀 협업의 효율을 극대화하는 AI 기반 데일리 스탠드업 자동화 플랫폼

[English README](README.md)

## 🎯 프로젝트 개요

**"우리팀 뭐함?"** - 이 한 마디로 시작된 프로젝트입니다.

팀 프로젝트를 하다 보면 매번 나오는 말, "우리팀 뭐함?" Blitz-Q는 이런 답답함을 해결하기 위해 탄생했습니다. 리그 오브 레전드의 블리츠크랭크 Q스킬처럼, **모든 팀원의 일정과 진행상황을 한 번에 잡아내는** AI 기반 협업 도구입니다.

### 🚀 핵심 가치
- **효율성**: 수동 보고서 취합 → AI 자동 종합 분석
- **투명성**: 모든 팀원의 진행상황 실시간 공유
- **인사이트**: AI가 제공하는 팀 상태 분석 및 개선 방안

## ✨ 주요 기능

### 📊 스마트 보고서 시스템
- **개인 일일 보고서 작성**: 어제 한 일, 오늘 할 일, 이슈사항 입력
- **AI 자동 종합**: 팀원들의 개별 보고서를 AI가 종합하여 팀 리포트 생성
- **실시간 진행률 추적**: 개인별/팀별 프로젝트 진행률 시각화

### 🤖 AI 분석 엔진
- **Google Gemini API** 기반 지능형 분석
- **문제점 자동 감지**: 팀 이슈와 병목지점 식별
- **해결방안 제시**: 구체적이고 실행 가능한 개선안 추천
- **트렌드 분석**: 팀 성과 변화 패턴 파악

### 💬 협업 커뮤니케이션
- **이슈별 댓글 시스템**: 문제점에 대한 팀원 간 소통
- **개인 할일 관리**: 체크리스트 기반 태스크 트래킹
- **실시간 알림**: 중요 업데이트 즉시 공유

### 🏢 팀 관리
- **간편한 팀 생성**: 원클릭 팀 생성 및 관리
- **초대 코드 시스템**: 12자리 코드로 간편한 팀원 초대
- **권한 관리**: Admin/Member 역할 기반 접근 제어

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js**: 견고한 서버 아키텍처
- **SQLite3**: 경량화된 데이터베이스 (개발/테스트용)
- **JWT**: 안전한 인증 시스템
- **Passport.js**: 소셜 로그인 통합

### Frontend
- **Vanilla JavaScript**: 순수 자바스크립트로 최적화된 성능
- **HTML5** + **CSS3**: 모던 웹 표준 기반 UI
- **Responsive Design**: 모든 디바이스에서 완벽한 사용성

### AI & External APIs
- **Google Gemini API**: 고도화된 자연어 처리 및 분석
- **Google OAuth 2.0**: 간편하고 안전한 로그인

### DevOps & Tools
- **dotenv**: 환경변수 관리
- **bcrypt**: 비밀번호 암호화
- **nodemon**: 개발 효율성 향상

## 📂 프로젝트 구조

```
Blitz-Q/
├── 📁 public/              # 프론트엔드 파일
│   ├── 📄 index.html        # 메인 대시보드
│   ├── 📄 login.html        # 로그인 페이지
│   ├── 📄 report.html       # 보고서 작성 페이지
│   ├── 📁 css/             # 스타일시트
│   ├── 📁 js/              # 클라이언트 사이드 스크립트
│   └── 📁 images/          # 정적 이미지 자원
├── 📁 database/            # 데이터베이스 파일
├── 📄 server.js            # 메인 서버 파일 (1,800+ 라인)
├── 📄 auth.js              # 인증 모듈
├── 📄 database.js          # 데이터베이스 관리
├── 📄 reportAnalysis.js    # AI 분석 엔진
├── 📄 package.json         # 의존성 관리
└── 📄 .env.example         # 환경변수 템플릿
```

## 🚀 Quick Start

### 1. 프로젝트 클론 및 설치
```bash
git clone https://github.com/Godwind5/Blitz-Q.git
cd Blitz-Q
npm install
```

### 2. 환경변수 설정
`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT 보안 키
JWT_SECRET=your_super_secret_jwt_key

# Gemini AI API
GEMINI_API_KEY=your_gemini_api_key

# 세션 보안 키  
SESSION_SECRET=your_session_secret
```

### 3. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 4. 브라우저에서 확인
http://localhost:3000 에서 Blitz-Q를 만나보세요!

## 🔧 API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/login` - 일반 로그인
- `GET /api/auth/google` - Google OAuth 로그인
- `POST /api/auth/logout` - 로그아웃

### 팀 관리 (Teams)
- `GET /api/teams` - 내 팀 목록 조회
- `POST /api/teams` - 새 팀 생성
- `GET /api/teams/:teamId/members` - 팀 멤버 목록
- `POST /api/teams/:teamId/invite` - 초대 코드 생성
- `POST /api/teams/join` - 초대 코드로 팀 참가

### 보고서 (Reports)
- `POST /api/reports/:teamId` - 일일 보고서 제출
- `GET /api/reports/:teamId/user-latest` - 내 최신 보고서
- `GET /api/reports/:reportId/analysis` - AI 분석 결과
- `GET /api/reports/team-summary/:teamId` - 팀 종합 분석

## 🏆 수상 스토리

**단국대 제로톤 2025**에서 19개 팀 중 **최우수상**을 수상했습니다! (**전국 단위 해커톤 대회**)

🔗 **공식 행사 링크:**
- [제로톤 2025 공식 웹사이트](https://zerothon-2025.github.io/)
- [단국대학교 공식 공지사항](https://swcu.dankook.ac.kr/en/-5?p_p_id=dku_bbs_web_BbsPortlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_dku_bbs_web_BbsPortlet_cur=2&_dku_bbs_web_BbsPortlet_action=view_message&_dku_bbs_web_BbsPortlet_orderBy=createDate&_dku_bbs_web_BbsPortlet_bbsMessageId=25260)

### 개발 과정
- **기간**: 2025.03.26 ~ 2025.03.29 (100시간)
- **팀 구성**: 백엔드 2명, 프론트엔드 3명
- **발표 순서**: 19팀 중 18번째 (불리한 순서를 극복!)

### 차별화 포인트
1. **실제 서버 구동**: 프론트엔드와 백엔드가 완전히 연동된 완성작
2. **AI 기반 분석**: 단순 취합이 아닌 지능형 인사이트 제공  
3. **실용성**: 실제 업무에서 바로 사용 가능한 완성도

### 심사위원단
**Toss, Naver, 금융공기업 현직자들**이 심사위원으로 참여하여 실무진의 관점에서 철저히 검증받았습니다.

### 발표 하이라이트
> **"우리팀 뭐함?"**
> 
> 이 한 마디로 심사위원들과 관중의 이목을 집중시켰고, 
> 마지막 발표임에도 불구하고 강한 인상을 남겼습니다.

## 📊 성과 지표

- **총 코드 라인**: 9,700+ 라인
- **핵심 서버 파일**: 1,800+ 라인 (server.js)
- **API 엔드포인트**: 20+ 개
- **완성도**: 프론트엔드-백엔드 완전 연동

## 📝 개발 후기 & 블로그
우리 팀원들이 직접 작성한 개발 과정과 경험담을 확인해보세요!

- [팀 개발 여정기](https://velog.io/@orimuchim/단국대-제로톤신바람-참가-후기) - 프로젝트 기획부터 대상 수상까지의 전 과정
- [프론트엔드 개발자의 경험담](https://velog.io/@limhwi/단국대-제로톤0329-후기) - UI/UX 구현과 팀워크 이야기  
- [개발 과정 상세 기록](https://velog.io/@minj_nn/2025.03.29-DKU-ZeroThon) - 기술적 도전과 해결 과정

## 👥 팀 소개

**팀 신바람**이 만든 혁신적인 협업 도구입니다.

- **백엔드**: 견고한 서버 아키텍처 및 AI 분석 엔진 구현
- **프론트엔드**: 직관적이고 반응형인 사용자 인터페이스 설계
- **기획**: 실제 업무 현장의 니즈를 반영한 기능 설계

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고해주세요.

## 🤝 기여하기

Blitz-Q의 발전에 함께해주세요!

1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 열어주세요

## 📞 문의사항

프로젝트에 대한 문의나 제안이 있으시면 언제든지 연락해주세요!

---

<div align="center">

**⚡ Blitz-Q: 팀 협업의 새로운 기준을 제시합니다 ⚡**

Made with ❤️ by Team 신바람 | 단국대학교 제로톤 2025 최우수상 수상작

</div>
