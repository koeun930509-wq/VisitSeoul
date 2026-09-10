# VividSoul

서울 자치구와 여행 날짜를 선택하면, 그날의 날씨에 맞춰 오늘의 맞춤 추천과 관심사 카테고리별 숨겨진 현지 명소·맛집을 보여주는 반응형 웹앱입니다. 한국어/영어/일본어/중국어를 완전히 지원합니다.

전체 기획 내용은 [PRD.md](./PRD.md), 저장소 구조/개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 핵심 기능

1. 지역 선택(서울 25개 자치구 자동완성 드롭다운, 자치구마다 대표 동네 3곳 함께 표시, 서울 외 지역은 입력 차단) + 현위치 버튼(카카오맵 역지오코딩으로 자치구 자동 인식) + 출발 날짜 선택
2. 선택한 지역·날짜의 날짜별 날씨 조회(카카오맵으로 위경도 변환 → Open-Meteo 일별 예보) + 3시간 간격 시간대별 날씨(기본 접힘, 클릭 시 펼침)
3. 첫날 날씨를 Gemini에 전달해 두 종류의 추천을 함께 생성:
   - **오늘 날씨 맞춤 추천**: 카테고리 구분 없이 오늘 날씨에 가장 어울리는 장소 6곳 — 좌우 화살표로 넘기는 무한 루프 캐러셀로 표시
   - **관심사 카테고리별 추천**: 문화관광 / 쇼핑 / 숙박 / 역사관광 / 음식 / 자연관광 / 체험관광 / 축제·공연·행사 8개 카테고리 각 6곳. 결과 화면의 "전체" 탭에서는 카테고리별로 3곳만 미리보기, 개별 카테고리 탭을 클릭하면 6곳(더보기로 추가 확장)이 나옴. "음식" 카테고리는 메뉴 정보 포함
4. 각 추천 장소에 비짓서울 API로 조회한 대표 사진 첨부 (검색 결과가 없어도 전체 추천은 계속 진행)
5. 비짓서울에 등록된 장소는 실제 상세페이지로 이동하는 "상세보기" 버튼을, 없는 장소는 구글 지도 검색 링크를 표시
6. "축제/공연/행사" 탭을 선택하면 비짓서울 API 기반 서울 축제·행사 카드 섹션 노출 (서울 외 지역 축제는 지명 키워드로 필터링해 제외)
7. 상단 툴바: 한국수출입은행 API 기반 JPY/USD/CNY 환율 티커, 언어 선택(ko/en/ja/zh — UI 문구뿐 아니라 Gemini 추천·날씨·비짓서울 콘텐츠까지 실제로 번역됨)
8. 검색 후 결과 화면으로 자동 스크롤 이동, 반응형 UI(모바일 2열/PC 4열 레이아웃 자동 전환), 스크롤 시 맨 위로 이동 버튼 노출
9. 지오코딩(카카오맵, 30일)과 장소 사진 조회(비짓서울, 6시간)는 백엔드 메모리에 캐시되어 반복 조회를 줄임

## 기술 스택

- **프론트엔드**: React + Vite
- **백엔드**: Python 3.11 + Flask
- **외부 API**: 카카오맵(Local) API(지오코딩/역지오코딩), Open-Meteo(일별/시간별 날씨), 비짓서울 API(장소 사진·상세페이지·관광 콘텐츠), 한국수출입은행 API(환율), Gemini (`google-genai` SDK)

## 프로젝트 구조

