# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code(claude.ai/code)에게 제공되는 안내 문서입니다.

## 프로젝트 현황

- `PRD.md` — 제품 요구사항 문서
- `backend/` — Flask 앱(`app.py`)으로 감싸진 추천 파이프라인. `pipeline.py`를 콘솔에서 직접 실행할 수도 있습니다.
- `frontend/` — React + Vite로 스캐폴딩 완료 (`SearchForm`, `ResultView`, `Toolbar` 등 구현됨).

### backend 실행 방법

```
cd backend
pip install -r requirements.txt
cp .env.example .env   # KAKAO_REST_API_KEY, GEMINI_API_KEY 등 채워넣기
python app.py          # http://localhost:5000, POST /api/recommend 외 아래 엔드포인트 참고
```

`pipeline.py`의 `get_travel_recommendation(region, start_date, end_date=None, interests=None, language="ko")`이 카카오맵 geocoding(캐시됨) → Open-Meteo 날씨 조회 → Gemini 추천 생성 → 비짓서울 사진/상세URL 첨부(병렬) → 시간대별 날씨 조회를 순서대로 호출하는 진입점입니다. Open-Meteo는 API 키 없이 오늘부터 최대 16일 이내 예보를 제공합니다. 콘솔 단독 실행은 `python pipeline.py "제주도" "2026-08-01"` (인자로 넘긴 지역은 서울 외 지역도 동작하지만, 프론트엔드는 서울 자치구만 허용하도록 제한돼 있습니다).

`interests` 파라미터는 하위 호환을 위해 남아있으나 **현재 프론트엔드는 이 값을 보내지 않습니다** — 검색 폼에는 지역·날짜만 있고, 관심사(카테고리) 선택 UI는 폼에서 결과 화면의 탭으로 옮겨졌습니다. 따라서 백엔드는 항상 8개 카테고리 전체(`gemini_service.DEFAULT_INTERESTS`)에 대한 추천을 생성하고, 프론트가 탭 클릭에 따라 클라이언트에서 필터링합니다.

`app.py`가 노출하는 엔드포인트:
- `POST /api/recommend` — body `{region, date, endDate?, interests?, language?}` → 지역/날짜 기반 추천 (핵심 기능)
- `GET /api/exchange-rate` — 한국수출입은행 API 기반 JPY/USD/CNY 환율 (`services/exim_service.py`)
- `GET /api/reverse-geocode?lat=&lon=` — 좌표 → "시/도 시/군/구 동" 주소 (카카오맵, 현위치 버튼에서 사용)
- `GET /api/seoul-contents?keyword=&lang=&page=` — 비짓서울 API로 관광 콘텐츠 목록 조회. `keyword=축제`면 서울 외 지역 콘텐츠를 걸러낸 `get_festival_contents`로 라우팅됨 (`services/visitseoul_service.py`)

### frontend 실행 방법

```
cd frontend
npm install
npm run dev   # http://localhost:5173, 기본적으로 http://localhost:5000 백엔드를 호출
```

아직 린트/테스트 도구는 구성돼 있지 않습니다(프론트엔드에 `oxlint`만 설정됨). CI가 추가되면 이 섹션을 업데이트해야 합니다.

## 제품: VividSoul

사용자가 서울 자치구와 여행 날짜를 선택하면, 날씨를 고려한 추천 결과 — 오늘 날씨에 가장 맞는 장소, 관심사 카테고리별 숨겨진 현지 명소·맛집 — 를 보여주는 반응형 웹앱입니다. 한국어/영어/일본어/중국어 4개 언어를 완전히 지원합니다. 전체 스펙은 `PRD.md`에 있습니다.

## 아키텍처 (구현 완료 기준)

