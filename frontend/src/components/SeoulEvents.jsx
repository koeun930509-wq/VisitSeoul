import { useEffect, useState } from 'react'
import { API_BASE } from '../apiBase'

export default function SeoulEvents() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/seoul-contents?keyword=축제`)
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
  }, [])

  if (loading || error || items.length === 0) return null

  return (
    <section className="seoul-events">
      <h2>지금 서울의 축제·행사</h2>
      <div className="seoul-events-scroll">
        {items.slice(0, 10).map((item) => (
          <a
            key={item.cid}
            className="seoul-event-card"
            href={`https://visitseoul.net`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="seoul-event-thumb">
              <img src={item.main_img} alt="" loading="lazy" />
            </div>
            <p className="seoul-event-title">{item.post_sj}</p>
            <p className="seoul-event-desc">{item.sumry}</p>
          </a>
        ))}
      </div>
    </section>
  )
}
