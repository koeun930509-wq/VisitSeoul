from datetime import date, datetime, timedelta

import requests

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MAX_FORECAST_DAYS = 16

# https://open-meteo.com/en/docs 의 WMO Weather interpretation codes
WEATHER_CODE_DESCRIPTIONS = {
    "ko": {
        0: "맑음", 1: "대체로 맑음", 2: "구름 조금", 3: "흐림",
        45: "안개", 48: "짙은 안개",
        51: "약한 이슬비", 53: "이슬비", 55: "강한 이슬비",
        56: "약한 착빙성 이슬비", 57: "강한 착빙성 이슬비",
        61: "약한 비", 63: "비", 65: "강한 비",
        66: "약한 착빙성 비", 67: "강한 착빙성 비",
        71: "약한 눈", 73: "눈", 75: "강한 눈", 77: "싸락눈",
        80: "약한 소나기", 81: "소나기", 82: "강한 소나기",
        85: "약한 소나기눈", 86: "강한 소나기눈",
        95: "뇌우", 96: "약한 우박을 동반한 뇌우", 99: "강한 우박을 동반한 뇌우",
    },
    "en": {
        0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Dense fog",
        51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
        56: "Light freezing drizzle", 57: "Heavy freezing drizzle",
        61: "Light rain", 63: "Rain", 65: "Heavy rain",
        66: "Light freezing rain", 67: "Heavy freezing rain",
        71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
        80: "Light showers", 81: "Showers", 82: "Heavy showers",
        85: "Light snow showers", 86: "Heavy snow showers",
        95: "Thunderstorm", 96: "Thunderstorm with light hail", 99: "Thunderstorm with heavy hail",
    },
    "ja": {
        0: "晴れ", 1: "ほぼ晴れ", 2: "薄曇り", 3: "曇り",
        45: "霧", 48: "濃霧",
        51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨",
        56: "弱い着氷性の霧雨", 57: "強い着氷性の霧雨",
        61: "弱い雨", 63: "雨", 65: "強い雨",
        66: "弱い着氷性の雨", 67: "強い着氷性の雨",
        71: "弱い雪", 73: "雪", 75: "強い雪", 77: "細雪",
        80: "弱いにわか雨", 81: "にわか雨", 82: "強いにわか雨",
        85: "弱いにわか雪", 86: "強いにわか雪",
        95: "雷雨", 96: "弱い雹を伴う雷雨", 99: "強い雹を伴う雷雨",
    },
    "zh": {
        0: "晴", 1: "大部晴朗", 2: "少云", 3: "多云",
        45: "雾", 48: "浓雾",
        51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
        56: "弱冻毛毛雨", 57: "强冻毛毛雨",
        61: "小雨", 63: "雨", 65: "大雨",
        66: "弱冻雨", 67: "强冻雨",
        71: "小雪", 73: "雪", 75: "大雪", 77: "米雪",
        80: "小阵雨", 81: "阵雨", 82: "大阵雨",
        85: "小阵雪", 86: "大阵雪",
        95: "雷暴", 96: "伴有小冰雹的雷暴", 99: "伴有大冰雹的雷暴",
    },
}

UNKNOWN_CONDITION = {"ko": "알 수 없음", "en": "Unknown", "ja": "不明", "zh": "未知"}

TRAVEL_INDEX_LABELS = {
    "ko": {"bad": "나쁨", "ok": "보통", "good": "좋음"},
    "en": {"bad": "Poor", "ok": "Fair", "good": "Good"},
    "ja": {"bad": "悪い", "ok": "普通", "good": "良い"},
    "zh": {"bad": "较差", "ok": "一般", "good": "良好"},
}


def _describe_weather_code(code: int, language: str) -> str:
    descriptions = WEATHER_CODE_DESCRIPTIONS.get(language, WEATHER_CODE_DESCRIPTIONS["ko"])
    return descriptions.get(code, UNKNOWN_CONDITION.get(language, UNKNOWN_CONDITION["ko"]))


