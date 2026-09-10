import os

import requests

from services.cache import cached

ADDRESS_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/address.json"
KEYWORD_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"
COORD2ADDRESS_URL = "https://dapi.kakao.com/v2/local/geo/coord2address.json"
GEOCODE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60  # 지역의 위경도는 사실상 변하지 않으므로 30일 캐시


def _fetch_geocode(region: str) -> dict:
    api_key = os.environ["KAKAO_REST_API_KEY"]
    headers = {"Authorization": f"KakaoAK {api_key}"}

    documents = _search(ADDRESS_SEARCH_URL, headers, region)
    if not documents:
        documents = _search(KEYWORD_SEARCH_URL, headers, region)

    if not documents:
        raise ValueError(f"'{region}'에 대한 위치 정보를 찾을 수 없습니다.")

    doc = documents[0]
    return {
        "lat": float(doc["y"]),
        "lon": float(doc["x"]),
        "matched_name": doc.get("address_name") or doc.get("place_name"),
    }


def geocode_region(region: str) -> dict:
    """지역명을 카카오맵 API로 위도/경도로 변환한다.

    주소 검색으로 못 찾으면(예: '제주도', '해운대'처럼 정식 주소가 아닌 지역명)
    키워드 검색으로 한 번 더 시도한다. 같은 지역이 반복 검색되는 경우가 많으므로 결과를 캐시한다.
    """
    return cached(f"geocode:{region}", GEOCODE_CACHE_TTL_SECONDS, lambda: _fetch_geocode(region))


def _search(url: str, headers: dict, query: str) -> list:
    resp = requests.get(url, headers=headers, params={"query": query}, timeout=5)
    resp.raise_for_status()
    return resp.json().get("documents", [])


def reverse_geocode(lat: float, lon: float) -> str:
    """위도/경도를 카카오맵 API로 '시/도 시/군/구 동/읍/면' 형태 주소로 변환한다."""
    api_key = os.environ["KAKAO_REST_API_KEY"]
    headers = {"Authorization": f"KakaoAK {api_key}"}

    resp = requests.get(
        COORD2ADDRESS_URL,
        headers=headers,
        params={"x": lon, "y": lat},
        timeout=5,
    )
    resp.raise_for_status()
    documents = resp.json().get("documents", [])
    if not documents:
        raise ValueError("해당 좌표에 대한 주소 정보를 찾을 수 없습니다.")

    address = documents[0]["address"]
    parts = [
        address.get("region_1depth_name"),
        address.get("region_2depth_name"),
        address.get("region_3depth_name"),
    ]
    return " ".join(p for p in parts if p)
