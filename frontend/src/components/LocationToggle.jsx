import { useState } from 'react'

// TODO: 실제 서비스에서는 정식 역지오코딩 API(카카오맵 등)로 교체 예정.
async function reverseGeocodeMock(latitude, longitude) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return `현재 위치 (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
}

export default function LocationToggle({ onLocate }) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleToggle() {
    if (active) {
      setActive(false)
      setError(null)
      return
    }

    if (!navigator.geolocation) {
      setError('위치 정보를 사용할 수 없어요.')
      return
    }

    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const place = await reverseGeocodeMock(latitude, longitude)
        onLocate?.(place)
        setActive(true)
        setLoading(false)
      },
      () => {
        setError('위치 권한을 허용해주세요.')
        setLoading(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  return (
    <div className="location-toggle-wrap">
      <button
        type="button"
        className={`location-toggle${active ? ' is-active' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={active}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2.5c-2.9 0-5.25 2.3-5.25 5.15C4.75 11.5 10 17.5 10 17.5s5.25-6 5.25-9.85C15.25 4.8 12.9 2.5 10 2.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="7.7" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {loading ? '위치 확인 중…' : '현위치'}
      </button>
      {error && <p className="location-error">{error}</p>}
    </div>
  )
}
