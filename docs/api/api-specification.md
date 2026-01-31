# Wine Collector App - API 스펙 상세

## 1. 개요

### 1.1 기본 정보

| 항목 | 내용 |
|------|------|
| Base URL | `https://api.winecollector.app/api/v1` |
| Protocol | HTTPS |
| Format | JSON |
| Authentication | Bearer Token (JWT) |
| API Version | v1 |

### 1.2 공통 헤더

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
Accept-Language: ko-KR
```

### 1.3 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "timestamp": "2024-01-15T09:30:00Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "timestamp": "2024-01-15T09:30:00Z"
}
```

#### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 127,
      "page": 1,
      "size": 20,
      "total_pages": 7,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 1.4 에러 코드

| HTTP Status | Error Code | 설명 |
|-------------|------------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 400 | INVALID_REQUEST | 잘못된 요청 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 401 | TOKEN_EXPIRED | 토큰 만료 |
| 401 | INVALID_TOKEN | 유효하지 않은 토큰 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | DUPLICATE_ENTRY | 중복 데이터 |
| 422 | SCAN_FAILED | 와인 인식 실패 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 한도 초과 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |
| 503 | SERVICE_UNAVAILABLE | 서비스 이용 불가 |

---

## 2. 인증 API (Auth)

### 2.1 회원가입

새로운 사용자 계정을 생성합니다.

```
POST /auth/register
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "김와인",
  "marketing_agreed": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | O | 이메일 (로그인 ID) |
| password | string | O | 비밀번호 (8자 이상, 영문+숫자+특수문자) |
| name | string | O | 사용자 이름 (2-50자) |
| marketing_agreed | boolean | X | 마케팅 수신 동의 (기본값: false) |

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "김와인",
      "is_verified": false,
      "created_at": "2024-01-15T09:30:00Z"
    },
    "message": "인증 이메일을 발송했습니다."
  }
}
```

#### Errors
| Code | Message |
|------|---------|
| VALIDATION_ERROR | 이메일 형식이 올바르지 않습니다 |
| VALIDATION_ERROR | 비밀번호는 8자 이상이어야 합니다 |
| DUPLICATE_ENTRY | 이미 가입된 이메일입니다 |

---

### 2.2 로그인

사용자 인증 후 토큰을 발급합니다.

```
POST /auth/login
```

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "김와인",
      "profile_image": null
    }
  }
}
```

#### Errors
| Code | Message |
|------|---------|
| UNAUTHORIZED | 이메일 또는 비밀번호가 올바르지 않습니다 |
| FORBIDDEN | 이메일 인증이 필요합니다 |

---

### 2.3 토큰 갱신

Refresh Token으로 새로운 Access Token을 발급합니다.

```
POST /auth/refresh
```

#### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 2.4 로그아웃

현재 세션을 종료하고 토큰을 무효화합니다.

```
POST /auth/logout
```

#### Request Headers
```http
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "로그아웃되었습니다."
}
```

---

### 2.5 내 정보 조회

현재 로그인한 사용자 정보를 조회합니다.

```
GET /auth/me
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "김와인",
    "profile_image": "https://storage.winecollector.app/profiles/user123.jpg",
    "is_verified": true,
    "created_at": "2024-01-15T09:30:00Z",
    "last_login_at": "2024-01-20T14:00:00Z"
  }
}
```

---

### 2.6 소셜 로그인

소셜 계정으로 로그인/회원가입합니다.

```
POST /auth/social/{provider}
```

#### Path Parameters
| 파라미터 | 설명 |
|----------|------|
| provider | google, apple, kakao |

#### Request Body
```json
{
  "id_token": "소셜 로그인 ID Token",
  "access_token": "소셜 로그인 Access Token"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "is_new_user": false,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "김와인"
    }
  }
}
```

---

## 3. 스캔 API (Scan)

### 3.1 단일 와인 스캔

와인 라벨 이미지를 분석하여 와인 정보를 추출합니다.

```
POST /scan
```

#### Request (multipart/form-data)
```
Content-Type: multipart/form-data

