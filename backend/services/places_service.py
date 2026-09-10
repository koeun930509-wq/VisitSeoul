import os
from concurrent.futures import ThreadPoolExecutor

import requests

from services.cache import cached
from services.visitseoul_service import get_contents

DETAIL_URL_TEMPLATE = "https://korean.visitseoul.net/attractions/detail/{cid}"
MAX_WORKERS = 16
CONTENT_CACHE_TTL_SECONDS = 6 * 60 * 60  # 장소 사진/상세페이지 정보는 자주 바뀌지 않으므로 6시간 캐시


def _fetch_visitseoul_content(name: str) -> dict | None:
    if not os.environ.get("VISIT_SEOUL_API_KEY"):
        return None

    result = get_contents(keyword=name)
    if result.get("result_code") != 200:
        return None

    items = result.get("data", [])
    if not items:
        return None

    return items[0]


def find_visitseoul_content(name: str) -> dict | None:
    """장소명(name)으로 비짓서울 콘텐츠를 검색해 첫 번째 결과를 반환한다.
    검색 결과가 없으면 None을 반환한다. 같은 장소는 여러 카테고리·언어에서
    반복 조회되므로 결과를 캐시해 API 호출을 줄인다.
    """
    return cached(f"visitseoul_content:{name}", CONTENT_CACHE_TTL_SECONDS, lambda: _fetch_visitseoul_content(name))


def _attach_photo(spot: dict) -> dict:
    content = None
    try:
        content = find_visitseoul_content(spot["name"])
    except requests.RequestException:
        content = None
    photo_url = content.get("main_img") if content else None
    detail_url = DETAIL_URL_TEMPLATE.format(cid=content["cid"]) if content and content.get("cid") else None
    return {**spot, "photo_url": photo_url, "detail_url": detail_url}


def attach_photos(spots: list) -> list:
    """spots(각 항목에 'name' 키가 있는 dict 리스트)에 photo_url, detail_url 필드를 추가해 반환한다.
    비짓서울 API로 검색하며, 실패해도 전체 추천이 실패하지 않도록
    개별 항목 단위로 예외를 흡수한다. 항목마다 독립된 API 호출이므로 병렬로 처리한다.
    """
    if not spots:
        return []
    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(spots))) as executor:
        return list(executor.map(_attach_photo, spots))
