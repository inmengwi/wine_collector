# Wine Collector App - 시스템 아키텍처

## 1. 개요

### 1.1 아키텍처 원칙
- **API-First 설계**: 모든 기능은 REST API로 제공하여 다양한 클라이언트 지원
- **점진적 확장**: 웹 MVP → 모바일 앱으로 단계적 확장
- **관리형 서비스 활용**: 인프라 운영 부담 최소화

### 1.2 확장 전략
```
Phase 1: 웹 MVP
├── 빠른 개발 & 배포
├── 앱스토어 심사 불필요
├── 사용자 피드백으로 기능 검증
└── 카메라 API는 웹에서도 사용 가능 (WebRTC)

Phase 2: 모바일 앱 추가
├── 검증된 기능만 앱으로 포팅
├── 동일 Backend API 재사용
└── 더 나은 카메라/오프라인 경험 제공
```

---

## 2. 시스템 구성도

### 2.1 전체 아키텍처
```
                         ┌─────────────────┐
                         │    Clients      │
                         └────────┬────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │   Web App    │      │   iOS App    │      │ Android App  │
   │   (React)    │      │(React Native)│      │(React Native)│
   │              │      │              │      │              │
   │  - Phase 1   │      │  - Phase 2   │      │  - Phase 2   │
   └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   API Gateway       │
                     │   (Render)          │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   Backend API       │
                     │  Python + FastAPI   │
                     │     (Render)        │
                     └──────────┬──────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
  ┌────────────┐       ┌──────────────┐       ┌────────────┐
  │ PostgreSQL │       │  Claude API  │       │  Storage   │
  │  (Render)  │       │ (Vision AI)  │       │(Cloudflare │
  │            │       │              │       │    R2)     │
  └────────────┘       └──────────────┘       └────────────┘
```

### 2.2 데이터 흐름

#### 와인 스캔 플로우
```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client │────▶│ Backend │────▶│ Claude  │────▶│ Storage  │
│        │     │   API   │     │ Vision  │     │   (R2)   │
└────────┘     └─────────┘     └─────────┘     └──────────┘
    │               │               │               │
    │  1. 이미지    │               │               │
    │     업로드    │               │               │
    │──────────────▶│               │               │
    │               │  2. 라벨     │               │
    │               │     분석 요청 │               │
    │               │──────────────▶│               │
    │               │               │               │
    │               │  3. 와인 정보 │               │
    │               │◀──────────────│               │
    │               │               │               │
    │               │  4. 이미지 저장               │
    │               │──────────────────────────────▶│
    │               │               │               │
    │               │  5. DB 저장   │               │
    │               │  (PostgreSQL) │               │
    │               │               │               │
    │  6. 결과 반환 │               │               │
    │◀──────────────│               │               │
```

#### 페어링 추천 플로우
```
┌────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client │────▶│ Backend │────▶│ Claude  │────▶│PostgreSQL│
│        │     │   API   │     │   API   │     │          │
└────────┘     └─────────┘     └─────────┘     └──────────┘
    │               │               │               │
    │  1. 음식/상황 │               │               │
    │     입력      │               │               │
    │──────────────▶│               │               │
    │               │  2. 내 와인   │               │
    │               │     목록 조회 │               │
    │               │──────────────────────────────▶│
    │               │               │               │
    │               │  3. 와인 목록 │               │
    │               │◀──────────────────────────────│
    │               │               │               │
    │               │  4. 페어링   │               │
    │               │     분석 요청 │               │
    │               │──────────────▶│               │
    │               │               │               │
    │               │  5. 추천 결과 │               │
    │               │◀──────────────│               │
    │               │               │               │
    │  6. 추천 와인 │               │               │
    │     목록 반환 │               │               │
    │◀──────────────│               │               │
```

---

## 3. 기술 스택

### 3.1 기술 스택 요약

