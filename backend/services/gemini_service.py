import json
import os

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
        "description": {"type": "string"},
        "why_this_weather": {"type": "string"},
    },
    "required": ["name", "description", "why_this_weather"],
}

_FOOD_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "menu": {"type": "string"},
        "why_this_weather": {"type": "string"},
    },
    "required": ["name", "menu", "why_this_weather"],
}


def _build_schema(interests: list[str]) -> dict:
    category_properties = {}
    for interest in interests:
        item_schema = _FOOD_ITEM_SCHEMA if interest == "음식" else _SPOT_ITEM_SCHEMA
        category_properties[interest] = {
            "type": "object",
            "properties": {
                "section_title": {"type": "string"},
                "items": {"type": "array", "items": item_schema},
            },
            "required": ["section_title", "items"],
        }

    return {
        "type": "object",
        "properties": {
            "weather_desc": {"type": "string"},
            "spot_reason": {"type": "string"},
            "categories": {
                "type": "object",
                "properties": category_properties,
                "required": interests,
            },
        },
        "required": ["weather_desc", "spot_reason", "categories"],
    }


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _build_prompt(region: str, weather: dict, count: int, interests: list[str], language: str) -> str:
    interest_list = ", ".join(interests)
    category_lines = "\n".join(
        f'- "{interest}": section_title은 이 관심사가 드러나는 8자 내외 제목(예: 역사관광이면 "역사가 숨쉬는 명소", '
        f'음식이면 "현지인이 인정한 맛집"), items는 {count}곳'
        + ("(각 항목은 실제 맛집 이름과 대표 메뉴)" if interest == "음식" else "")
        for interest in interests
    )
    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["ko"])
    language_line = (
        ""
        if language == "ko"
        else f"\n중요: categories 안의 section_title, name, description/menu, why_this_weather를 포함한 "
        f"모든 응답 텍스트를 {language_name}로 작성하세요 (지역명·고유명사도 가능하면 {language_name} 표기 병기).\n"
    )

    return f"""당신은 국내 지역 여행 전문가입니다. 아래 조건에 맞는 추천을 한국어로 작성하세요.

여행 지역: {region}
날씨: {weather['condition']}, 최저 {weather['temp_min']}도 / 최고 {weather['temp_max']}도, 강수확률 {weather['pop']}%

사용자가 선택한 주요 관심사: {interest_list}
{language_line}
요구사항:
- weather_desc: 위 날씨 조건을 한 문장으로 요약하세요.
- spot_reason: 이 날씨에서 어떤 장소들을 추천하는지 한 문장으로 요약하세요 (예: 실내 활동 위주 추천, 야외 활동 위주 추천).
- categories 객체의 각 키(관심사)마다 해당 카테고리에 맞는 장소를 아래 기준으로 추천하세요. 관광 안내 책자에 잘 나오지 않는, 현지인이 즐겨 찾는 장소 위주로 추천하고, 카테고리 간 장소가 겹치지 않게 하세요.
{category_lines}
- 각 추천마다 why_this_weather에 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 제시하세요 (예: 비/폭염이면 실내·그늘 위주, 맑고 선선하면 야외 위주).
"""


def generate_recommendations(
    region: str, weather: dict, count: int = 3, interests: list[str] | None = None, language: str = "ko"
) -> dict:
    interests = interests or DEFAULT_INTERESTS
    if language not in LANGUAGE_NAMES:
        language = "ko"

    client = _get_client()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    response = client.models.generate_content(
        model=model,
        contents=_build_prompt(region, weather, count, interests, language),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_build_schema(interests),
        ),
    )
    return json.loads(response.text)
