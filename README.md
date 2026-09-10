# VividSoul

서울 자치구와 여행 날짜, 관심사(카테고리)를 선택하면, 그날의 날씨에 맞춰 관심사별 숨겨진 현지 명소와 맛집을 추천해주는 반응형 웹앱입니다.

전체 기획 내용은 [PRD.md](./PRD.md), 저장소 구조/개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 핵심 기능

1. 지역 선택(서울 25개 자치구 자동완성 드롭다운, 서울 외 지역은 입력 차단) + 현위치 버튼(카카오맵 역지오코딩으로 자치구 자동 인식) + 출발 날짜 + 여행 일정(당일치기~최대 6박) 선택
2. 관심사(카테고리) 다중 선택: 문화관광 / 쇼핑 / 숙박 / 역사관광 / 음식 / 자연관광 / 체험관광 / 축제·공연·행사 — 미선택 시 8종 전체로 추천
3. 선택한 지역·기간의 날짜별 날씨 조회 (카카오맵으로 위경도 변환 → Open-Meteo 일별 예보 조회)
4. 첫날 날씨와 선택한 관심사를 Gemini에 전달해, 관심사 카테고리마다 독립된 섹션 제목 + 날씨 맞춤형 장소 목록 생성 ("음식" 카테고리는 메뉴 정보 포함, 2박 이상이면 카테고리당 6곳·그 외 3곳)
5. 각 추천 장소에 비짓서울 API로 조회한 대표 사진 첨부 (검색 결과가 없어도 전체 추천은 계속 진행)
6. 각 추천 카드에서 카카오맵 검색 링크로 바로 위치 확인 가능
7. "축제/공연/행사"를 선택하면 비짓서울 API 기반 서울 축제·행사 카드 섹션 노출
8. 상단 툴바: 한국수출입은행 API 기반 JPY/USD/CNY 환율 티커, 언어 선택 UI(표시만, 실제 번역 연동은 미구현)
9. 반응형 UI: 모바일 2열/PC 4열 레이아웃 자동 전환, 스크롤 시 맨 위로 이동 버튼 노출

## 기술 스택

- **프론트엔드**: React + Vite
- **백엔드**: Python 3.11 + Flask
- **외부 API**: 카카오맵(Local) API(지오코딩/역지오코딩), Open-Meteo(날씨), 비짓서울 API(장소 사진·관광 콘텐츠), 한국수출입은행 API(환율), Gemini (`google-genai` SDK)

## 프로젝트 구조

```
backend/
  app.py                       # Flask 엔드포인트 모음 (아래 "백엔드 API" 참고)
  pipeline.py                  # 카카오맵 → Open-Meteo → Gemini → 사진 첨부 파이프라인, 숙박일수에 따른 추천 개수 결정
  services/
    kakao_service.py           # 지역명 ↔ 위경도, 좌표 → 주소(역지오코딩)
    weather_service.py         # 위경도 + 기간 → 날짜별 날씨 요약(Open-Meteo)
    gemini_service.py          # 날씨 + 지역 + 관심사 → 카테고리별 추천 생성 (JSON 스키마 강제)
    places_service.py          # 장소명 → 대표 사진 URL (비짓서울 API)
    visitseoul_service.py      # 비짓서울 API로 관광 콘텐츠(명소/맛집/축제 등) 목록 조회
    exim_service.py            # 한국수출입은행 API로 JPY/USD/CNY 환율 조회
  requirements.txt
  pyproject.toml               # Vercel Python 런타임용 프로젝트/의존성 정의
  .env.example
frontend/
  src/
    App.jsx                    # 최상위 상태 관리(관심사/언어/현위치 등), 맨 위로 이동 버튼
    apiBase.js                 # 백엔드 API 베이스 URL 결정 로직
    seoulDistricts.js          # 서울 25개 자치구 목록 및 서울 지역 여부 판별
    components/
      Toolbar.jsx               # 환율 티커 + 현위치 + 언어 선택을 묶은 상단 바
      ExchangeRateTicker.jsx    # 환율 티커 (3초 간격 통화 순환 표시)
      LocationToggle.jsx        # 현위치 버튼 (Geolocation → 역지오코딩 → 서울 여부 검증)
      LanguageSelect.jsx        # 언어 선택 드롭다운 (표시용)
      SearchForm.jsx            # 지역/날짜/일정/관심사 입력, 커스텀 지역 자동완성 드롭다운
      ResultView.jsx            # 날씨 요약(기간별) + 관심사 카테고리별 추천 카드 (카카오맵 링크 포함)
      SeoulEvents.jsx           # "축제/공연/행사" 선택 시 노출되는 비짓서울 축제 카드 섹션
      VisitSeoulBadge.jsx       # 비짓서울 출처 배지
      WeatherIcon.jsx           # 날씨 상태별 아이콘
      StatIcon.jsx              # 강수확률/풍속/습도/여행지수 아이콘
    App.css                     # 전체 스타일 (반응형 브레이크포인트 포함)
vercel.json                    # frontend/backend를 Vercel Services로 선언, /api/* → backend, 나머지 → frontend rewrite
PRD.md
CLAUDE.md
```