image: (binary) 와인 라벨 이미지 파일
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| image | file | O | 이미지 파일 (JPEG, PNG, WebP, max 10MB) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "scan_id": "scan_abc123",
    "confidence": 0.95,
    "wine": {
      "name": "Château Margaux",
      "producer": "Château Margaux",
      "vintage": 2015,
      "grape_variety": ["Cabernet Sauvignon", "Merlot", "Petit Verdot"],
      "region": "Margaux",
      "country": "France",
      "appellation": "Margaux AOC",
      "type": "red",
      "abv": 13.5,
      "taste_profile": {
        "body": 5,
        "tannin": 4,
        "acidity": 3,
        "sweetness": 1
      },
      "food_pairing": ["스테이크", "양갈비", "숙성 치즈", "트러플 요리"],
      "flavor_notes": ["블랙커런트", "삼나무", "바이올렛", "감초"],
      "serving_temp_min": 16,
      "serving_temp_max": 18,
      "drinking_window_start": 2025,
      "drinking_window_end": 2045,
      "description": "보르도 1등급 그랑 크뤼 와인으로, 우아하고 복합적인 아로마와 실크같은 탄닌이 특징입니다."
    },
    "image_url": "https://storage.winecollector.app/scans/scan_abc123.jpg",
    "existing_wine_id": null,
    "is_duplicate": false
  }
}
```

#### Errors
| Code | Message |
|------|---------|
| VALIDATION_ERROR | 이미지 파일이 필요합니다 |
| VALIDATION_ERROR | 지원하지 않는 이미지 형식입니다 |
| SCAN_FAILED | 와인 라벨을 인식할 수 없습니다 |

---

### 3.2 일괄 스캔 (Batch Scan)

여러 와인이 포함된 이미지를 분석합니다.

```
POST /scan/batch
```

#### Request (multipart/form-data)
```
Content-Type: multipart/form-data

