# Wine Collector App - 데이터베이스 스키마 설계

## 1. 개요

### 1.1 데이터베이스
- **DBMS**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **Migration**: Alembic

### 1.2 설계 원칙
- UUID를 기본 키로 사용 (분산 환경 대비)
- soft delete 패턴 적용 (deleted_at)
- 생성/수정 시간 자동 기록
- 인덱스 최적화

---

## 2. ERD (Entity Relationship Diagram)

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│     users       │       │     user_wines      │       │     wines       │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)             │    ┌──│ id (PK)         │
│ email           │  │    │ user_id (FK)        │────┘  │ name            │
│ password_hash   │  └───▶│ wine_id (FK)        │◀──────│ producer        │
│ name            │       │ quantity            │       │ vintage         │
│ next_label_seq  │       │ label_number        │       │ grape_variety   │
│ label_seq_year  │       │ purchase_date       │       │ region          │
│ created_at      │       │ purchase_price      │       │ country         │
│ updated_at      │       │ status              │       │ type            │
└─────────────────┘       │ personal_note       │       │ ...             │
                          │ created_at          │       │                 │
                          │ updated_at          │       └─────────────────┘
                          └──────────┬──────────┘
                                     │
                                     │ N:M
                                     ▼
┌─────────────────┐       ┌─────────────────────┐
│      tags       │       │  user_wine_tags     │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │◀──────│ user_wine_id (FK)   │
│ user_id (FK)    │       │ tag_id (FK)         │
│ name            │       └─────────────────────┘
│ type            │
│ color           │
│ created_at      │
└─────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│     users       │       │  recommendations    │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │──────▶│ id (PK)             │
└─────────────────┘       │ user_id (FK)        │
                          │ query               │
                          │ result              │
                          │ created_at          │
                          └─────────────────────┘
```

---

## 3. 테이블 상세 정의

### 3.1 users (사용자)

사용자 계정 정보를 저장합니다.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    profile_image   VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    is_verified     BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    next_label_sequence INTEGER NOT NULL DEFAULT 1,
    label_sequence_year INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
```

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | NOT NULL | 해시된 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 사용자 이름 |
| profile_image | VARCHAR(500) | | 프로필 이미지 URL |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 상태 |
| is_verified | BOOLEAN | DEFAULT FALSE | 이메일 인증 여부 |
| last_login_at | TIMESTAMPTZ | | 마지막 로그인 시간 |
| next_label_sequence | INTEGER | DEFAULT 1 | 라벨 번호 자동 발급 시퀀스 |
| label_sequence_year | INTEGER | | 라벨 시퀀스 기준 연도 (연도 변경 시 시퀀스 초기화) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시간 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시간 |
| deleted_at | TIMESTAMPTZ | | 삭제 시간 (soft delete) |

---

### 3.2 wines (와인 마스터)

AI가 인식한 와인의 기본 정보를 저장합니다. 동일한 와인은 한 번만 저장됩니다.