| 레이어 | 기술 | 버전 | 선정 이유 |
|--------|------|------|-----------|
| **Backend Framework** | FastAPI | 0.100+ | 비동기 지원, 자동 문서화, 타입 힌트 |
| **Backend Language** | Python | 3.11+ | AI 라이브러리 생태계, 빠른 개발 |
| **Database** | PostgreSQL | 15+ | 안정성, JSON 지원, Render 관리형 |
| **ORM** | SQLAlchemy | 2.0+ | 타입 안전성, 비동기 지원 |
| **Web Frontend** | React | 18+ | 컴포넌트 기반, React Native 전환 용이 |
| **Frontend Language** | TypeScript | 5.0+ | 타입 안전성, 개발 생산성 |
| **Mobile (Phase 2)** | React Native | - | 웹 코드/지식 재활용 가능 |
| **AI/Vision** | Claude API | - | 라벨 인식 + 자연어 페어링 추천 |
| **Object Storage** | Cloudflare R2 | - | S3 호환, 비용 효율적 |
| **Hosting** | Render | - | 간편한 배포, PostgreSQL 관리형 |

### 3.2 Backend 상세

#### 프로젝트 구조
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 설정
│   ├── database.py          # DB 연결 설정
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py    # API 라우터 통합
│   │   │   ├── wines.py     # 와인 API
│   │   │   ├── scan.py      # 스캔 API
│   │   │   ├── recommendations.py  # 추천 API
│   │   │   ├── tags.py      # 태그 API
│   │   │   └── auth.py      # 인증 API
│   │   └── deps.py          # 의존성 주입
│   │
│   ├── models/              # SQLAlchemy 모델
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── wine.py
│   │   ├── user_wine.py
│   │   └── tag.py
│   │
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── wine.py
│   │   ├── scan.py
│   │   ├── recommendation.py
│   │   └── tag.py
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── wine_service.py
│   │   ├── scan_service.py
│   │   ├── ai_service.py    # Claude API 연동
│   │   ├── recommendation_service.py
│   │   └── storage_service.py  # R2 연동
│   │
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
│
├── tests/
├── alembic/                 # DB 마이그레이션
├── requirements.txt
├── Dockerfile
└── render.yaml              # Render 배포 설정
```

#### 주요 의존성
```txt
# requirements.txt
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
sqlalchemy>=2.0.0
asyncpg>=0.28.0
alembic>=1.11.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
anthropic>=0.18.0
boto3>=1.28.0
python-multipart>=0.0.6
httpx>=0.24.0
```

### 3.3 Frontend 상세 (Web)

#### 프로젝트 구조
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/          # 재사용 컴포넌트
│   │   ├── common/
│   │   ├── wine/
│   │   ├── scan/
│   │   └── layout/
│   │
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── Scan.tsx
│   │   ├── Cellar.tsx
│   │   ├── WineDetail.tsx
│   │   ├── Recommend.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/               # 커스텀 훅
│   │   ├── useCamera.ts
│   │   ├── useWines.ts
│   │   └── useRecommendation.ts
│   │
│   ├── services/            # API 호출
│   │   ├── api.ts
│   │   ├── wineService.ts
│   │   ├── scanService.ts
│   │   └── recommendService.ts
│   │
│   ├── stores/              # 상태 관리 (Zustand)
│   │   ├── authStore.ts
│   │   └── wineStore.ts
│   │
│   ├── types/               # TypeScript 타입
│   │   ├── wine.ts
│   │   └── api.ts
│   │
│   └── utils/
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

#### 주요 의존성
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "zustand": "^4.4.0",
    "axios": "^1.4.0",
    "react-webcam": "^7.1.0",
    "@tanstack/react-query": "^4.32.0"
  },
  "devDependencies": {
    "typescript": "^5.1.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "@types/react": "^18.2.0"
  }
}
```

---

## 4. API 설계

### 4.1 API 엔드포인트

#### 인증
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| GET | `/api/v1/auth/me` | 내 정보 조회 |

#### 와인 스캔
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/scan` | 단일 와인 스캔 |
| POST | `/api/v1/scan/batch` | 일괄 스캔 (복수 와인) |
| POST | `/api/v1/scan/check` | 중복 체크 (와인샵용) |

#### 와인 관리
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/wines` | 내 와인 목록 조회 |
| POST | `/api/v1/wines` | 와인 등록 |
| GET | `/api/v1/wines/{id}` | 와인 상세 조회 |
| PATCH | `/api/v1/wines/{id}` | 와인 정보 수정 |
| DELETE | `/api/v1/wines/{id}` | 와인 삭제 |
| PATCH | `/api/v1/wines/{id}/status` | 상태 변경 (consumed/gifted) |
| PATCH | `/api/v1/wines/{id}/quantity` | 수량 변경 |