image: (binary) 여러 와인이 포함된 이미지
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "scan_session_id": "session_xyz789",
    "total_detected": 5,
    "successfully_recognized": 4,
    "failed": 1,
    "wines": [
      {
        "index": 0,
        "status": "success",
        "confidence": 0.95,
        "wine": {
          "name": "Château Margaux",
          "vintage": 2015,
          "type": "red",
          "country": "France"
          // ... 상세 정보
        },
        "bounding_box": {
          "x": 100,
          "y": 50,
          "width": 200,
          "height": 400
        }
      },
      {
        "index": 1,
        "status": "success",
        "confidence": 0.88,
        "wine": {
          "name": "Opus One",
          "vintage": 2018,
          "type": "red",
          "country": "USA"
        },
        "bounding_box": {
          "x": 350,
          "y": 50,
          "width": 200,
          "height": 400
        }
      },
      {
        "index": 2,
        "status": "failed",
        "confidence": 0.3,
        "error": "라벨이 가려져 있거나 불명확합니다",
        "bounding_box": {
          "x": 600,
          "y": 50,
          "width": 200,
          "height": 400
        }
      }
      // ...
    ]
  }
}
```

---

### 3.3 중복 체크 스캔

와인샵에서 구매 전 보유 여부를 확인합니다.

```
POST /scan/check
```

#### Request (multipart/form-data)
```
image: (binary) 와인 라벨 이미지
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "wine": {
      "name": "Château Margaux",
      "vintage": 2015,
      "type": "red"
    },
    "is_owned": true,
    "owned_info": {
      "user_wine_id": "uw_123456",
      "quantity": 2,
      "location_tags": ["메인셀러", "A열"],
      "purchase_price": 850000,
      "purchase_date": "2023-06-15"
    },
    "recommendation": "이미 2병 보유 중입니다. 추가 구매 시 총 3병이 됩니다."
  }
}
```

---

## 4. 와인 API (Wines)

### 4.1 내 와인 목록 조회

사용자의 와인 컬렉션을 조회합니다.

```
GET /wines
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | integer | X | 1 | 페이지 번호 |
| size | integer | X | 20 | 페이지 크기 (max: 100) |
| status | string | X | owned | owned, consumed, gifted, all |
| type | string | X | - | red, white, rose, sparkling |
| country | string | X | - | 국가 코드 (FR, US, IT 등) |
| grape | string | X | - | 품종 |
| tag_id | uuid | X | - | 태그 ID로 필터 |
| drinking_window | string | X | - | now, aging, urgent |
| min_price | integer | X | - | 최소 가격 |
| max_price | integer | X | - | 최대 가격 |
| sort | string | X | created_at | created_at, vintage, price, name, drinking_window |
| order | string | X | desc | asc, desc |
| search | string | X | - | 검색어 (이름, 생산자, 지역) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uw_550e8400",
        "quantity": 2,
        "status": "owned",
        "purchase_date": "2023-06-15",
        "purchase_price": 850000,
        "personal_note": "결혼기념일에 열 예정",
        "created_at": "2024-01-15T09:30:00Z",
        "wine": {
          "id": "w_123456",
          "name": "Château Margaux",
          "producer": "Château Margaux",
          "vintage": 2015,
          "type": "red",
          "country": "France",
          "region": "Margaux",
          "grape_variety": ["Cabernet Sauvignon", "Merlot"],
          "drinking_window_start": 2025,
          "drinking_window_end": 2045,
          "image_url": "https://storage.winecollector.app/wines/w_123456.jpg"
        },
        "tags": [
          {
            "id": "tag_001",
            "name": "메인셀러",
            "type": "cellar",
            "color": "#8B5CF6"
          },
          {
            "id": "tag_002",
            "name": "A열",
            "type": "location",
            "color": "#6B7280"
          }
        ],
        "drinking_status": "aging"
      }
      // ...
    ],
    "pagination": {
      "total": 127,
      "page": 1,
      "size": 20,
      "total_pages": 7,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### 4.2 와인 등록

새 와인을 컬렉션에 추가합니다.

```
POST /wines
```

#### Request Body
```json
{
  "scan_id": "scan_abc123",
  "wine_overrides": {
    "name": "Château Margaux",
    "vintage": 2015
  },
  "quantity": 2,
  "purchase_date": "2023-06-15",
  "purchase_price": 850000,
  "purchase_place": "와인앤모어 청담점",
  "personal_note": "결혼기념일에 열 예정",
  "tag_ids": ["tag_001", "tag_002"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| scan_id | string | X* | 스캔 결과 ID (*scan_id 또는 wine_id 중 하나 필수) |
| wine_id | uuid | X* | 기존 와인 ID |
| wine_overrides | object | X | 와인 정보 수정 (스캔 결과 덮어쓰기) |
| quantity | integer | X | 수량 (기본값: 1) |
| purchase_date | date | X | 구매일 (YYYY-MM-DD) |
| purchase_price | integer | X | 구매 가격 |
| purchase_place | string | X | 구매처 |
| personal_note | string | X | 개인 메모 |
| tag_ids | uuid[] | X | 태그 ID 목록 |

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uw_550e8400",
    "wine_id": "w_123456",
    "quantity": 2,
    "status": "owned",
    "purchase_date": "2023-06-15",
    "purchase_price": 850000,
    "created_at": "2024-01-15T09:30:00Z",
    "wine": {
      "id": "w_123456",
      "name": "Château Margaux",
      "vintage": 2015
      // ...
    },
    "tags": [
      // ...
    ]
  },
  "message": "와인이 셀러에 추가되었습니다."
}
```

---

### 4.3 일괄 와인 등록

여러 와인을 한 번에 등록합니다.

```
POST /wines/batch
```

#### Request Body
```json
{
  "scan_session_id": "session_xyz789",
  "wines": [
    {
      "scan_index": 0,
      "quantity": 1,
      "tag_ids": ["tag_001"]
    },
    {
      "scan_index": 1,
      "quantity": 2,
      "tag_ids": ["tag_001", "tag_003"]
    }
  ],
  "common_tags": ["tag_001"],
  "common_purchase_date": "2024-01-15"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "total_bottles": 3,
    "user_wines": [
      {
        "id": "uw_001",
        "wine": { "name": "Château Margaux", "vintage": 2015 }
      },
      {
        "id": "uw_002",
        "wine": { "name": "Opus One", "vintage": 2018 }
      }
    ]
  },
  "message": "3병의 와인이 셀러에 추가되었습니다."
}
```

---

### 4.4 와인 상세 조회

특정 와인의 상세 정보를 조회합니다.

```
GET /wines/{user_wine_id}
```

#### Path Parameters
| 파라미터 | 설명 |
|----------|------|
| user_wine_id | 사용자 와인 ID |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uw_550e8400",
    "quantity": 2,
    "status": "owned",
    "purchase_date": "2023-06-15",
    "purchase_price": 850000,
    "purchase_place": "와인앤모어 청담점",
    "personal_note": "결혼기념일에 열 예정",
    "personal_rating": null,
    "original_image_url": "https://storage.winecollector.app/user/uw_550e8400.jpg",
    "created_at": "2024-01-15T09:30:00Z",
    "updated_at": "2024-01-15T09:30:00Z",
    "wine": {
      "id": "w_123456",
      "name": "Château Margaux",
      "producer": "Château Margaux",
      "vintage": 2015,
      "grape_variety": ["Cabernet Sauvignon", "Merlot", "Petit Verdot"],
      "region": "Margaux",
      "country": "France",
      "appellation": "Margaux AOC",
      "type": "red",
      "abv": 13.5,
      "taste_profile": {
        "body": 5,
        "tannin": 4,
        "acidity": 3,
        "sweetness": 1
      },
      "food_pairing": ["스테이크", "양갈비", "숙성 치즈"],
      "flavor_notes": ["블랙커런트", "삼나무", "바이올렛"],
      "serving_temp_min": 16,
      "serving_temp_max": 18,
      "drinking_window_start": 2025,
      "drinking_window_end": 2045,
      "description": "보르도 1등급 그랑 크뤼 와인으로...",
      "image_url": "https://storage.winecollector.app/wines/w_123456.jpg"
    },
    "tags": [
      {
        "id": "tag_001",
        "name": "메인셀러",
        "type": "cellar",
        "color": "#8B5CF6"
      }
    ],
    "drinking_status": "aging",
    "years_until_peak": 1
  }
}
```

---

### 4.5 와인 정보 수정

와인의 사용자 정보를 수정합니다.

```
PATCH /wines/{user_wine_id}
```

#### Request Body
```json
{
  "quantity": 1,
  "purchase_date": "2023-06-15",
  "purchase_price": 900000,
  "purchase_place": "업데이트된 구매처",
  "personal_note": "업데이트된 메모",
  "tag_ids": ["tag_001", "tag_003"]
}
```

모든 필드는 선택 사항이며, 제공된 필드만 업데이트됩니다.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uw_550e8400",
    "quantity": 1,
    // ... 업데이트된 전체 정보
  },
  "message": "와인 정보가 수정되었습니다."
}
```