```sql
CREATE TABLE wines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(500) NOT NULL,
    producer                VARCHAR(300),
    vintage                 INTEGER,
    grape_variety           VARCHAR(200)[],
    region                  VARCHAR(200),
    country                 VARCHAR(100),
    appellation             VARCHAR(200),
    abv                     DECIMAL(4,2),
    type                    VARCHAR(20) NOT NULL DEFAULT 'red',

    -- 맛 프로필 (1-5 스케일)
    body                    SMALLINT CHECK (body BETWEEN 1 AND 5),
    tannin                  SMALLINT CHECK (tannin BETWEEN 1 AND 5),
    acidity                 SMALLINT CHECK (acidity BETWEEN 1 AND 5),
    sweetness               SMALLINT CHECK (sweetness BETWEEN 1 AND 5),

    -- AI 보강 정보
    food_pairing            TEXT[],
    flavor_notes            TEXT[],
    serving_temp_min        SMALLINT,
    serving_temp_max        SMALLINT,
    drinking_window_start   INTEGER,
    drinking_window_end     INTEGER,
    description             TEXT,

    -- 메타 정보
    image_url               VARCHAR(500),
    ai_confidence           DECIMAL(3,2),

    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_wines_name ON wines USING gin(to_tsvector('simple', name));
CREATE INDEX idx_wines_producer ON wines(producer);
CREATE INDEX idx_wines_country ON wines(country);
CREATE INDEX idx_wines_type ON wines(type);
CREATE INDEX idx_wines_vintage ON wines(vintage);
CREATE INDEX idx_wines_grape ON wines USING gin(grape_variety);

-- 복합 유니크 (동일 와인 중복 방지)
CREATE UNIQUE INDEX idx_wines_unique ON wines(
    LOWER(name),
    COALESCE(producer, ''),
    COALESCE(vintage, 0)
);
```

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| name | VARCHAR(500) | NOT NULL | 와인 이름 |
| producer | VARCHAR(300) | | 생산자/와이너리 |
| vintage | INTEGER | | 빈티지 연도 (NV인 경우 NULL) |
| grape_variety | VARCHAR(200)[] | | 품종 (배열) |
| region | VARCHAR(200) | | 세부 지역 |
| country | VARCHAR(100) | | 국가 |
| appellation | VARCHAR(200) | | 원산지 명칭 |
| abv | DECIMAL(4,2) | | 알코올 도수 |
| type | VARCHAR(20) | NOT NULL | red/white/rose/sparkling/dessert/fortified |
| body | SMALLINT | 1-5 | 바디감 |
| tannin | SMALLINT | 1-5 | 탄닌 |
| acidity | SMALLINT | 1-5 | 산도 |
| sweetness | SMALLINT | 1-5 | 당도 |
| food_pairing | TEXT[] | | 추천 음식 목록 |
| flavor_notes | TEXT[] | | 풍미 노트 |
| serving_temp_min | SMALLINT | | 적정 온도 (최소, °C) |
| serving_temp_max | SMALLINT | | 적정 온도 (최대, °C) |
| drinking_window_start | INTEGER | | 음용 적기 시작 연도 |
| drinking_window_end | INTEGER | | 음용 적기 종료 연도 |
| description | TEXT | | AI 생성 설명 |
| image_url | VARCHAR(500) | | 대표 라벨 이미지 |
| ai_confidence | DECIMAL(3,2) | | AI 인식 신뢰도 (0-1) |

#### Wine Type Enum
```sql
CREATE TYPE wine_type AS ENUM (
    'red',
    'white',
    'rose',
    'sparkling',
    'dessert',
    'fortified',
    'other'
);
```

---

### 3.3 user_wines (사용자 보유 와인)

사용자가 보유한 와인 정보를 저장합니다.

