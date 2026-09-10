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

# 비짓서울 "축제/공연/행사" 카테고리에는 위치 필드가 없어 서울 외 지역 축제도 섞여 나온다.
# 제목·요약에 타 지역 지명이 포함되면 서울 축제가 아닌 것으로 보고 걸러낸다(언어별 표기 포함).
NON_SEOUL_LOCATION_KEYWORDS = [
    # 한국어
    "구미", "강릉", "정선", "통영", "부산", "울산", "경남", "안동", "진도", "명량", "여수",
    "대구", "대전", "광주", "인천", "수원", "전주", "경주", "제주", "춘천", "속초", "포항",
    "창원", "청주", "천안", "김해", "고양", "성남", "부천", "안산", "용인", "평택",
    # 영어
    "Gumi", "Gangneung", "Jeongseon", "Tongyeong", "Busan", "Ulsan", "Gyeongnam",
    "Andong", "Jindo", "Myeongnyang", "Yeosu", "Daegu", "Daejeon", "Gwangju", "Incheon",
    "Suwon", "Jeonju", "Gyeongju", "Jeju", "Chuncheon", "Sokcho", "Pohang", "Changwon",
    "Cheongju", "Cheonan", "Gimhae", "Goyang", "Seongnam", "Bucheon", "Ansan", "Yongin", "Pyeongtaek",
    # 일본어
    "亀尾", "江陵", "旌善", "統営", "釜山", "蔚山", "慶南", "安東", "珍島", "麗水",
    "大邱", "大田", "光州", "仁川", "水原", "全州", "慶州", "済州", "春川", "束草", "浦項",
    # 중국어
    "龟尾", "江陵", "旌善", "统营", "釜山", "蔚山", "庆南", "安东", "珍岛", "丽水",
    "大邱", "大田", "光州", "仁川", "水原", "全州", "庆州", "济州", "春川", "束草", "浦项",
]


def _is_seoul_content(item: dict) -> bool:
    text = f"{item.get('post_sj', '')} {item.get('sumry', '')}"
    return not any(keyword in text for keyword in NON_SEOUL_LOCATION_KEYWORDS)


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
    items = [
        item
        for item in result.get("data", [])
        if (item.get("cate_depth") or "").strip().startswith(prefix) and _is_seoul_content(item)
    ]
    return {**result, "data": items}