---

### 4.6 와인 상태 변경

와인의 상태를 변경합니다 (마심, 선물 등).

```
PATCH /wines/{user_wine_id}/status
```

#### Request Body
```json
{
  "status": "consumed",
  "quantity_change": 1,
  "consumed_date": "2024-01-20",
  "rating": 5,
  "tasting_note": "완벽한 숙성 상태. 실크같은 탄닌."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | string | O | consumed, gifted |
| quantity_change | integer | X | 변경 수량 (기본값: 1) |
| consumed_date | date | X | 소비/선물 날짜 |
| rating | integer | X | 평점 (1-5, consumed 시) |
| tasting_note | string | X | 테이스팅 노트 (consumed 시) |
| recipient | string | X | 선물 받은 사람 (gifted 시) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uw_550e8400",
    "quantity": 1,
    "status": "owned",
    "consumed_count": 1
  },
  "message": "와인 1병을 마심 처리했습니다. 남은 수량: 1병"
}
```

---

### 4.7 와인 수량 변경

와인 수량을 증가 또는 감소합니다.

```
PATCH /wines/{user_wine_id}/quantity
```

#### Request Body
```json
{
  "action": "increase",
  "amount": 2
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| action | string | O | increase, decrease, set |
| amount | integer | O | 변경량 (set인 경우 목표 수량) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uw_550e8400",
    "previous_quantity": 2,
    "current_quantity": 4
  },
  "message": "수량이 4병으로 변경되었습니다."
}
```

