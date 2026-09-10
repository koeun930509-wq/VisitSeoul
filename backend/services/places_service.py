import os

import requests

from services.visitseoul_service import get_contents

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
PHOTO_MEDIA_URL_TEMPLATE = "https://places.googleapis.com/v1/{photo_name}/media"
PHOTO_MAX_WIDTH_PX = 640


def find_visitseoul_photo_url(name: str) -> str | None:
    """장소명(name)으로 비짓서울 콘텐츠를 검색해 대표 이미지 URL을 반환한다.
    검색 결과가 없거나 이미지가 없으면 None을 반환한다.
    """
    if not os.environ.get("VISIT_SEOUL_API_KEY"):
        return None

    result = get_contents(keyword=name)
    if result.get("result_code") != 200:
        return None

    items = result.get("data", [])
    if not items:
        return None

    return items[0].get("main_img") or None


def find_photo_url(query: str) -> str | None:
    """장소명(query)으로 Google Places Text Search를 호출해
    대표 사진의 실제 이미지 URL을 반환한다. 사진이 없거나 검색 결과가 없으면 None을 반환한다.
    """
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        return None

    resp = requests.post(
        SEARCH_URL,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.photos",
        },
        json={"textQuery": query, "languageCode": "ko"},
        timeout=5,
    )
    resp.raise_for_status()
    places = resp.json().get("places", [])
    if not places:
        return None

    photos = places[0].get("photos", [])
    if not photos:
        return None

    photo_name = photos[0]["name"]
    photo_resp = requests.get(
        PHOTO_MEDIA_URL_TEMPLATE.format(photo_name=photo_name),
        params={
            "key": api_key,
            "maxWidthPx": PHOTO_MAX_WIDTH_PX,
            "skipHttpRedirect": "true",
        },
        timeout=5,
    )
    photo_resp.raise_for_status()
    return photo_resp.json().get("photoUri")


def attach_photos(region: str, spots: list) -> list:
    """spots(각 항목에 'name' 키가 있는 dict 리스트)에 photo_url 필드를 추가해 반환한다.
    비짓서울 API로 먼저 검색하고, 결과가 없으면 Google Places로 폴백한다.
    사진 검색에 실패해도 전체 추천이 실패하지 않도록 개별 항목 단위로 예외를 흡수한다.
    """
    result = []
    for spot in spots:
        photo_url = None
        try:
            photo_url = find_visitseoul_photo_url(spot["name"])
        except requests.RequestException:
            photo_url = None
        if not photo_url:
            try:
                photo_url = find_photo_url(f"{region} {spot['name']}")
            except requests.RequestException:
                photo_url = None
        result.append({**spot, "photo_url": photo_url})
    return result
