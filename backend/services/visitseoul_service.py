import os

import requests

CONTENTS_LIST_URL = "https://api-call.visitseoul.net/api/v1/contents/list"

# 비짓서울 콘텐츠는 키워드 검색이 lang_code_id와 같은 언어의 텍스트끼리만 매칭되므로,
# 언어별로 번역이 고정된 최상위 카테고리(cate_depth) 접두어로 필터링한다.
FESTIVAL_CATEGORY_PREFIX = {
    "ko": "축제/공연/행사",
    "en": "Festivals/Events/Performances",
    "ja": "祭り／公演／イベント",
    "zh-CN": "庆典/公演/活动",
}


def get_contents(keyword: str = "", lang_code_id: str = "ko", page_no: int = 1) -> dict:
    """비짓서울 API로 서울 관광 콘텐츠(명소/맛집/축제 등) 목록을 조회한다."""
    api_key = os.environ["VISIT_SEOUL_API_KEY"]
    headers = {
        "Accept": "application/json;charset=UTF-8",
        "Content-Type": "application/json;charset=UTF-8",
        "VISITSEOUL-API-KEY": api_key,
    }
    body = {"lang_code_id": lang_code_id, "sort_type": "latest", "page_no": str(page_no)}
    if keyword:
        body["keyword"] = keyword

    resp = requests.post(CONTENTS_LIST_URL, headers=headers, json=body, timeout=5)
    resp.raise_for_status()
    return resp.json()


def get_festival_contents(lang_code_id: str = "ko", page_no: int = 1) -> dict:
    """언어에 상관없이 "축제/공연/행사" 카테고리 콘텐츠만 조회한다.

    키워드 검색은 lang_code_id와 다른 언어의 키워드로는 매칭되지 않으므로,
    키워드 없이 전체 목록을 받아 cate_depth 접두어로 걸러낸다.
    """
    result = get_contents(keyword="", lang_code_id=lang_code_id, page_no=page_no)
    if result.get("result_code") != 200:
        return result

    prefix = FESTIVAL_CATEGORY_PREFIX.get(lang_code_id, FESTIVAL_CATEGORY_PREFIX["ko"])
    items = [item for item in result.get("data", []) if (item.get("cate_depth") or "").strip().startswith(prefix)]
    return {**result, "data": items}
