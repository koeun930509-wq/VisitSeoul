import { useEffect, useRef, useState } from 'react'
import SearchForm from './components/SearchForm'
import ResultView from './components/ResultView'
import Toolbar from './components/Toolbar'
import SeoulEvents from './components/SeoulEvents'
import { API_BASE } from './apiBase'
import { ALL_TAB } from './categories'
import { getStrings } from './i18n'
import './App.css'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTopBtn, setShowTopBtn] = useState(false)
  const [language, setLanguage] = useState('ko')
  const [presetRegion, setPresetRegion] = useState('')
  const [activeTab, setActiveTab] = useState(ALL_TAB)
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const t = getStrings(language)
  const resultRef = useRef(null)
  const searchSectionRef = useRef(null)

  useEffect(() => {
    function handleScroll() {
      setShowTopBtn(window.scrollY > 400)
      if (searchSectionRef.current) {
        const { bottom } = searchSectionRef.current.getBoundingClientRect()
        setShowSearchBar(!!result && bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [result])

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  async function handleSearch({ region: searchRegion, date, endDate }) {
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTab(ALL_TAB)
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: searchRegion, date, endDate, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.fetchError)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function scrollToSearchForm() {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app">
      {result && (
        <div className={`sticky-search-bar${showSearchBar ? ' is-visible' : ''}`}>
          <button type="button" className="sticky-search-summary" onClick={scrollToSearchForm}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.32 11.5 7.02 12.2a.68.68 0 0 0 .96 0c.7-.7 7.02-6.95 7.02-12.2C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
            </svg>
            <span className="sticky-search-text">
              {region} · {startDate}
            </span>
          </button>
          <button type="button" className="sticky-search-edit" onClick={scrollToSearchForm}>
            {t.editSearch}
          </button>
        </div>
      )}

      <header className="app-header">
        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </header>

      <div className="search-section" ref={searchSectionRef}>
        <Toolbar language={language} onLanguageChange={setLanguage} />
        <SearchForm
          region={region}
          onRegionChange={setRegion}
          startDate={startDate}
          onStartDateChange={setStartDate}
          onSubmit={handleSearch}
          loading={loading}
          presetRegion={presetRegion}
          onLocate={setPresetRegion}
          language={language}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {result && (
        <div ref={resultRef}>
          <ResultView result={result} activeTab={activeTab} onTabChange={setActiveTab} language={language} />
        </div>
      )}

      {result && activeTab === '축제/공연/행사' && <SeoulEvents language={language} />}

      <footer className="app-footer">
        <p>{t.footer}</p>
      </footer>

      {showTopBtn && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 12 10 7 15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default App
