export default function VisitSeoulBadge() {
  return (
    <span className="visitseoul-badge">
      <svg className="visitseoul-badge-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 2 3 6.2v1.6h14V6.2L10 2Z"
          fill="currentColor"
        />
        <path
          d="M4.5 8.6v6.4M7.4 8.6v6.4M10 8.6v6.4M12.6 8.6v6.4M15.5 8.6v6.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="M3.2 16.4h13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="visitseoul-badge-text">비짓서울 공식</span>
    </span>
  )
}
