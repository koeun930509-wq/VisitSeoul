import { useEffect, useMemo, useState } from 'react'

const POPULAR_REGIONS = ['서울', '부산', '제주도', '강릉', '전주', '경주', '여수', '속초']
const MAX_FORECAST_DAYS = 16
const MAX_TRIP_NIGHTS = 6
const INTERESTS = ['문화관광', '쇼핑', '숙박', '역사관광', '음식', '자연관광', '체험관광', '축제/공연/행사']

function toDateInputValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateInputValue(d)
}

export default function SearchForm({ onSubmit, loading, presetRegion }) {
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [nights, setNights] = useState(0)
  const [showRegionList, setShowRegionList] = useState(false)
  const [regionReadOnly, setRegionReadOnly] = useState(true)
  const [interests, setInterests] = useState([])

  useEffect(() => {
    if (presetRegion) setRegion(presetRegion)
  }, [presetRegion])

  const { min, max } = useMemo(() => {
    const today = new Date()
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + MAX_FORECAST_DAYS - 1)
    return { min: toDateInputValue(today), max: toDateInputValue(maxDate) }
  }, [])

  const maxNights = useMemo(() => {
    if (!startDate) return MAX_TRIP_NIGHTS
    const daysLeft = Math.round((new Date(max) - new Date(startDate)) / 86400000)
    return Math.max(0, Math.min(MAX_TRIP_NIGHTS, daysLeft))
  }, [startDate, max])

  const endDate = startDate ? addDays(startDate, nights) : ''

  function handleSubmit(e) {
    e?.preventDefault?.()
    if (!region.trim() || !startDate) return
    onSubmit({ region: region.trim(), date: startDate, endDate })
  }

  function toggleInterest(interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  function handleRegionKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowRegionList(false)
      document.getElementById('date')?.focus()
    }
  }

  return (
    <div className="search-form">
      <div className="field region-field">
        <label htmlFor="region">가고 싶은 지역</label>
        <div className="input-arrow-wrap">
          <input
            id="region"
            name="trip-region"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            readOnly={regionReadOnly}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onMouseDown={() => setRegionReadOnly(false)}
            onFocus={(e) => {
              setRegionReadOnly(false)
              setShowRegionList(true)
              e.target.readOnly = false
            }}
            onBlur={() => {
              setRegionReadOnly(true)
              setTimeout(() => setShowRegionList(false), 100)
            }}
            onKeyDown={handleRegionKeyDown}
            placeholder="예: 제주도, 부산 해운대"
            required
          />
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {showRegionList && (
          <ul className="region-suggestions">
            {POPULAR_REGIONS.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setRegion(r)
                    setShowRegionList(false)
                  }}
                >
                  {r}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        <label htmlFor="date">출발 날짜</label>
        <div className="input-arrow-wrap">
          <input
            id="date"
            type="date"
            className="date-input"
            value={startDate}
            min={min}
            max={max}
            onChange={(e) => {
              const value = e.target.value
              setStartDate(value)
              setNights((prev) => {
                const daysLeft = Math.round((new Date(max) - new Date(value)) / 86400000)
                return Math.max(0, Math.min(prev, MAX_TRIP_NIGHTS, daysLeft))
              })
            }}
            required
          />
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="field">
        <label htmlFor="nights">일정</label>
        <div className="input-arrow-wrap">
          <select
            id="nights"
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
          >
            {Array.from({ length: maxNights + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n === 0 ? '당일치기' : `${n}박 ${n + 1}일`}
              </option>
            ))}
          </select>
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="hint hint-right">
          {startDate ? (
            <>
              {startDate} ~ {endDate}
              <br />
              오늘부터 {MAX_FORECAST_DAYS}일 이내 날짜만 선택 가능
            </>
          ) : (
            `오늘부터 ${MAX_FORECAST_DAYS}일 이내 날짜만 선택 가능`
          )}
        </p>
      </div>

      <div className="field">
        <label>주요 관심사</label>
        <div className="interest-grid">
          {INTERESTS.map((interest) => (
            <label key={interest} className="interest-chip">
              <input
                type="checkbox"
                checked={interests.includes(interest)}
                onChange={() => toggleInterest(interest)}
              />
              <span>{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <button type="button" disabled={loading} onClick={handleSubmit}>
        {loading ? '추천 찾는 중…' : '추천 받기'}
      </button>
    </div>
  )
}