def _travel_index(temp_max: float, pop: int, windspeed: float, humidity: int, language: str) -> str:
    """기온·강수확률·풍속·습도를 종합한 간단한 여행 적합도 지수를 반환한다."""
    labels = TRAVEL_INDEX_LABELS.get(language, TRAVEL_INDEX_LABELS["ko"])
    if pop >= 70 or windspeed >= 40 or temp_max >= 35:
        return labels["bad"]
    if pop >= 40 or windspeed >= 25 or humidity >= 80 or temp_max >= 31:
        return labels["ok"]
    return labels["good"]


def _validate_date_range(start_date: str, end_date: str) -> None:
    today = date.today()
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()

    if end < start:
        raise ValueError("종료 날짜는 시작 날짜보다 빠를 수 없습니다.")

    max_date = today + timedelta(days=MAX_FORECAST_DAYS - 1)
    if start > max_date or end > max_date:
        raise ValueError(
            f"{start_date}~{end_date}에 대한 예보 데이터가 없습니다. "
            f"(Open-Meteo는 오늘로부터 최대 {MAX_FORECAST_DAYS}일 이내 예보만 제공합니다)"
        )


def get_weather_for_period(lat: float, lon: float, start_date: str, end_date: str, language: str = "ko") -> list:
    """Open-Meteo 일별 예보에서 start_date~end_date('YYYY-MM-DD') 구간의
    날짜별 날씨 요약 리스트를 반환한다.

    무료 API는 최대 16일 이내 예보만 제공하므로, 그 이후 날짜는 ValueError를 던진다.
    """
    _validate_date_range(start_date, end_date)

    resp = requests.get(
        FORECAST_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "daily": (
                "weathercode,temperature_2m_max,temperature_2m_min,"
                "precipitation_probability_max,windspeed_10m_max,relative_humidity_2m_mean"
            ),
            "timezone": "Asia/Seoul",
            "start_date": start_date,
            "end_date": end_date,
        },
        timeout=5,
    )
    resp.raise_for_status()
    daily = resp.json()["daily"]

    results = []
    for i, day in enumerate(daily["time"]):
        temp_max = round(daily["temperature_2m_max"][i], 1)
        pop = round(daily["precipitation_probability_max"][i])
        windspeed = round(daily["windspeed_10m_max"][i] / 3.6, 1)  # km/h -> m/s
        humidity = round(daily["relative_humidity_2m_mean"][i])

        results.append(
            {
                "date": day,
                "condition": _describe_weather_code(daily["weathercode"][i], language),
                "weather_code": daily["weathercode"][i],
                "temp_min": round(daily["temperature_2m_min"][i], 1),
                "temp_max": temp_max,
                "pop": pop,
                "windspeed": windspeed,
                "humidity": humidity,
                "travel_index": _travel_index(temp_max, pop, daily["windspeed_10m_max"][i], humidity, language),
            }
        )

    if not results:
        raise ValueError(f"{start_date}~{end_date}에 대한 예보 데이터가 없습니다.")

    return results


def get_weather_for_date(lat: float, lon: float, target_date: str) -> dict:
    """단일 날짜 조회 (하위 호환용). get_weather_for_period의 결과 중 첫 항목을 반환한다."""
    return get_weather_for_period(lat, lon, target_date, target_date)[0]


HOURLY_STEP = 3


def get_hourly_weather(lat: float, lon: float, target_date: str, language: str = "ko") -> list:
    """Open-Meteo 시간별 예보에서 target_date('YYYY-MM-DD') 하루치를
    3시간 간격(0, 3, 6, ... 21시)으로 뽑아 반환한다.
    """
    resp = requests.get(
        FORECAST_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "hourly": "weathercode,temperature_2m,precipitation_probability",
            "timezone": "Asia/Seoul",
            "start_date": target_date,
            "end_date": target_date,
        },
        timeout=5,
    )
    resp.raise_for_status()
    hourly = resp.json()["hourly"]

    results = []
    for i in range(0, len(hourly["time"]), HOURLY_STEP):
        results.append(
            {
                "time": hourly["time"][i][-5:],  # "HH:MM"
                "condition": _describe_weather_code(hourly["weathercode"][i], language),
                "weather_code": hourly["weathercode"][i],
                "temp": round(hourly["temperature_2m"][i], 1),
                "pop": round(hourly["precipitation_probability"][i]),
            }
        )

    return results
