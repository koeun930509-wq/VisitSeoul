import threading
import time
from typing import Callable, TypeVar

T = TypeVar("T")

_lock = threading.Lock()
_store: dict[str, tuple[float, object]] = {}


def cached(key: str, ttl_seconds: float, compute: Callable[[], T]) -> T:
    """key에 대한 값을 캐시에서 반환하거나, 없거나 만료됐으면 compute()를 호출해 채운다.

    프로세스 메모리 내 캐시이므로 여러 워커 프로세스로 배포하면 워커마다 별도로 채워진다.
    """
    now = time.time()
    with _lock:
        cached_entry = _store.get(key)
        if cached_entry is not None and cached_entry[0] > now:
            return cached_entry[1]

    value = compute()

    with _lock:
        _store[key] = (now + ttl_seconds, value)
    return value