---

### 4.8 와인 삭제

와인을 컬렉션에서 삭제합니다.

```
DELETE /wines/{user_wine_id}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "와인이 삭제되었습니다."
}
```

---

## 5. 추천 API (Recommendations)

### 5.1 페어링 추천 요청

음식/상황에 맞는 와인을 추천받습니다.

```
POST /recommendations
```

#### Request Body
```json
{
  "query": "오늘 저녁 스테이크 먹어요",
  "query_type": "food",
  "preferences": {
    "wine_types": ["red"],
    "max_results": 5,
    "prioritize_expiring": true
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| query | string | O | 사용자 입력 (음식, 상황 등) |
| query_type | string | X | food, occasion, mood (기본값: food) |
| preferences.wine_types | string[] | X | 선호 와인 타입 필터 |
| preferences.max_results | integer | X | 최대 추천 수 (기본값: 5) |
| preferences.prioritize_expiring | boolean | X | 음용적기 임박 와인 우선 (기본값: true) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "recommendation_id": "rec_abc123",
    "query": "오늘 저녁 스테이크 먹어요",
    "recommendations": [
      {
        "rank": 1,
        "match_score": 0.98,
        "user_wine": {
          "id": "uw_550e8400",
          "quantity": 2,
          "wine": {
            "name": "Château Margaux",
            "vintage": 2015,
            "type": "red",
            "image_url": "..."
          },
          "tags": [
            { "name": "메인셀러", "color": "#8B5CF6" }
          ]
        },
        "reason": "풀바디의 탄닌감이 스테이크의 육즙과 완벽하게 어울립니다. 까베르네 소비뇽의 검은 과일 풍미가 고기의 감칠맛을 살려줍니다.",
        "pairing_tips": "와인은 식사 15분 전에 오픈하여 디캔팅하세요.",
        "drinking_urgency": "optimal"
      },
      {
        "rank": 2,
        "match_score": 0.95,
        "user_wine": {
          "id": "uw_550e8401",
          "quantity": 1,
          "wine": {
            "name": "Opus One",
            "vintage": 2018,
            "type": "red"
          }
        },
        "reason": "나파밸리 특유의 풍부한 과일향과 부드러운 탄닌이 스테이크와 잘 어울립니다.",
        "drinking_urgency": "can_wait"
      },
      {
        "rank": 3,
        "match_score": 0.92,
        "user_wine": {
          "id": "uw_550e8402",
          "wine": {
            "name": "Barolo",
            "vintage": 2018,
            "type": "red"
          }
        },
        "reason": "네비올로의 높은 탄닌과 산도가 고기의 지방을 잘 잡아줍니다.",
        "drinking_urgency": "drink_soon"
      }
    ],
    "general_advice": "스테이크에는 탄닌이 있는 풀바디 레드 와인이 잘 어울립니다. 고기의 굽기에 따라 미디엄 레어는 더 탄닌이 강한 와인을, 웰던은 부드러운 와인을 선택하세요.",
    "no_match_alternatives": null,
    "created_at": "2024-01-20T18:30:00Z"
  }
}
```