- **프론트엔드**: React + Vite (`frontend/`)
- **백엔드**: Python 3.11 + Flask (`backend/app.py`가 여러 REST 엔드포인트로 `pipeline.py`/각 서비스 모듈을 노출)
- **AI 추천**: Gemini — 반드시 `google-genai` SDK를 사용해야 합니다. 구버전 `google-generativeai` 패키지는 **사용 금지**입니다.
- **외부 API**:
  - 위경도 변환·역지오코딩: 카카오맵 API (`backend/services/kakao_service.py`, 지오코딩 결과 30일 캐시)
  - 날씨 조회: Open-Meteo (`backend/services/weather_service.py`, API 키 불필요) — 일별 예보와 3시간 간격 시간별 예보(`get_hourly_weather`) 둘 다 제공
  - 장소 사진·상세페이지: 비짓서울 API (`backend/services/places_service.py`, 검색 결과 6시간 캐시)
  - 관광 콘텐츠(축제/행사 등): 비짓서울 API (`backend/services/visitseoul_service.py`)
  - 환율: 한국수출입은행 API (`backend/services/exim_service.py`)
  - 명소·맛집 추천 생성: Gemini (`backend/services/gemini_service.py`)
  - 인메모리 캐시: `backend/services/cache.py`의 `cached(key, ttl_seconds, compute)` — 프로세스 메모리 캐시라 여러 워커로 배포하면 워커마다 별도로 채워짐

핵심 흐름: 서울 자치구 + 날짜 입력 → 해당 지역의 날짜별/시간별 날씨 조회 → 첫날 날씨를 Gemini에 전달해 (1) 카테고리 무관 "오늘 날씨 맞춤 추천" 6곳(`weather_picks`)과 (2) 8개 관심사 카테고리별 각 6곳을 함께 생성 → 각 장소에 비짓서울 사진/상세URL 첨부(병렬 조회) → React UI에서 날씨 카드 + weather_picks 캐러셀 + 카테고리 탭(전체 포함 9개)으로 렌더링. "전체" 탭에서는 카테고리마다 3곳 미리보기만, 개별 카테고리 탭에서는 6곳(더보기로 추가 확장 가능)을 보여줍니다. "축제/공연/행사" 탭을 선택하면 비짓서울 API 기반 서울 축제 카드 섹션도 별도로 노출됩니다(서울 외 지역 축제는 지명 키워드로 필터링).

**Gemini 요청 그룹화**: 8개 카테고리를 한 번에 요청하면 응답이 느려지고(실측 22초+), 그렇다고 카테고리마다 완전히 개별 요청하면 무료 티어의 분당 요청 제한(모델당 15회)에 바로 걸립니다. 절충안으로 `gemini_service.CATEGORY_GROUP_COUNT = 3`개씩 묶어 그룹 단위로 병렬 요청하며, 요약(weather_desc/spot_reason)과 weather_picks도 별도 요청으로 병렬 실행됩니다 — 검색 1회당 Gemini 요청은 총 5회(그룹 3 + 요약 1 + weather_picks 1). 이 제한 때문에 짧은 시간에 검색을 여러 번 연속 실행하면 429(rate limit) 에러가 날 수 있습니다.

관심사(카테고리) 8종: 문화관광, 쇼핑, 숙박, 역사관광, 음식, 자연관광, 체험관광, 축제/공연/행사. ("음식" 카테고리만 스키마가 달라 메뉴 정보를 포함합니다.)

지역 입력은 서울 25개 자치구로 제한되며(`frontend/src/seoulDistricts.js`), 서울 외 지역을 입력하거나 현위치가 서울이 아니면 알림을 띄우고 막습니다. 자치구/동네명의 다국어 표시는 `frontend/src/seoulDistrictsI18n.js`에서 처리하지만, 실제 검색/API 요청값은 항상 한국어를 사용합니다(카카오맵·구글맵이 한국어 지명 기준으로 동작하므로).

다국어(`language`: ko/en/ja/zh)는 UI 문자열(`frontend/src/i18n.js`)뿐 아니라 Gemini 생성 텍스트, 날씨 상태/여행지수, 비짓서울 콘텐츠(축제 카드)까지 전부 실제로 번역되어 나옵니다 — 표시만 되는 장식이 아닙니다.

지도/상세 링크: 비짓서울에 등록된 장소는 상세페이지 링크(`detail_url`, `https://korean.visitseoul.net/attractions/detail/{cid}`)를, 없는 장소는 구글 지도 검색 링크로 폴백합니다(카카오맵이 아님).

배포는 Vercel(`vercel.json`)로 프론트엔드 정적 빌드와 백엔드(`backend/`, `backend/pyproject.toml` 기준)를 한 프로젝트에서 함께 서빙하도록 구성되어 있습니다.
