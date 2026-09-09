import json
import os

from google import genai
from google.genai import types

_client = None

RECOMMENDATION_SCHEMA = {
    "type": "object",
    "properties": {
        "weather_desc": {"type": "string"},
        "spot_reason": {"type": "string"},
        "hidden_spots": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "why_this_weather": {"type": "string"},
                },
                "required": ["name", "description", "why_this_weather"],
            },
        },
        "local_restaurants": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "menu": {"type": "string"},
                    "why_this_weather": {"type": "string"},
                },
                "required": ["name", "menu", "why_this_weather"],
            },
        },
    },
    "required": ["weather_desc", "spot_reason", "hidden_spots", "local_restaurants"],
}


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _build_prompt(region: str, weather: dict, count: int, interests: list[str]) -> str:
    interest_line = ""
    if interests:
        interest_list = ", ".join(interests)
        interest_line = f"\n사용자가 선택한 주요 관심사: {interest_list}\n- 위 관심사와 관련된 장소·맛집 위주로 추천하세요.\n"

    return f"""당신은 국내 지역 여행 전문가입니다. 아래 조건에 맞는 추천을 한국어로 작성하세요.

여행 지역: {region}
날씨: {weather['condition']}, 최저 {weather['temp_min']}도 / 최고 {weather['temp_max']}도, 강수확률 {weather['pop']}%
{interest_line}
요구사항:
- weather_desc: 위 날씨 조건을 한 문장으로 요약하세요.
- spot_reason: 이 날씨에서 어떤 장소들을 추천하는지 한 문장으로 요약하세요 (예: 실내 활동 위주 추천, 야외 활동 위주 추천).
- 관광 안내 책자에 잘 나오지 않는 "숨겨진 현지 명소" {count}곳을 추천하세요.
- 현지인이 즐겨 찾는 "숨은 맛집" {count}곳을 추천하세요.
- 각 추천마다 위 날씨 조건에서 왜 그 장소가 적합한지 이유를 함께 제시하세요 (예: 비/폭염이면 실내·그늘 위주, 맑고 선선하면 야외 위주).
"""


def generate_recommendations(region: str, weather: dict, count: int = 3, interests: list[str] | None = None) -> dict:
    client = _get_client()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    response = client.models.generate_content(
        model=model,
        contents=_build_prompt(region, weather, count, interests or []),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RECOMMENDATION_SCHEMA,
        ),
    )
    return json.loads(response.text)
