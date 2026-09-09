# 팀트립고고 (VividSoul)

가고 싶은 지역과 여행 날짜를 선택하면, 그날의 날씨에 맞춰 숨겨진 현지 명소와 현지인 맛집을 추천해주는 반응형 웹앱입니다.

전체 기획 내용은 [PRD.md](./PRD.md), 저장소 구조/개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 핵심 기능

1. 지역 선택(자동완성 드롭다운) + 출발 날짜 + 여행 일정(당일치기~최대 6박) 선택
2. 선택한 지역·기간의 날짜별 날씨 조회 (카카오맵으로 위경도 변환 → Open-Meteo 일별 예보 조회)
3. 첫날 날씨 정보를 Gemini에 전달해 "날씨 요약/추천 이유 + 날씨 맞춤형 숨은 명소 N곳 + 숨은 맛집 N곳" 생성 (2박 이상이면 명소·맛집 각 6곳, 그 외 3곳)
4. Google Places API로 각 추천 장소의 대표 사진 첨부 (실패해도 전체 추천은 계속 진행)
5. 각 추천 카드에서 카카오맵 검색 링크로 바로 위치 확인 가능
6. 반응형 UI: 모바일 2열/PC 4열 레이아웃 자동 전환, 스크롤 시 맨 위로 이동 버튼 노출

## 기술 스택

- **프론트엔드**: React + Vite
- **백엔드**: Python 3.11 + Flask
- **외부 API**: 카카오맵(Local) API, Open-Meteo(날씨), Google Places API(장소 사진, 선택), Gemini (`google-genai` SDK)

## 프로젝트 구조

```
backend/
  app.py                  # Flask 엔드포인트 (POST /api/recommend) — Vercel에서 backend 서비스의 entrypoint
  pipeline.py             # 카카오맵 → Open-Meteo → Gemini → Places 파이프라인, 숙박일수에 따른 추천 개수 결정
  services/
    kakao_service.py      # 지역명 → 위도/경도
    weather_service.py    # 위경도 + 기간 → 날짜별 날씨 요약(Open-Meteo)
    gemini_service.py     # 날씨 + 지역 → 추천 생성 (JSON 스키마 강제, weather_desc/spot_reason 분리)
    places_service.py     # 장소명 → Google Places 대표 사진 URL
  requirements.txt
  pyproject.toml           # Vercel Python 런타임용 프로젝트/의존성 정의
  .env.example
frontend/
  src/
    App.jsx                # 최상위 상태 관리, 맨 위로 이동 버튼
    components/
      SearchForm.jsx       # 지역/날짜/일정 입력, 커스텀 지역 자동완성 드롭다운
      ResultView.jsx        # 날씨 요약(기간별) + 추천 카드 (카카오맵 링크 포함)
      WeatherIcon.jsx       # 날씨 상태별 아이콘
      StatIcon.jsx          # 강수확률/풍속/습도/여행지수 아이콘
    App.css                 # 전체 스타일 (반응형 브레이크포인트 포함)
vercel.json                # frontend/backend를 Vercel Services로 선언, /api/* → backend, 나머지 → frontend rewrite
PRD.md
CLAUDE.md
```

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
| `GOOGLE_PLACES_API_KEY` | (선택) [Google Cloud Console](https://console.cloud.google.com) → Places API (New) | 없으면 추천 카드에 사진 없이 텍스트만 표시됨 |

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

개발 모드(`npm run dev`)에서는 기본적으로 `http://localhost:5000`의 백엔드를 호출합니다. 다른 주소를 쓰려면 `frontend/.env`에 `VITE_API_BASE_URL`을 설정하세요. 프로덕션 빌드(`npm run build`)에서는 `VITE_API_BASE_URL`이 없으면 같은 도메인의 `/api/recommend`를 상대 경로로 호출합니다.

## Vercel 배포

이 저장소는 [Vercel Services](https://vercel.com/docs/services)로 프론트엔드(`frontend/`, 정적 사이트)와 백엔드(`backend/`, Flask 앱)를 하나의 Vercel 프로젝트에서 함께 배포하도록 구성되어 있습니다. `vercel.json`의 `services.frontend`/`services.backend`가 각 디렉토리의 빌드·entrypoint를 정의하고, `rewrites`가 `/api/*`는 backend로, 나머지 전부는 frontend(SPA)로 라우팅합니다.

1. **Vercel 프로젝트 설정 → General → Root Directory**를 저장소 루트(비워두거나 `.`)로 설정하세요. `frontend`로 설정되어 있으면 루트의 `vercel.json`이 배포 대상에서 빠져 백엔드 호출이 실패합니다.
2. **Settings → Environment Variables**에 아래 값을 등록하세요 (backend/.env와 동일한 값):
   - `KAKAO_REST_API_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (선택, 기본값 `gemini-2.5-flash`)
   - `GOOGLE_PLACES_API_KEY` (선택)
3. 재배포하면 `frontend/`가 `npm install && npm run build`로 빌드되고, `backend/app.py`의 Flask 앱(`backend/pyproject.toml`에 의존성 정의)이 `POST /api/recommend`로 노출됩니다. 프론트엔드는 같은 도메인이므로 `VITE_API_BASE_URL`을 별도로 설정할 필요가 없습니다.

참고: Vercel Hobby 플랜은 서버리스 함수 실행 시간에 제한이 있어(기본 10초), Gemini 응답이 느리면 타임아웃이 날 수 있습니다. 반복적으로 타임아웃이 발생하면 `vercel.json`에 `functions` 설정으로 `maxDuration`을 늘리거나 플랜을 확인하세요.

## 참고

- Open-Meteo 예보 특성상 여행 날짜는 오늘부터 16일 이내만 선택 가능하며, 여행 일정은 당일치기~최대 6박까지 선택할 수 있습니다.
- 추천은 첫째 날 날씨를 기준으로 생성되며, 2박 이상 일정은 명소·맛집을 각 6곳, 그 외에는 각 3곳 추천합니다.
- 명소/맛집 추천은 Gemini가 생성한 텍스트이므로, 실제 방문 전 정보를 한 번 더 확인하는 것을 권장합니다.

## UI/UX 개선 이력 (최근 세션)

- **지역 입력 자동완성**: 브라우저 네이티브 `<input list>` datalist가 재선택 시 드롭다운을 다시 띄우지 않는 문제가 있어, 포커스할 때마다 항상 뜨는 커스텀 드롭다운(`region-suggestions`)으로 교체. 브라우저 자동완성 오버레이가 겹쳐 보이는 문제는 `autoComplete="one-time-code"`로 우회.
- **날씨 요약 문구**: Gemini 응답을 `weather_desc`(날씨 설명)와 `spot_reason`(추천 이유) 두 필드로 분리해, 항상 그 경계에서만 줄바꿈되도록 변경(문장 수에 따라 줄바꿈 위치가 흔들리던 문제 해결).
- **레이아웃 정렬**: 전역 `box-sizing: border-box` 리셋 추가로 카드 우측 여백 소실 문제 해결. 날짜별 예보(`daily-forecast`)와 날씨 통계 카드(`weather-stats`)를 flex-wrap 대신 grid로 변경해 모바일 2열/PC 4열이 항상 균등한 간격을 유지하도록 함.
- **모바일 대응**: 640px 이하 브레이크포인트에서 카드 패딩, 폰트 크기, 통계 카드 그리드/패딩을 별도 조정.
- **맨 위로 이동 버튼**: 스크롤이 400px 이상 내려가면 우측 하단에 표시되는 원형 버튼 추가 (`App.jsx`의 스크롤 이벤트 리스너 + `.scroll-top-btn`).
