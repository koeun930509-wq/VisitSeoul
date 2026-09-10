import { useEffect, useMemo, useState } from 'react'
import { SEOUL_DISTRICTS, SEOUL_DISTRICT_AREAS, isSeoulRegion } from '../seoulDistricts'
import { getStrings } from '../i18n'
import LocationToggle from './LocationToggle'

const MAX_FORECAST_DAYS = 16

function toDateInputValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function SearchForm({ onSubmit, loading, presetRegion, onLocate, language = 'ko' }) {
  const t = getStrings(language)
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
      window.alert(t.seoulOnlyAlert)
      return
    }
    onSubmit({ region: region.trim(), date: startDate, endDate: startDate })
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
          <label htmlFor="region">{t.regionLabel}</label>
          <LocationToggle onLocate={onLocate} language={language} />
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
            placeholder={t.regionPlaceholder}
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
                {t.regionAllOption}
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
          <label htmlFor="date">{t.dateLabel}</label>
          <span className="hint">{t.dateHint(MAX_FORECAST_DAYS)}</span>
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

      <button type="button" disabled={loading} onClick={handleSubmit}>
        {loading ? t.submitLoading : t.submitIdle}
      </button>
    </div>
  )
}
