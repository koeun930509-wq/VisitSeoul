# CLAUDE.md

이 파일은 이 저장소에서 코드 작업을 할 때 Claude Code(claude.ai/code)에게 제공되는 안내 문서입니다.

## 프로젝트 현황

- `PRD.md` — 제품 요구사항 문서
- `backend/` — Flask 앱(`app.py`)으로 감싸진 추천 파이프라인. `pipeline.py`를 콘솔에서 직접 실행할 수도 있습니다.
- `frontend/` — React + Vite로 스캐폴딩 완료 (`SearchForm`, `ResultView` 등 구현됨).

### backend 실행 방법

```
cd backend
pip install -r requirements.txt
cp .env.example .env   # KAKAO_REST_API_KEY, GEMINI_API_KEY 채워넣기 (GOOGLE_PLACES_API_KEY는 선택)
python app.py          # http://localhost:5000, POST /api/recommend
```

`pipeline.py`의 `get_travel_recommendation(region, start_date, end_date=None)`이 카카오맵 geocoding → Open-Meteo 날씨 조회 → Gemini 추천 생성 → Google Places 사진 첨부를 순서대로 호출하는 진입점입니다. Open-Meteo는 API 키 없이 오늘부터 최대 16일 이내 예보를 제공합니다. 콘솔 단독 실행은 `python pipeline.py "제주도" "2026-08-01"`.

### frontend 실행 방법

```
cd frontend
npm install
npm run dev   # http://localhost:5173, 기본적으로 http://localhost:5000 백엔드를 호출
```

아직 린트/테스트 도구는 구성돼 있지 않습니다(프론트엔드에 `oxlint`만 설정됨). CI가 추가되면 이 섹션을 업데이트해야 합니다.

## 제품: 팀트립고고 (VividSoul)

사용자가 지역과 여행 날짜를 선택하면, 날씨를 고려한 추천 결과 — 유명 관광지 + 숨겨진 현지 명소, 그리고 현지 맛집/음식 추천 — 을 보여주는 반응형 웹앱입니다. 전체 스펙은 `PRD.md`에 있습니다.

## 아키텍처 (PRD.md 기준, 구현 완료)

- **프론트엔드**: React + Vite (`frontend/`)
- **백엔드**: Python 3.11 + Flask (`backend/app.py`가 `POST /api/recommend` 엔드포인트로 `pipeline.py`를 노출)
- **AI 추천**: Gemini — 반드시 `google-genai` SDK를 사용해야 합니다. 구버전 `google-generativeai` 패키지는 **사용 금지**입니다.
- **외부 API**: 위경도 변환은 카카오맵 API(`backend/services/kakao_service.py`), 날씨 조회는 Open-Meteo(`backend/services/weather_service.py`, API 키 불필요), 장소 사진은 Google Places API(`backend/services/places_service.py`, 선택), 명소·맛집 추천 생성은 Gemini(`backend/services/gemini_service.py`)로 확정.

핵심 흐름: 지역 + 날짜(+ 여행 일정) 입력 → 해당 지역·기간의 날짜별 날씨 조회 → 첫날 날씨와 지역 정보를 Gemini에 전달해 추천 생성(숨겨진 현지 명소 + 현지 맛집, 2박 이상이면 각 6곳·그 외 3곳) → Google Places로 사진 첨부 → React UI에 결과 렌더링.

배포는 Vercel(`vercel.json`, `api/recommend.py`)로 프론트엔드 정적 빌드와 백엔드 Serverless Function을 한 프로젝트에서 함께 서빙하도록 구성되어 있습니다.
