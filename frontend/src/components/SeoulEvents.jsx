import { useEffect, useState } from 'react'
import { API_BASE } from '../apiBase'
import VisitSeoulBadge from './VisitSeoulBadge'

const VISITSEOUL_LANG_CODES = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN' }

const TITLES = {
  ko: '지금 서울의 축제·행사',
  en: "Seoul's Festivals & Events",
  ja: 'ソウルの祭り・イベント',
  zh: '首尔的节庆活动',
}

export default function SeoulEvents({ language = 'ko' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const langCode = VISITSEOUL_LANG_CODES[language] || 'ko'
        const res = await fetch(`${API_BASE}/api/seoul-contents?keyword=축제&lang=${langCode}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || '행사 정보를 불러오지 못했습니다.')
        if (!cancelled) setItems(data.data || [])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [language])

  if (loading || error || items.length === 0) return null

  return (
    <section className="rec-section seoul-events">
      <h3>{TITLES[language] || TITLES.ko}</h3>
      <div className="card-grid">
        {items.slice(0, 10).map((item) => (
          <article className="rec-card" key={item.cid}>
            {item.main_img && (
              <img className="rec-card-photo" src={item.main_img} alt={item.post_sj} loading="lazy" />
            )}
            <div className="rec-card-body">
              <div className="rec-card-badge">
                <VisitSeoulBadge />
              </div>
              <h4>{item.post_sj}</h4>
              <p>{item.sumry}</p>
            </div>
            <a className="map-link" href="https://visitseoul.net" target="_blank" rel="noreferrer">
              자세히 보기 ↗
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}