```sql
CREATE TABLE user_wines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wine_id         UUID NOT NULL REFERENCES wines(id) ON DELETE RESTRICT,

    -- 보유 정보
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    label_number    VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'owned',

    -- 구매 정보 (선택)
    purchase_date   DATE,
    purchase_price  DECIMAL(10,2),
    purchase_place  VARCHAR(200),

    -- 개인 메모
    personal_note   TEXT,
    personal_rating SMALLINT CHECK (personal_rating BETWEEN 1 AND 5),

    -- 원본 이미지 (사용자가 촬영한)
    original_image_url VARCHAR(500),

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consumed_at     TIMESTAMP WITH TIME ZONE,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_user_wines_user_id ON user_wines(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_wines_wine_id ON user_wines(wine_id);
CREATE INDEX idx_user_wines_status ON user_wines(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_wines_created_at ON user_wines(user_id, created_at DESC);
CREATE INDEX idx_user_wines_label_number ON user_wines(label_number);

-- 복합 유니크 (같은 사용자가 같은 와인을 중복 등록하지 않도록)
CREATE UNIQUE INDEX idx_user_wines_unique ON user_wines(user_id, wine_id)
WHERE deleted_at IS NULL AND status = 'owned';
```

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK, NOT NULL | 사용자 ID |
| wine_id | UUID | FK, NOT NULL | 와인 ID |
| quantity | INTEGER | DEFAULT 1, >= 0 | 보유 수량 |
| label_number | VARCHAR(20) | | 자동 라벨 번호 (YY-시퀀스) |
| status | VARCHAR(20) | NOT NULL | owned/consumed/gifted |
| purchase_date | DATE | | 구매일 (선택) |
| purchase_price | DECIMAL(10,2) | | 구매가격 (선택) |
| purchase_place | VARCHAR(200) | | 구매처 (선택) |
| personal_note | TEXT | | 개인 메모 |
| personal_rating | SMALLINT | 1-5 | 개인 평점 |
| original_image_url | VARCHAR(500) | | 사용자 촬영 이미지 |
| consumed_at | TIMESTAMPTZ | | 소비 일시 |

#### Status Enum
```sql
CREATE TYPE wine_status AS ENUM (
    'owned',      -- 보유 중
    'consumed',   -- 마심
    'gifted'      -- 선물함
);
```

---

### 3.4 tags (태그)

사용자 정의 태그를 저장합니다.

```sql
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(50) NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'custom',
    color       VARCHAR(7) DEFAULT '#6B7280',
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_tags_user_id ON tags(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_tags_unique_name ON tags(user_id, LOWER(name)) WHERE deleted_at IS NULL;
```

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK, NOT NULL | 사용자 ID |
| name | VARCHAR(50) | NOT NULL | 태그명 |
| type | VARCHAR(20) | NOT NULL | cellar/location/custom |
| color | VARCHAR(7) | DEFAULT #6B7280 | 태그 색상 (HEX) |
| sort_order | INTEGER | DEFAULT 0 | 정렬 순서 |

#### Tag Type
```sql
CREATE TYPE tag_type AS ENUM (
    'cellar',     -- 셀러 태그 (거실 셀러, 지하 셀러)
    'location',   -- 위치 태그 (A열, 1층)
    'custom'      -- 기타 커스텀 태그
);
```

---

### 3.5 user_wine_tags (와인-태그 연결)

사용자 와인과 태그의 다대다 관계를 저장합니다.

```sql
CREATE TABLE user_wine_tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wine_id    UUID NOT NULL REFERENCES user_wines(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_wine_id, tag_id)
);

-- 인덱스
CREATE INDEX idx_user_wine_tags_user_wine_id ON user_wine_tags(user_wine_id);
CREATE INDEX idx_user_wine_tags_tag_id ON user_wine_tags(tag_id);
```

---

### 3.6 recommendations (추천 이력)

AI 추천 요청 및 결과를 저장합니다.

```sql
CREATE TABLE recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 요청 정보
    query_type      VARCHAR(20) NOT NULL DEFAULT 'food',
    query_text      TEXT NOT NULL,

    -- 결과 정보 (JSON)
    result          JSONB NOT NULL,
    recommended_wine_ids UUID[],

    -- AI 메타 정보
    ai_model        VARCHAR(50),
    ai_tokens_used  INTEGER,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_result ON recommendations USING gin(result);
```

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | 고유 식별자 |
| user_id | UUID | FK, NOT NULL | 사용자 ID |
| query_type | VARCHAR(20) | NOT NULL | food/occasion/mood |
| query_text | TEXT | NOT NULL | 사용자 입력 쿼리 |
| result | JSONB | NOT NULL | AI 추천 결과 전체 |
| recommended_wine_ids | UUID[] | | 추천된 와인 ID 목록 |
| ai_model | VARCHAR(50) | | 사용된 AI 모델 |
| ai_tokens_used | INTEGER | | 사용된 토큰 수 |

