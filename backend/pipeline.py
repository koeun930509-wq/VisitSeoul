import json
import sys
from datetime import datetime

from dotenv import load_dotenv

from services.gemini_service import generate_recommendations
from services.kakao_service import geocode_region
from services.places_service import attach_photos
from services.weather_service import get_weather_for_period


def get_travel_recommendation(
    region: str, start_date: str, end_date: str | None = None, interests: list[str] | None = None
) -> dict:
    """region의 start_date~end_date(생략 시 start_date와 동일한 하루) 기간에 대한
    날씨와 추천을 반환한다. 추천은 첫날 날씨를 기준으로 생성한다.
    """
    end_date = end_date or start_date
    nights = (datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")).days
    spot_count = 6 if nights >= 2 else 3

    location = geocode_region(region)
    weather_by_day = get_weather_for_period(location["lat"], location["lon"], start_date, end_date)
    recommendation = generate_recommendations(region, weather_by_day[0], spot_count, interests or [])
    recommendation["hidden_spots"] = attach_photos(region, recommendation["hidden_spots"])
    if "local_restaurants" in recommendation:
        recommendation["local_restaurants"] = attach_photos(region, recommendation["local_restaurants"])
    return {
        "region": region,
        "location": location,
        "weather": weather_by_day[0],
        "weather_by_day": weather_by_day,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    load_dotenv()

    region = sys.argv[1] if len(sys.argv) > 1 else "제주도"
    start_date = sys.argv[2] if len(sys.argv) > 2 else "2026-08-01"
    end_date = sys.argv[3] if len(sys.argv) > 3 else None

    result = get_travel_recommendation(region, start_date, end_date)
    print(json.dumps(result, ensure_ascii=False, indent=2))
