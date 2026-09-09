import os

import requests

CONTENTS_LIST_URL = "https://api-call.visitseoul.net/api/v1/contents/list"


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