```
backend/
  app.py                       # Flask 엔드포인트 모음 (아래 "백엔드 API" 참고)
  pipeline.py                  # 카카오맵 → Open-Meteo → Gemini → 사진/상세URL 첨부 → 시간대별 날씨 파이프라인
  services/
    kakao_service.py           # 지역명 ↔ 위경도(30일 캐시), 좌표 → 주소(역지오코딩)
    weather_service.py         # 위경도 + 기간 → 날짜별/시간별 날씨 요약(Open-Meteo), 4개 언어 날씨 설명·여행지수
    gemini_service.py          # 날씨 + 지역 → 오늘의 추천(weather_picks) + 카테고리별 추천 생성, 요청을 그룹으로 나눠 병렬 호출
    places_service.py          # 장소명 → 대표 사진 URL + 상세페이지 URL (비짓서울 API, 6시간 캐시)
    visitseoul_service.py      # 비짓서울 API로 관광 콘텐츠(명소/맛집/축제 등) 목록 조회, 서울 외 지역 축제 필터링
    exim_service.py            # 한국수출입은행 API로 JPY/USD/CNY 환율 조회
    cache.py                   # 스레드 안전 인메모리 TTL 캐시 (`cached(key, ttl, compute)`)
  requirements.txt
  pyproject.toml               # Vercel Python 런타임용 프로젝트/의존성 정의
  .env.example
frontend/
  src/
    App.jsx                    # 최상위 상태 관리(언어/현위치/활성 탭 등), 검색 결과로 자동 스크롤, 맨 위로 이동 버튼
    apiBase.js                 # 백엔드 API 베이스 URL 결정 로직
    categories.js              # 관심사 카테고리 8종 + "전체" 탭 상수
    i18n.js                    # UI 문자열 4개 언어(ko/en/ja/zh) 사전, 카테고리 라벨/요일 번역 헬퍼
    seoulDistricts.js          # 서울 25개 자치구 목록·대표 동네 매핑, 서울 지역 여부 판별
    seoulDistrictsI18n.js      # 자치구/동네명 표시용 다국어 사전 (실제 검색값은 항상 한국어)
    components/
      Toolbar.jsx               # 환율 티커 + 언어 선택을 묶은 상단 바
      ExchangeRateTicker.jsx    # 환율 티커 (3초 간격 통화 순환 표시)
      LocationToggle.jsx        # 현위치 버튼 (Geolocation → 역지오코딩 → 서울 여부 검증)
      LanguageSelect.jsx        # 언어 선택 드롭다운
      SearchForm.jsx            # 지역/날짜 입력, 커스텀 지역 자동완성 드롭다운 (관심사·기간 선택 UI 없음)
      ResultView.jsx            # 날씨 카드(+시간대별 날씨 접기/펼치기) + weather_picks 캐러셀 + 카테고리 탭 + 추천 카드(더보기 포함)
      SeoulEvents.jsx           # "축제/공연/행사" 탭 활성 시 노출되는 비짓서울 축제 카드 섹션
      CategoryIcon.jsx          # 카테고리별(전체 포함 9종) SVG 아이콘
      WeatherIcon.jsx           # 날씨 상태별 아이콘 (WMO 코드 기반, 언어 무관)
      StatIcon.jsx              # 강수확률/풍속/습도/여행지수 아이콘
    App.css                     # 전체 스타일 (반응형 브레이크포인트 포함)
vercel.json                    # frontend/backend를 Vercel Services로 선언, /api/* → backend, 나머지 → frontend rewrite
PRD.md
CLAUDE.md
```

## 백엔드 API

