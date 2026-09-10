import { useEffect, useMemo, useState } from 'react'
import { SEOUL_DISTRICTS, SEOUL_DISTRICT_AREAS, isSeoulRegion } from '../seoulDistricts'
import LocationToggle from './LocationToggle'

const MAX_FORECAST_DAYS = 16
const INTERESTS = ['문화관광', '쇼핑', '숙박', '역사관광', '음식', '자연관광', '체험관광', '축제/공연/행사']

function toDateInputValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function SearchForm({ onSubmit, loading, presetRegion, interests, onInterestsChange, onLocate }) {
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [showRegionList, setShowRegionList] = useState(false)
  const [regionReadOnly, setRegionReadOnly] = useState(true)

  useEffect(() => {
    if (presetRegion) setRegion(presetRegion)
  }, [presetRegion])

  const { min, max } = useMemo(() => {
    const today = new Date()
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + MAX_FORECAST_DAYS - 1)
    return { min: toDateInputValue(today), max: toDateInputValue(maxDate) }
  }, [])

  function handleSubmit(e) {
    e?.preventDefault?.()
    if (!region.trim() || !startDate) return
    if (!isSeoulRegion(region)) {
      window.alert('서울 이외에 지역은 입력되지 않습니다')
      return
    }
    onSubmit({ region: region.trim(), date: startDate, endDate: startDate })
  }

  function toggleInterest(interest) {
    onInterestsChange(
      interests.includes(interest)
        ? interests.filter((i) => i !== interest)
        : [...interests, interest]
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
        <div className="field-label-row">
          <label htmlFor="region">어느 동네로 갈까요?</label>
          <LocationToggle onLocate={onLocate} />
        </div>
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
            placeholder="예: 강남구, 마포구"
            required
          />
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {showRegionList && (
          <ul className="region-suggestions">
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setRegion('서울')
                  setShowRegionList(false)
                }}
              >
                전체
              </button>
            </li>
            {SEOUL_DISTRICTS.map((r) => (
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
                  <span className="region-suggestion-areas">
                    {' '}
                    / {SEOUL_DISTRICT_AREAS[r].join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="date">언제 갈까요?</label>
          <span className="hint">오늘부터 {MAX_FORECAST_DAYS}일 이내 날짜만 선택 가능</span>
        </div>
        <div className="input-arrow-wrap">
          <input
            id="date"
            type="date"
            className="date-input"
            value={startDate}
            min={min}
            max={max}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
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
