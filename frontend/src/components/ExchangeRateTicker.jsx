import { useEffect, useState } from 'react'

// TODO: 실제 환율 API 연동 예정. 지금은 목업 데이터로 자리만 잡아둠.
const MOCK_RATES = [
  { code: 'JPY', label: '엔', flag: '🇯🇵', rate: 9.12 },
  { code: 'USD', label: '달러', flag: '🇺🇸', rate: 1385.4 },
  { code: 'CNY', label: '위안', flag: '🇨🇳', rate: 191.7 },
]

const ROTATE_INTERVAL_MS = 3000

export default function ExchangeRateTicker() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MOCK_RATES.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const current = MOCK_RATES[index]

  return (
    <div className="exchange-rate-ticker" aria-live="polite">
      <span className="exchange-rate-badge">환율</span>
      <span className="exchange-rate-flag">{current.flag}</span>
      <span className="exchange-rate-text">
        1 {current.code} = {current.rate.toLocaleString('ko-KR')}원
      </span>
    </div>
  )
}
