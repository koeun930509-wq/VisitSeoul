import { useEffect, useState } from 'react'
import { API_BASE } from '../apiBase'

const VISITSEOUL_LANG_CODES = { ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN' }
const DETAIL_URL_TEMPLATE = 'https://korean.visitseoul.net/attractions/detail/{cid}'

function detailUrl(cid) {
  return DETAIL_URL_TEMPLATE.replace('{cid}', cid)
}

export default function SeoulEvents({ language = 'ko', keyword, title, moreLink, fetchError }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const langCode = VISITSEOUL_LANG_CODES[language] || 'ko'
        const res = await fetch(`${API_BASE}/api/seoul-contents?keyword=${keyword}&lang=${langCode}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || fetchError)
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
  }, [language, keyword, fetchError])

  if (loading || error || items.length === 0) return null

  return (
    <section className="rec-section seoul-events">
      <h3>{title}</h3>
      <div className="card-grid">
        {items.slice(0, 10).map((item) => (
          <article className="rec-card" key={item.cid}>
            {item.main_img && (
              <img className="rec-card-photo" src={item.main_img} alt={item.post_sj} loading="lazy" />
            )}
            <div className="rec-card-body">
              <h4>{item.post_sj}</h4>
              <p>{item.sumry}</p>
            </div>
            <div className="rec-card-links">
              <a className="map-link" href={detailUrl(item.cid)} target="_blank" rel="noreferrer">
                {moreLink}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