| 엔드포인트 | 설명 |
|---|---|
| `POST /api/recommend` | `{ region, date, endDate?, interests?, language? }` → 지역·날짜 기반 날씨+추천 결과 (핵심 기능). `interests`는 하위 호환용이며 프론트는 보내지 않음(항상 전체 카테고리 생성 후 탭으로 필터링) |
| `GET /api/exchange-rate` | JPY/USD/CNY 환율 조회 |
| `GET /api/reverse-geocode?lat=&lon=` | 좌표 → "시/도 시/군/구 동" 주소 (현위치 기능에서 사용) |
| `GET /api/seoul-contents?keyword=&lang=&page=` | 비짓서울 관광 콘텐츠 목록 조회. `keyword=축제`면 서울 외 지역 콘텐츠를 걸러낸 목록 반환 |

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
| `GEMINI_MODEL` | (선택) | 기본값 `gemini-2.5-flash`. 무료 티어는 모델별로 분당 요청 수 제한(보통 15회)이 있어, 검색 1회당 5개 요청을 쓰는 이 서비스는 짧은 시간에 여러 번 연속 검색하면 429 에러가 날 수 있음 |
| `VISIT_SEOUL_API_KEY` | [비짓서울 오픈 API](https://visitseoulnet.openapi.co.kr/) 등 발급처 | 장소 사진·상세페이지 조회 및 축제·행사 카드에 사용. 없으면 해당 장소는 사진 없이 텍스트만 표시됨 |
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
4. 서버리스 환경에서는 `cache.py`의 인메모리 캐시가 함수 인스턴스마다 별도로 채워지고 재시작 시 초기화됩니다(장기 캐시 저장소가 아님).

참고: Vercel Hobby 플랜은 서버리스 함수 실행 시간에 제한이 있어(기본 10초), Gemini 응답이 느리면 타임아웃이 날 수 있습니다. 반복적으로 타임아웃이 발생하면 `vercel.json`에 `functions` 설정으로 `maxDuration`을 늘리거나 플랜을 확인하세요.

## 참고

- 서비스 지역은 서울 25개 자치구로 한정됩니다. 그 외 지역을 입력하거나 현위치가 서울이 아니면 안내 후 진행이 막힙니다.
- Open-Meteo 예보 특성상 여행 날짜는 오늘부터 16일 이내만 선택 가능합니다. 여행 일정(숙박일수) 선택은 없으며, 항상 첫째 날 날씨를 기준으로 추천이 생성됩니다.
- 관심사 카테고리는 폼에서 미리 선택하지 않고, 검색 후 결과 화면의 탭(전체 + 8종)에서 필터링합니다. 카테고리당 6곳이 생성되며, "전체" 탭에서는 3곳만 미리보기로 표시됩니다.
- 명소/맛집 추천은 Gemini가 생성한 텍스트이므로, 실제 방문 전 정보를 한 번 더 확인하는 것을 권장합니다.
- 장소 사진과 상세페이지 링크는 비짓서울 API에 등록된 콘텐츠만 사용합니다. 비짓서울에 없는 장소는 사진 없이 텍스트만 표시되고, 지도 링크는 구글 지도 검색으로 대체됩니다.
- Gemini 무료 티어의 분당 요청 제한 때문에 검색을 짧은 시간에 여러 번 연속 실행하면 429 에러가 날 수 있습니다.

## UI/UX 개선 이력 (최근 세션)

- **지역 입력 자동완성**: 브라우저 네이티브 `<input list>` datalist가 재선택 시 드롭다운을 다시 띄우지 않는 문제가 있어, 포커스할 때마다 항상 뜨는 커스텀 드롭다운(`region-suggestions`)으로 교체. 서울 자치구 선택 시 대표 동네 3곳도 함께 표시(언어별 라벨 지원).
- **서울 한정 서비스로 전환**: 지역 입력을 서울 25개 자치구로 제한하고, 현위치 버튼도 서울이 아니면 알림 후 차단하도록 변경.
- **폼 단순화**: 관심사(카테고리) 체크박스와 여행 일정(당일치기~6박) 선택 필드를 폼에서 완전히 제거. 검색은 지역+날짜만으로 실행되고, 항상 전체 8개 카테고리 추천을 받아온 뒤 결과 화면 상단 탭으로 필터링하는 방식으로 전환.
- **오늘 날씨 맞춤 추천 캐러셀 추가**: 카테고리 무관하게 그날 날씨에 가장 맞는 장소 6곳을 별도 생성해, 좌우 화살표로 넘기는 무한 루프 캐러셀로 표시.
- **시간대별 날씨 추가**: Open-Meteo 시간별 예보를 3시간 간격으로 뽑아 표시. 기본은 접힌 상태이고 클릭하면 펼쳐짐.
- **상세보기 링크**: 비짓서울에 등록된 장소는 카카오맵 대신 실제 비짓서울 상세페이지로 이동하는 버튼을 표시하고, 등록되지 않은 장소만 구글 지도 검색으로 폴백.
- **다국어 완전 지원**: 언어 선택이 표시만 되던 상태에서, UI 문자열은 물론 Gemini 생성 텍스트·날씨 상태/여행지수·비짓서울 콘텐츠까지 실제로 번역되도록 전면 구현. 지역명(자치구/동네)은 표시만 번역하고 실제 검색값은 한국어로 유지.
- **성능 최적화**: Gemini에 8개 카테고리를 한 번의 거대한 요청으로 보내던 것을 그룹 단위로 나눠 병렬 호출하고, 비짓서울 사진 조회도 항목 단위로 병렬화. 카테고리당 추천 개수를 9곳→6곳으로 줄이고, 지오코딩·장소 조회 결과를 캐싱해 전체 응답 시간을 33초 이상에서 15초 안팎으로 단축.
- **레이아웃 정렬**: 전역 `box-sizing: border-box` 리셋, 날짜별/시간대별 예보와 날씨 통계 카드를 grid로 통일해 모바일/PC 레이아웃이 항상 균등한 간격을 유지하도록 함. 영어 등 긴 텍스트에서 라벨 줄바꿈·카드 정렬이 깨지던 문제도 수정.
- **자동 스크롤**: 검색 결과가 로드되면 결과 화면(날씨 카드)으로 자동으로 부드럽게 스크롤 이동.
- **맨 위로 이동 버튼**: 스크롤이 400px 이상 내려가면 우측 하단에 표시되는 원형 버튼 추가.
