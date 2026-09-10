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
cp .env.example .env   # KAKAO_REST_API_KEY, GEMINI_API_KEY 등 채워넣기 (GOOGLE_PLACES_API_KEY는 선택)
python app.py          # http://localhost:5000, POST /api/recommend 외 아래 엔드포인트 참고
```

`pipeline.py`의 `get_travel_recommendation(region, start_date, end_date=None, interests=None)`이 카카오맵 geocoding → Open-Meteo 날씨 조회 → Gemini 추천 생성(선택 관심사 카테고리별) → 사진 첨부를 순서대로 호출하는 진입점입니다. Open-Meteo는 API 키 없이 오늘부터 최대 16일 이내 예보를 제공합니다. 콘솔 단독 실행은 `python pipeline.py "제주도" "2026-08-01"` (인자로 넘긴 지역은 서울 외 지역도 동작하지만, 프론트엔드는 서울 자치구만 허용하도록 제한돼 있습니다).

`app.py`가 노출하는 엔드포인트:
- `POST /api/recommend` — 지역/날짜/관심사 기반 추천 (핵심 기능)
- `GET /api/exchange-rate` — 한국수출입은행 API 기반 JPY/USD/CNY 환율 (`services/exim_service.py`)
- `GET /api/reverse-geocode?lat=&lon=` — 좌표 → "시/도 시/군/구 동" 주소 (카카오맵, 현위치 버튼에서 사용)
- `GET /api/seoul-contents?keyword=&lang=&page=` — 비짓서울 API로 관광 콘텐츠 목록 조회 (`services/visitseoul_service.py`, 축제/행사 카드에 사용)

### frontend 실행 방법

```
cd frontend
npm install
npm run dev   # http://localhost:5173, 기본적으로 http://localhost:5000 백엔드를 호출
```

아직 린트/테스트 도구는 구성돼 있지 않습니다(프론트엔드에 `oxlint`만 설정됨). CI가 추가되면 이 섹션을 업데이트해야 합니다.

## 제품: VividSoul

사용자가 서울 자치구와 여행 날짜, 관심사(카테고리)를 선택하면, 날씨를 고려한 추천 결과 — 관심사별 숨겨진 현지 명소, 현지 맛집/음식 추천 — 를 보여주는 반응형 웹앱입니다. 전체 스펙은 `PRD.md`에 있습니다.

## 아키텍처 (구현 완료 기준)

- **프론트엔드**: React + Vite (`frontend/`)
- **백엔드**: Python 3.11 + Flask (`backend/app.py`가 여러 REST 엔드포인트로 `pipeline.py`/각 서비스 모듈을 노출)
- **AI 추천**: Gemini — 반드시 `google-genai` SDK를 사용해야 합니다. 구버전 `google-generativeai` 패키지는 **사용 금지**입니다.
- **외부 API**:
  - 위경도 변환·역지오코딩: 카카오맵 API (`backend/services/kakao_service.py`)
  - 날씨 조회: Open-Meteo (`backend/services/weather_service.py`, API 키 불필요)
  - 장소 사진: 비짓서울 API 우선, 실패 시 Google Places API로 폴백 (`backend/services/places_service.py`)
  - 관광 콘텐츠(축제/행사 등): 비짓서울 API (`backend/services/visitseoul_service.py`)
  - 환율: 한국수출입은행 API (`backend/services/exim_service.py`)
  - 명소·맛집 추천 생성: Gemini (`backend/services/gemini_service.py`)

핵심 흐름: 서울 자치구 + 날짜(+ 여행 일정) + 관심사(카테고리, 다중 선택 가능) 입력 → 해당 지역·기간의 날짜별 날씨 조회 → 첫날 날씨와 선택 관심사를 Gemini에 전달해 관심사별로 분리된 추천 생성(각 관심사 카테고리마다 독립된 섹션 제목 + 장소 목록, "음식" 카테고리는 메뉴 정보 포함, 2박 이상이면 카테고리당 6곳·그 외 3곳; 관심사 미선택 시 8개 카테고리 전체) → 각 장소에 비짓서울/Google Places 사진 첨부 → React UI에 관심사별 섹션으로 렌더링. "축제/공연/행사"를 선택하면 비짓서울 API 기반 서울 축제 카드 섹션도 별도로 노출됩니다.

관심사(카테고리) 8종: 문화관광, 쇼핑, 숙박, 역사관광, 음식, 자연관광, 체험관광, 축제/공연/행사.

지역 입력은 서울 25개 자치구로 제한되며(`frontend/src/seoulDistricts.js`), 서울 외 지역을 입력하거나 현위치가 서울이 아니면 알림을 띄우고 막습니다.

배포는 Vercel(`vercel.json`)로 프론트엔드 정적 빌드와 백엔드(`backend/`, `backend/pyproject.toml` 기준)를 한 프로젝트에서 함께 서빙하도록 구성되어 있습니다.