## 백엔드 API

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/recommend` | `{ region, date, endDate?, interests? }` → 지역·날짜·관심사 기반 날씨+추천 결과 (핵심 기능) |
| `GET /api/exchange-rate` | JPY/USD/CNY 환율 조회 |
| `GET /api/reverse-geocode?lat=&lon=` | 좌표 → "시/도 시/군/구 동" 주소 (현위치 기능에서 사용) |
| `GET /api/seoul-contents?keyword=&lang=&page=` | 비짓서울 관광 콘텐츠 목록 조회 (기본 축제 카드에서 `keyword=축제`로 호출) |

## 실행 방법

### 1. 백엔드

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # 아래 API 키를 채워넣기
python app.py          # http://localhost:5000
```

`.env`에 필요한 값:

| 변수 | 발급처 | 비고 |
|---|---|---|
| `KAKAO_REST_API_KEY` | [카카오 디벨로퍼스](https://developers.kakao.com) → 내 애플리케이션 → 앱 키 → **REST API 키** | 반드시 REST API 키(JavaScript 키 아님). 앱의 "제품 설정 → 카카오맵"이 활성화되어 있어야 함 |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | `AIzaSy`로 시작하는 키인지 확인 |
| `GEMINI_MODEL` | (선택) | 기본값 `gemini-2.5-flash` |
| `VISIT_SEOUL_API_KEY` | [비짓서울 오픈 API](https://visitseoulnet.openapi.co.kr/) 등 발급처 | 장소 사진 조회 및 축제·행사 카드에 사용. 없으면 해당 장소는 사진 없이 텍스트만 표시됨 |
| `EXIM_API_KEY` | [한국수출입은행 오픈API](https://www.koreaexim.go.kr/ir/HPHKIR020M01) | 환율 티커용. 없으면 환율 조회가 실패하고 티커가 표시되지 않음 |

날씨 조회는 Open-Meteo(무료, API 키 불필요)를 사용하며 오늘부터 최대 16일 이내 예보만 제공합니다.

콘솔에서 파이프라인만 단독 테스트하려면:

```bash
python pipeline.py "제주도" "2026-08-01"
```

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (포트 사용 중이면 자동으로 다음 포트)
```

개발 모드(`npm run dev`)에서는 기본적으로 `http://localhost:5000`의 백엔드를 호출합니다. 다른 주소를 쓰려면 `frontend/.env`에 `VITE_API_BASE_URL`을 설정하세요. 프로덕션 빌드(`npm run build`)에서는 `VITE_API_BASE_URL`이 없으면 같은 도메인의 `/api/*`를 상대 경로로 호출합니다.

## Vercel 배포

이 저장소는 [Vercel Services](https://vercel.com/docs/services)로 프론트엔드(`frontend/`, 정적 사이트)와 백엔드(`backend/`, Flask 앱)를 하나의 Vercel 프로젝트에서 함께 배포하도록 구성되어 있습니다. `vercel.json`의 `services.frontend`/`services.backend`가 각 디렉토리의 빌드·entrypoint를 정의하고, `rewrites`가 `/api/*`는 backend로, 나머지 전부는 frontend(SPA)로 라우팅합니다.

1. **Vercel 프로젝트 설정 → General → Root Directory**를 저장소 루트(비워두거나 `.`)로 설정하세요. `frontend`로 설정되어 있으면 루트의 `vercel.json`이 배포 대상에서 빠져 백엔드 호출이 실패합니다.
2. **Settings → Environment Variables**에 아래 값을 등록하세요 (backend/.env와 동일한 값):
   - `KAKAO_REST_API_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (선택, 기본값 `gemini-2.5-flash`)
   - `VISIT_SEOUL_API_KEY` (선택이지만 없으면 장소 사진/축제 카드 기능이 제한됨)
   - `EXIM_API_KEY` (선택이지만 없으면 환율 티커가 표시되지 않음)
3. 재배포하면 `frontend/`가 `npm install && npm run build`로 빌드되고, `backend/app.py`의 Flask 앱(`backend/pyproject.toml`에 의존성 정의)이 `/api/*` 엔드포인트로 노출됩니다. 프론트엔드는 같은 도메인이므로 `VITE_API_BASE_URL`을 별도로 설정할 필요가 없습니다.

참고: Vercel Hobby 플랜은 서버리스 함수 실행 시간에 제한이 있어(기본 10초), Gemini 응답이 느리면 타임아웃이 날 수 있습니다. 반복적으로 타임아웃이 발생하면 `vercel.json`에 `functions` 설정으로 `maxDuration`을 늘리거나 플랜을 확인하세요.

## 참고

- 서비스 지역은 서울 25개 자치구로 한정됩니다. 그 외 지역을 입력하거나 현위치가 서울이 아니면 안내 후 진행이 막힙니다.
- Open-Meteo 예보 특성상 여행 날짜는 오늘부터 16일 이내만 선택 가능하며, 여행 일정은 당일치기~최대 6박까지 선택할 수 있습니다.
- 추천은 첫째 날 날씨를 기준으로 생성되며, 관심사를 선택하지 않으면 8개 카테고리 전체, 선택하면 선택한 카테고리에 대해서만 각각 섹션이 생성됩니다. 2박 이상 일정은 카테고리당 6곳, 그 외에는 각 3곳 추천합니다.
- 명소/맛집 추천은 Gemini가 생성한 텍스트이므로, 실제 방문 전 정보를 한 번 더 확인하는 것을 권장합니다.
- 장소 사진은 비짓서울 API에 등록된 콘텐츠만 사용합니다. 비짓서울에 없는 장소이거나 API 키가 유효하지 않으면 사진 없이 텍스트만 표시되며, 전체 추천 실패로 이어지지 않습니다.

## UI/UX 개선 이력 (최근 세션)

- **지역 입력 자동완성**: 브라우저 네이티브 `<input list>` datalist가 재선택 시 드롭다운을 다시 띄우지 않는 문제가 있어, 포커스할 때마다 항상 뜨는 커스텀 드롭다운(`region-suggestions`)으로 교체. 브라우저 자동완성 오버레이가 겹쳐 보이는 문제는 `autoComplete="one-time-code"`로 우회.
- **서울 한정 서비스로 전환**: 지역 입력을 서울 25개 자치구로 제한(`seoulDistricts.js`)하고, 현위치 버튼도 서울이 아니면 알림 후 차단하도록 변경.
- **관심사(카테고리) 기반 추천으로 확장**: 기존에는 "숨겨진 현지 명소"와 "현지인 숨은 맛집" 두 섹션이 고정 출력됐으나, 사용자가 선택한 관심사 카테고리마다 독립된 섹션(제목+장소 목록)이 생성되도록 Gemini 응답 스키마와 결과 화면을 변경.
- **사진 소스를 비짓서울 API로 일원화**: 처음엔 비짓서울 우선 조회 후 Google Places로 폴백하는 구조였으나, 별도 API 키 관리 부담을 줄이기 위해 비짓서울 API만 사용하도록 단순화. 검색 결과가 없어도 예외를 개별 항목 단위로 흡수해 전체 추천이 깨지지 않도록 처리.
- **날씨 요약 문구**: Gemini 응답을 `weather_desc`(날씨 설명)와 `spot_reason`(추천 이유) 두 필드로 분리해, 항상 그 경계에서만 줄바꿈되도록 변경(문장 수에 따라 줄바꿈 위치가 흔들리던 문제 해결).
- **레이아웃 정렬**: 전역 `box-sizing: border-box` 리셋 추가로 카드 우측 여백 소실 문제 해결. 날짜별 예보(`daily-forecast`)와 날씨 통계 카드(`weather-stats`)를 flex-wrap 대신 grid로 변경해 모바일 2열/PC 4열이 항상 균등한 간격을 유지하도록 함.
- **모바일 대응**: 640px 이하 브레이크포인트에서 카드 패딩, 폰트 크기, 통계 카드 그리드/패딩을 별도 조정.
- **맨 위로 이동 버튼**: 스크롤이 400px 이상 내려가면 우측 하단에 표시되는 원형 버튼 추가 (`App.jsx`의 스크롤 이벤트 리스너 + `.scroll-top-btn`).
