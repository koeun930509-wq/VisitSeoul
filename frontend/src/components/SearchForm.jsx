import { useEffect, useMemo, useState } from 'react'
import { SEOUL_DISTRICTS, SEOUL_DISTRICT_AREAS, isSeoulRegion } from '../seoulDistricts'
import { getDistrictLabel, getAreaLabel } from '../seoulDistrictsI18n'
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
  const [showRegionSheet, setShowRegionSheet] = useState(false)

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

  function isRegionSelected(r) {
    return region === '서울' ? false : region.startsWith(r)
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
            type="text"
            autoComplete="off"
            readOnly
            value={region}
            onClick={() => setShowRegionSheet(true)}
            placeholder={t.regionPlaceholder}
            required
          />
          <button
            type="button"
            className="field-arrow-btn"
            aria-label={t.regionLabel}
            onClick={() => setShowRegionSheet(true)}
          >
            <svg className="field-arrow-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {showRegionSheet && (
        <div className="region-sheet-overlay" onClick={() => setShowRegionSheet(false)}>
          <div className="region-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="region-sheet-header">
              <span>{t.regionSheetTitle}</span>
              <button type="button" className="region-sheet-close" onClick={() => setShowRegionSheet(false)}>
                {t.regionSheetClose}
              </button>
            </div>
            <ul className="region-sheet-list">
              <li>
                <button
                  type="button"
                  className="region-sheet-option"
                  onClick={() => {
                    setRegion('서울')
                    setShowRegionSheet(false)
                  }}
                >
                  <span className={`region-radio${region === '서울' ? ' checked' : ''}`} aria-hidden="true" />
                  {t.regionAllOption}
                </button>
              </li>
              {SEOUL_DISTRICTS.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    className="region-sheet-option"
                    onClick={() => {
                      setRegion(`${r}(${SEOUL_DISTRICT_AREAS[r].join(', ')})`)
                      setShowRegionSheet(false)
                    }}
                  >
                    <span className={`region-radio${isRegionSelected(r) ? ' checked' : ''}`} aria-hidden="true" />
                    <span>
                      {getDistrictLabel(language, r)}
                      <span className="region-suggestion-areas">
                        {' '}
                        / {SEOUL_DISTRICT_AREAS[r].map((area) => getAreaLabel(language, area)).join(', ')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="field">
        <div className="field-label-row">
          <label htmlFor="date">{t.dateLabel}</label>
          <span className="hint">
            {t.dateHint(MAX_FORECAST_DAYS).split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </span>
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
