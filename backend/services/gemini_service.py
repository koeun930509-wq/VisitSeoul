import json
import os
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import types

_client = None

DEFAULT_INTERESTS = ["문화관광", "쇼핑", "숙박", "역사관광", "음식", "자연관광", "체험관광", "축제/공연/행사"]

LANGUAGE_NAMES = {
    "ko": "한국어",
    "en": "English",
    "ja": "日本語",
    "zh": "简体中文",
}

_SPOT_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "search_keyword": {"type": "string"},
        "description": {"type": "string"},
        "why_this_weather": {"type": "string"},
    },
    "required": ["name", "search_keyword", "description", "why_this_weather"],
}

_FOOD_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "search_keyword": {"type": "string"},
        "menu": {"type": "string"},
        "why_this_weather": {"type": "string"},
    },
    "required": ["name", "search_keyword", "menu", "why_this_weather"],
}

_SEARCH_KEYWORD_GUIDE = (
    "search_keyword는 name과 별개로, 지도 앱이나 관광 정보 사이트에서 검색했을 때 정확히 매칭될 "
    "장소의 공식/고유 명칭만 간결하게 적으세요(수식어·설명 문구 제외). 예: name이 \"봉은사 미륵대불 정원\"이면 "
    "search_keyword는 \"봉은사\"."
)

WEATHER_PICKS_COUNT = 6

# Gemini 무료 티어는 분당 요청 수가 제한되어 있어(모델당 15회), 카테고리를 이 그룹 수로
# 묶어서 호출한다. 검색 1회당 요청 수 = 그룹 수 + 2(요약, weather_picks).
CATEGORY_GROUP_COUNT = 3

_SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "weather_desc": {"type": "string"},
        "spot_reason": {"type": "string"},
    },
    "required": ["weather_desc", "spot_reason"],
}

_WEATHER_PICKS_SCHEMA = {
    "type": "object",
    "properties": {"items": {"type": "array", "items": _SPOT_ITEM_SCHEMA}},
    "required": ["items"],
}


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _weather_context(region: str, weather: dict) -> str:
    return (
        f"여행 지역: {region}\n"
        f"날씨: {weather['condition']}, 최저 {weather['temp_min']}도 / 최고 {weather['temp_max']}도, "
        f"강수확률 {weather['pop']}%"
    )


def _language_instruction(language: str) -> str:
    if language == "ko":
        return ""
    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["ko"])
    return f"\n중요: 모든 응답 텍스트를 {language_name}로 작성하세요 (지역명·고유명사도 가능하면 {language_name} 표기 병기).\n"


def _generate(model: str, prompt: str, schema: dict) -> dict:
    client = _get_client()
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )
    return json.loads(response.text)


def _generate_summary(model: str, region: str, weather: dict, language: str) -> dict:
    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
{_language_instruction(language)}
요구사항:
- weather_desc: 위 날씨 조건을 한 문장으로 요약하세요.
- spot_reason: 이 날씨에서 어떤 장소들을 추천하는지 한 문장으로 요약하세요 (예: 실내 활동 위주 추천, 야외 활동 위주 추천).
"""
    return _generate(model, prompt, _SUMMARY_SCHEMA)


def _generate_weather_picks(model: str, region: str, weather: dict, language: str) -> list:
    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
{_language_instruction(language)}
요구사항:
- 관심사 카테고리 구분 없이, 오늘 날씨에 가장 적합한 장소 {WEATHER_PICKS_COUNT}곳을 추천하세요. 예를 들어 비가 오거나
  폭염·한파면 도서관·박물관·실내 카페 등 실내 위주로, 맑고 선선하면 공원·전망대 등 야외 위주로 장소를 고르세요.
  관광 안내 책자에 잘 나오지 않는, 현지인이 즐겨 찾는 장소 위주로 추천하세요.
- 각 추천마다 why_this_weather에 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 제시하세요.
- {_SEARCH_KEYWORD_GUIDE}
"""
    return _generate(model, prompt, _WEATHER_PICKS_SCHEMA)["items"]


def _build_group_schema(interests: list[str]) -> dict:
    properties = {}
    for interest in interests:
        item_schema = _FOOD_ITEM_SCHEMA if interest == "음식" else _SPOT_ITEM_SCHEMA
        properties[interest] = {
            "type": "object",
            "properties": {
                "section_title": {"type": "string"},
                "items": {"type": "array", "items": item_schema},
            },
            "required": ["section_title", "items"],
        }
    return {"type": "object", "properties": properties, "required": interests}


def _generate_category_group(
    model: str, region: str, weather: dict, count: int, interests: list[str], language: str
) -> dict:
    category_lines = "\n".join(
        f'- "{interest}": section_title은 이 관심사가 드러나는 8자 내외 제목(예: 역사관광이면 "역사가 숨쉬는 명소", '
        f'음식이면 "현지인이 인정한 맛집"), items는 {count}곳'
        + ("(각 항목은 실제 맛집 이름과 대표 메뉴)" if interest == "음식" else "")
        for interest in interests
    )
    interest_list = ", ".join(interests)

    prompt = f"""당신은 국내 지역 여행 전문가입니다.

{_weather_context(region, weather)}
사용자가 선택한 관심사: {interest_list}
{_language_instruction(language)}
요구사항:
- 아래 각 관심사 키마다 해당 카테고리에 맞는 장소를 추천하세요. 관광 안내 책자에 잘 나오지 않는, 현지인이
  즐겨 찾는 장소 위주로 추천하고, 관심사 간 장소가 겹치지 않게 하세요.
{category_lines}
- 각 추천마다 why_this_weather에 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 제시하세요
  (예: 비/폭염이면 실내·그늘 위주, 맑고 선선하면 야외 위주).
- {_SEARCH_KEYWORD_GUIDE}
"""
    return _generate(model, prompt, _build_group_schema(interests))


def _chunk(items: list, group_count: int) -> list:
    if group_count <= 0 or group_count >= len(items):
        return [[item] for item in items]
    size = -(-len(items) // group_count)  # 올림 분할
    return [items[i : i + size] for i in range(0, len(items), size)]


def generate_recommendations(
    region: str, weather: dict, count: int = 3, interests: list[str] | None = None, language: str = "ko"
) -> dict:
    interests = interests or DEFAULT_INTERESTS
    if language not in LANGUAGE_NAMES:
        language = "ko"

    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    groups = _chunk(interests, CATEGORY_GROUP_COUNT)

    with ThreadPoolExecutor(max_workers=len(groups) + 2) as executor:
        summary_future = executor.submit(_generate_summary, model, region, weather, language)
        weather_picks_future = executor.submit(_generate_weather_picks, model, region, weather, language)
        group_futures = [
            executor.submit(_generate_category_group, model, region, weather, count, group, language)
            for group in groups
        ]

        summary = summary_future.result()
        weather_picks = weather_picks_future.result()
        categories = {}
        for future in group_futures:
            categories.update(future.result())

    return {
        "weather_desc": summary["weather_desc"],
        "spot_reason": summary["spot_reason"],
        "weather_picks": weather_picks,
        "categories": categories,
    }