#### drinking_urgency 값
| 값 | 설명 |
|----|------|
| drink_now | 지금 바로 마셔야 함 (음용적기 지남) |
| drink_soon | 빨리 마시는 것이 좋음 (1년 내) |
| optimal | 지금 마시기 최적 |
| can_wait | 더 숙성 가능 |

---

### 5.2 추천 이력 조회

이전 추천 이력을 조회합니다.

```
GET /recommendations/history
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | integer | X | 1 | 페이지 번호 |
| size | integer | X | 20 | 페이지 크기 |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "rec_abc123",
        "query": "스테이크",
        "query_type": "food",
        "top_recommendation": {
          "wine_name": "Château Margaux 2015",
          "match_score": 0.98
        },
        "total_recommendations": 3,
        "created_at": "2024-01-20T18:30:00Z"
      }
      // ...
    ],
    "pagination": { ... }
  }
}
```

---

## 6. 태그 API (Tags)

### 6.1 태그 목록 조회

사용자의 모든 태그를 조회합니다.

```
GET /tags
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| type | string | X | cellar, location, custom |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "tag_001",
        "name": "메인셀러",
        "type": "cellar",
        "color": "#8B5CF6",
        "wine_count": 47,
        "sort_order": 1
      },
      {
        "id": "tag_002",
        "name": "A열",
        "type": "location",
        "color": "#6B7280",
        "wine_count": 23,
        "sort_order": 1
      }
      // ...
    ],
    "summary": {
      "cellar_count": 3,
      "location_count": 5,
      "custom_count": 2
    }
  }
}
```

---

### 6.2 태그 생성

새 태그를 생성합니다.

```
POST /tags
```

#### Request Body
```json
{
  "name": "지하셀러",
  "type": "cellar",
  "color": "#10B981"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | O | 태그명 (1-50자) |
| type | string | O | cellar, location, custom |
| color | string | X | HEX 색상 코드 (기본값: #6B7280) |

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "tag_003",
    "name": "지하셀러",
    "type": "cellar",
    "color": "#10B981",
    "wine_count": 0,
    "sort_order": 4,
    "created_at": "2024-01-20T10:00:00Z"
  },
  "message": "태그가 생성되었습니다."
}
```

---

### 6.3 태그 수정

태그 정보를 수정합니다.

```
PATCH /tags/{tag_id}
```

#### Request Body
```json
{
  "name": "지하 와인셀러",
  "color": "#059669"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "tag_003",
    "name": "지하 와인셀러",
    "type": "cellar",
    "color": "#059669",
    "wine_count": 15
  },
  "message": "태그가 수정되었습니다."
}
```

---

### 6.4 태그 삭제

태그를 삭제합니다. 해당 태그가 적용된 와인에서 태그가 제거됩니다.

```
DELETE /tags/{tag_id}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "affected_wines": 15
  },
  "message": "태그가 삭제되었습니다. 15개 와인에서 태그가 제거되었습니다."
}
```

---

### 6.5 태그 순서 변경

태그의 정렬 순서를 변경합니다.

```
PUT /tags/reorder
```

#### Request Body
```json
{
  "type": "cellar",
  "order": ["tag_003", "tag_001", "tag_002"]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "태그 순서가 변경되었습니다."
}
```

---

## 7. 대시보드 API (Dashboard)

### 7.1 셀러 현황 요약

대시보드용 셀러 통계를 조회합니다.

```
GET /dashboard/summary
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "total_wines": 127,
    "total_bottles": 156,
    "total_value": 45000000,
    "by_type": {
      "red": { "count": 78, "bottles": 95 },
      "white": { "count": 32, "bottles": 40 },
      "rose": { "count": 8, "bottles": 10 },
      "sparkling": { "count": 9, "bottles": 11 }
    },
    "by_country": [
      { "country": "France", "count": 45 },
      { "country": "Italy", "count": 28 },
      { "country": "USA", "count": 22 },
      { "country": "Spain", "count": 15 },
      { "country": "Others", "count": 17 }
    ],
    "by_cellar": [
      { "tag_id": "tag_001", "name": "메인셀러", "count": 67 },
      { "tag_id": "tag_002", "name": "보조셀러", "count": 45 },
      { "tag_id": "tag_003", "name": "와인냉장고", "count": 15 }
    ],
    "recent_additions": 5,
    "consumed_this_month": 3
  }
}
```