#### Result JSON 구조
```json
{
  "recommendations": [
    {
      "wine_id": "uuid",
      "rank": 1,
      "match_score": 0.95,
      "reason": "스테이크의 풍부한 육즙과 탄닌이 강한 까베르네 소비뇽의 조합이 완벽합니다."
    }
  ],
  "general_advice": "붉은 고기에는 탄닌이 있는 레드 와인이 잘 어울립니다."
}
```

---

### 3.7 scan_sessions (스캔 세션)

일괄/연속 스캔 세션을 추적합니다.

```sql
CREATE TABLE scan_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    scan_mode       VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress',

    total_images    INTEGER DEFAULT 0,
    success_count   INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,

    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX idx_scan_sessions_status ON scan_sessions(user_id, status);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| scan_mode | VARCHAR(20) | single/batch/continuous |
| status | VARCHAR(20) | in_progress/completed/failed |

---

### 3.8 refresh_tokens (리프레시 토큰)

JWT 리프레시 토큰을 관리합니다.

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     VARCHAR(500),
    ip_address      INET,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)
WHERE revoked_at IS NULL;
```

---

## 4. 뷰 (Views)

### 4.1 사용자 셀러 현황 뷰

```sql
CREATE VIEW v_user_cellar_summary AS
SELECT
    uw.user_id,
    COUNT(DISTINCT uw.id) as total_wines,
    SUM(uw.quantity) as total_bottles,
    COUNT(DISTINCT uw.id) FILTER (WHERE w.type = 'red') as red_count,
    COUNT(DISTINCT uw.id) FILTER (WHERE w.type = 'white') as white_count,
    COUNT(DISTINCT uw.id) FILTER (WHERE w.type = 'rose') as rose_count,
    COUNT(DISTINCT uw.id) FILTER (WHERE w.type = 'sparkling') as sparkling_count,
    COUNT(DISTINCT uw.id) FILTER (WHERE w.type NOT IN ('red', 'white', 'rose', 'sparkling')) as other_count,
    SUM(uw.purchase_price * uw.quantity) as total_value
FROM user_wines uw
JOIN wines w ON uw.wine_id = w.id
WHERE uw.deleted_at IS NULL
  AND uw.status = 'owned'
GROUP BY uw.user_id;
```

### 4.2 음용 적기 임박 와인 뷰

```sql
CREATE VIEW v_expiring_wines AS
SELECT
    uw.id as user_wine_id,
    uw.user_id,
    uw.wine_id,
    w.name,
    w.vintage,
    w.drinking_window_start,
    w.drinking_window_end,
    EXTRACT(YEAR FROM CURRENT_DATE) as current_year,
    CASE
        WHEN w.drinking_window_end IS NOT NULL
             AND w.drinking_window_end <= EXTRACT(YEAR FROM CURRENT_DATE) + 1
        THEN 'urgent'
        WHEN w.drinking_window_end IS NOT NULL
             AND w.drinking_window_end <= EXTRACT(YEAR FROM CURRENT_DATE) + 3
        THEN 'soon'
        ELSE 'ok'
    END as urgency
FROM user_wines uw
JOIN wines w ON uw.wine_id = w.id
WHERE uw.deleted_at IS NULL
  AND uw.status = 'owned'
  AND w.drinking_window_end IS NOT NULL;
```

---

## 5. 함수 및 트리거

### 5.1 updated_at 자동 갱신

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wines_updated_at
    BEFORE UPDATE ON wines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wines_updated_at
    BEFORE UPDATE ON user_wines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 와인 수량 0 시 자동 상태 변경

```sql
CREATE OR REPLACE FUNCTION check_wine_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity = 0 AND NEW.status = 'owned' THEN
        NEW.status = 'consumed';
        NEW.consumed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_user_wine_quantity
    BEFORE UPDATE OF quantity ON user_wines
    FOR EACH ROW EXECUTE FUNCTION check_wine_quantity();
```

