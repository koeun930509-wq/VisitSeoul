import { useEffect, useState } from 'react'
import SearchForm from './components/SearchForm'
import ResultView from './components/ResultView'
import Toolbar from './components/Toolbar'
import SeoulEvents from './components/SeoulEvents'
import { API_BASE } from './apiBase'
import { ALL_TAB } from './categories'
import './App.css'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTopBtn, setShowTopBtn] = useState(false)
  const [language, setLanguage] = useState('ko')
  const [presetRegion, setPresetRegion] = useState('')
  const [activeTab, setActiveTab] = useState(ALL_TAB)

  useEffect(() => {
    function handleScroll() {
      setShowTopBtn(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleSearch({ region, date, endDate }) {
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTab(ALL_TAB)
    try {
      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region, date, endDate, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '추천을 불러오지 못했습니다.')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>VividSoul</h1>
        <p>지역과 날짜를 선택하면 날씨에 맞는 숨은 명소·맛집을 추천해드려요.</p>
      </header>

      <div className="search-section">
        <Toolbar language={language} onLanguageChange={setLanguage} />
        <SearchForm
          onSubmit={handleSearch}
          loading={loading}
          presetRegion={presetRegion}
          onLocate={setPresetRegion}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {result && <ResultView result={result} activeTab={activeTab} onTabChange={setActiveTab} />}

      {result && activeTab === '축제/공연/행사' && <SeoulEvents language={language} />}

      <footer className="app-footer">
        <p>Copyright(c) VividSoul. All rights reserved.</p>
      </footer>

      {showTopBtn && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="맨 위로 이동"
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
