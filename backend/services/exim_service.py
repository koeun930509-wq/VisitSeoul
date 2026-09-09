import os
from datetime import datetime, timedelta

import requests

EXCHANGE_URL = "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON"

# 표시할 통화와 한국수출입은행 API의 cur_unit 코드 매핑.
# JPY는 100엔 단위 고시라 원 단위로 환산할 때 100으로 나눈다.
TARGET_CURRENCIES = {
    "JPY": {"cur_unit": "JPY(100)", "divisor": 100},
    "USD": {"cur_unit": "USD", "divisor": 1},
    "CNY": {"cur_unit": "CNH", "divisor": 1},
}


def _parse_rate(value: str) -> float:
    return float(value.replace(",", ""))


def _fetch_for_date(api_key: str, date: datetime) -> list[dict] | None:
    resp = requests.get(
        EXCHANGE_URL,
        params={"authkey": api_key, "searchdate": date.strftime("%Y%m%d"), "data": "AP01"},
        timeout=5,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if data else None


def get_exchange_rates() -> list[dict]:
    """원화 기준 JPY/USD/CNY 환율을 조회한다.

    한국수출입은행 API는 주말·공휴일에는 데이터를 제공하지 않으므로
    최근 영업일을 찾을 때까지 최대 7일 전까지 거슬러 올라간다.
    """
    api_key = os.environ["EXIM_API_KEY"]

    data = None
    for days_ago in range(7):
        date = datetime.now() - timedelta(days=days_ago)
        data = _fetch_for_date(api_key, date)
        if data:
            break

    if not data:
        raise ValueError("환율 정보를 조회할 수 없습니다.")

    rates_by_unit = {item["cur_unit"]: item for item in data}

    result = []
    for code, meta in TARGET_CURRENCIES.items():
        item = rates_by_unit.get(meta["cur_unit"])
        if not item:
            continue
        rate = _parse_rate(item["deal_bas_r"]) / meta["divisor"]
        result.append({"code": code, "rate": round(rate, 2)})

    return result