---

### 7.2 음용 적기 임박 와인

음용 적기가 임박한 와인 목록을 조회합니다.

```
GET /dashboard/expiring
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| years | integer | X | 2 | 몇 년 이내 |
| limit | integer | X | 10 | 최대 결과 수 |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "urgent": [
      {
        "user_wine_id": "uw_001",
        "wine": {
          "name": "Rioja Reserva",
          "vintage": 2017
        },
        "drinking_window_end": 2024,
        "years_left": 0,
        "message": "올해 안에 드시는 것이 좋습니다!"
      }
    ],
    "soon": [
      {
        "user_wine_id": "uw_002",
        "wine": {
          "name": "Barolo",
          "vintage": 2018
        },
        "drinking_window_end": 2025,
        "years_left": 1,
        "message": "1년 내 음용을 권장합니다."
      }
    ],
    "optimal": [
      {
        "user_wine_id": "uw_003",
        "wine": {
          "name": "Burgundy Premier Cru",
          "vintage": 2019
        },
        "drinking_window_start": 2024,
        "drinking_window_end": 2030,
        "message": "지금 마시기 최적입니다."
      }
    ]
  }
}
```

---

## 8. 사용자 API (Users)

### 8.1 프로필 수정

사용자 프로필을 수정합니다.

```
PATCH /users/profile
```

#### Request Body
```json
{
  "name": "김와인",
  "profile_image": "base64_encoded_image_or_url"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "김와인",
    "email": "wine@example.com",
    "profile_image": "https://storage.winecollector.app/profiles/user_123.jpg"
  },
  "message": "프로필이 수정되었습니다."
}
```

---

### 8.2 비밀번호 변경

```
POST /users/password
```

#### Request Body
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "비밀번호가 변경되었습니다."
}
```

---

### 8.3 알림 설정 조회/수정

```
GET /users/notifications
PATCH /users/notifications
```

#### Response / Request Body
```json
{
  "drinking_window_alert": true,
  "drinking_window_days_before": 30,
  "weekly_summary": false,
  "marketing": false
}
```

---

### 8.4 데이터 내보내기

사용자 데이터를 CSV/JSON으로 내보냅니다.

```
POST /users/export
```

#### Request Body
```json
{
  "format": "csv",
  "include": ["wines", "tags", "recommendations"]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "download_url": "https://storage.winecollector.app/exports/export_123.csv",
    "expires_at": "2024-01-21T10:00:00Z"
  },
  "message": "내보내기가 완료되었습니다."
}
```

---

### 8.5 회원 탈퇴

```
DELETE /users/account
```

#### Request Body
```json
{
  "password": "CurrentPassword123!",
  "reason": "사용하지 않음"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": null,
  "message": "회원 탈퇴가 완료되었습니다."
}
```

---

## 9. Rate Limiting

### 9.1 제한 정책

| 엔드포인트 | 제한 |
|------------|------|
| 인증 관련 | 10 req/min |
| 스캔 API | 30 req/min |
| 일반 API | 100 req/min |
| 추천 API | 20 req/min |

### 9.2 Rate Limit 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705750800
```

### 9.3 Rate Limit 초과 응답

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    "retry_after": 60
  }
}
```

---

## 10. Webhook (선택)

### 10.1 지원 이벤트

| 이벤트 | 설명 |
|--------|------|
| wine.created | 와인 등록 시 |
| wine.consumed | 와인 소비 시 |
| recommendation.created | 추천 생성 시 |

### 10.2 Webhook Payload

```json
{
  "event": "wine.created",
  "timestamp": "2024-01-20T10:00:00Z",
  "data": {
    "user_wine_id": "uw_123",
    "wine_name": "Château Margaux 2015"
  }
}
```