---

## 6. 초기 데이터

### 6.1 기본 태그 템플릿 (신규 사용자용)

```sql
-- 사용자 생성 시 기본 태그 생성 함수
CREATE OR REPLACE FUNCTION create_default_tags()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tags (user_id, name, type, color, sort_order) VALUES
        (NEW.id, '메인 셀러', 'cellar', '#8B5CF6', 1),
        (NEW.id, '보조 셀러', 'cellar', '#6366F1', 2),
        (NEW.id, '특별 보관', 'custom', '#EC4899', 10);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_default_tags
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_tags();
```

---

## 7. 인덱스 전략 요약

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| users | email | 로그인 조회 |
| wines | name (GIN) | 전문 검색 |
| wines | country, type, vintage | 필터링 |
| wines | (name, producer, vintage) | 중복 방지 |
| user_wines | user_id + status | 사용자 셀러 조회 |
| user_wines | (user_id, wine_id) | 중복 방지 |
| user_wines | label_number | 라벨 번호 검색 |
| tags | user_id | 사용자 태그 조회 |
| recommendations | user_id + created_at | 추천 이력 조회 |

---

## 8. 마이그레이션 순서

```
001_create_users_table.py
002_create_wines_table.py
003_create_user_wines_table.py
004_create_tags_table.py
005_create_user_wine_tags_table.py
006_create_recommendations_table.py
007_create_scan_sessions_table.py
008_create_refresh_tokens_table.py
009_create_views.py
010_create_functions_and_triggers.py
```

---

## 9. 쿼리 예시

### 9.1 사용자 와인 목록 조회 (필터/정렬 포함)

```sql
SELECT
    uw.id,
    uw.quantity,
    uw.status,
    uw.purchase_date,
    uw.purchase_price,
    uw.personal_note,
    uw.label_number,
    w.name,
    w.producer,
    w.vintage,
    w.type,
    w.country,
    w.region,
    w.drinking_window_end,
    ARRAY_AGG(t.name) FILTER (WHERE t.id IS NOT NULL) as tags
FROM user_wines uw
JOIN wines w ON uw.wine_id = w.id
LEFT JOIN user_wine_tags uwt ON uw.id = uwt.user_wine_id
LEFT JOIN tags t ON uwt.tag_id = t.id AND t.deleted_at IS NULL
WHERE uw.user_id = :user_id
  AND uw.deleted_at IS NULL
  AND uw.status = 'owned'
  AND (:type IS NULL OR w.type = :type)
  AND (:country IS NULL OR w.country = :country)
GROUP BY uw.id, w.id
ORDER BY uw.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 9.2 음용 적기 임박 와인 조회

```sql
SELECT
    uw.id,
    w.name,
    w.vintage,
    w.drinking_window_end,
    w.drinking_window_end - EXTRACT(YEAR FROM CURRENT_DATE)::int as years_left
FROM user_wines uw
JOIN wines w ON uw.wine_id = w.id
WHERE uw.user_id = :user_id
  AND uw.deleted_at IS NULL
  AND uw.status = 'owned'
  AND w.drinking_window_end IS NOT NULL
  AND w.drinking_window_end <= EXTRACT(YEAR FROM CURRENT_DATE) + 2
ORDER BY w.drinking_window_end ASC;
```

### 9.3 페어링 추천용 와인 정보 조회

```sql
SELECT
    w.id,
    w.name,
    w.type,
    w.grape_variety,
    w.body,
    w.tannin,
    w.acidity,
    w.sweetness,
    w.food_pairing,
    w.flavor_notes,
    uw.quantity
FROM user_wines uw
JOIN wines w ON uw.wine_id = w.id
WHERE uw.user_id = :user_id
  AND uw.deleted_at IS NULL
  AND uw.status = 'owned'
  AND uw.quantity > 0;
```
