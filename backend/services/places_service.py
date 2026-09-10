import os

import requests

from services.visitseoul_service import get_contents

DETAIL_URL_TEMPLATE = "https://korean.visitseoul.net/attractions/detail/{cid}"


def find_visitseoul_content(name: str) -> dict | None:
    """장소명(name)으로 비짓서울 콘텐츠를 검색해 첫 번째 결과를 반환한다.
    검색 결과가 없으면 None을 반환한다.
    """
    if not os.environ.get("VISIT_SEOUL_API_KEY"):
        return None

    result = get_contents(keyword=name)
    if result.get("result_code") != 200:
        return None

    items = result.get("data", [])
    if not items:
        return None

    return items[0]


def attach_photos(spots: list) -> list:
    """spots(각 항목에 'name' 키가 있는 dict 리스트)에 photo_url, detail_url 필드를 추가해 반환한다.
    비짓서울 API로 검색하며, 실패해도 전체 추천이 실패하지 않도록
    개별 항목 단위로 예외를 흡수한다.
    """
    result = []
    for spot in spots:
        content = None
        try:
            content = find_visitseoul_content(spot["name"])
        except requests.RequestException:
            content = None
        photo_url = content.get("main_img") if content else None
        detail_url = DETAIL_URL_TEMPLATE.format(cid=content["cid"]) if content and content.get("cid") else None
        result.append({**spot, "photo_url": photo_url, "detail_url": detail_url})
    return result