#### 추천
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/recommendations` | 페어링 추천 요청 |
| GET | `/api/v1/recommendations/history` | 추천 이력 조회 |

#### 태그
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/tags` | 태그 목록 조회 |
| POST | `/api/v1/tags` | 태그 생성 |
| PATCH | `/api/v1/tags/{id}` | 태그 수정 |
| DELETE | `/api/v1/tags/{id}` | 태그 삭제 |

#### 대시보드
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/dashboard/summary` | 셀러 현황 요약 |
| GET | `/api/v1/dashboard/expiring` | 음용적기 임박 와인 |

### 4.2 API 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": null
}
```

#### 에러 응답
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "error_code": "ERROR_CODE"
}
```

#### 페이지네이션
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 127,
    "page": 1,
    "size": 20,
    "pages": 7
  }
}
```

---

## 5. 인프라 구성

### 5.1 Render 구성

```yaml
# render.yaml
services:
  # Backend API
  - type: web
    name: wine-collector-api
    env: python
    region: singapore  # 한국 사용자 대상
    plan: starter      # $7/mo (프로덕션)
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: wine-collector-db
          property: connectionString
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: R2_ACCESS_KEY_ID
        sync: false
      - key: R2_SECRET_ACCESS_KEY
        sync: false
      - key: R2_BUCKET_NAME
        sync: false
      - key: JWT_SECRET_KEY
        generateValue: true

  # Static Site (Frontend)
  - type: web
    name: wine-collector-web
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=31536000

databases:
  - name: wine-collector-db
    plan: starter  # $7/mo
    region: singapore
```

### 5.2 환경별 구성

| 환경 | Backend | Database | 용도 |
|------|---------|----------|------|
| Development | Local | SQLite/Docker | 로컬 개발 |
| Staging | Render (Free) | Render PostgreSQL (Free) | 테스트 |
| Production | Render (Starter) | Render PostgreSQL (Starter) | 운영 |

### 5.3 비용 예상 (월간)

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Render Web Service | Starter | $7 |
| Render PostgreSQL | Starter | $7 |
| Cloudflare R2 | Free Tier | $0 (10GB까지) |
| Claude API | Pay-as-you-go | ~$20-50 (사용량) |
| **Total** | | **~$34-64/월** |

---

## 6. 보안 고려사항

### 6.1 인증/인가
- JWT 기반 인증
- Access Token + Refresh Token 패턴
- HTTPS 필수 (Render 기본 제공)

### 6.2 데이터 보호
- 비밀번호: bcrypt 해싱
- API Key: 환경변수로 관리
- 이미지: 서명된 URL로 접근 제한

### 6.3 API 보안
- Rate Limiting 적용
- CORS 설정
- Input Validation (Pydantic)

---

## 7. 웹 vs 모바일 기능 비교

| 기능 | Web (PWA) | Native App (Phase 2) |
|------|-----------|---------------------|
| 카메라 접근 | O (HTTPS 필수) | O |
| 실시간 프리뷰 | O | O |
| 연속 촬영 | △ (약간 느림) | O (최적화) |
| 일괄 스캔 | O | O |
| 오프라인 모드 | △ (Service Worker) | O (SQLite) |
| 푸시 알림 | △ (Web Push) | O (FCM/APNs) |
| 홈 화면 추가 | O (PWA) | O (설치) |
| 앱스토어 배포 | X | O |

### 7.1 Phase 2 모바일 전환 시 고려사항
- React 컴포넌트 로직 재사용
- API 서비스 레이어 공유
- 카메라 모듈만 네이티브로 교체
- 오프라인 동기화 로직 추가

---

## 8. 모니터링 & 로깅

### 8.1 모니터링 도구
- **Render Metrics**: 기본 서버 메트릭
- **Sentry**: 에러 트래킹 (프론트엔드 + 백엔드)
- **Axiom** (선택): 로그 수집 및 분석

### 8.2 핵심 메트릭
- API 응답 시간
- 스캔 성공률
- AI API 호출 비용
- 사용자 활성도 (DAU/WAU)

---

## 9. 확장 고려사항

### 9.1 성능 확장
- 이미지 리사이징 (업로드 전 클라이언트에서)
- Redis 캐싱 (와인 정보, 추천 결과)
- CDN (이미지 배포)

### 9.2 기능 확장
- 소셜 로그인 (Google, Apple, Kakao)
- 와인 데이터베이스 연동 (Wine-Searcher API 등)
- 바코드 스캔 추가
