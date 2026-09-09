import { useState } from 'react'
import { API_BASE } from '../apiBase'

async function reverseGeocode(latitude, longitude) {
  const res = await fetch(`${API_BASE}/api/reverse-geocode?lat=${latitude}&lon=${longitude}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '주소를 불러오지 못했습니다.')
  return data.address
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
        try {
          const place = await reverseGeocode(latitude, longitude)
          onLocate?.(place)
          setActive(true)
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
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
