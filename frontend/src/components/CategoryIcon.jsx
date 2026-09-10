const ICONS = {
  전체: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  문화관광: (
    <>
      <path d="M4 21h16" />
      <path d="M5 21V10.5L12 5l7 5.5V21" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  쇼핑: (
    <>
      <rect x="5" y="8" width="14" height="13" rx="3" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </>
  ),
  숙박: (
    <>
      <path d="M4 4v16" />
      <path d="M4 17h17v3" />
      <path d="M4 9h9a2 2 0 0 1 2 2v3H4" />
      <circle cx="7.5" cy="6.5" r="1.5" />
    </>
  ),
  역사관광: (
    <>
      <path d="M4 8 12 3l8 5" />
      <path d="M4 8h16" />
      <path d="M6 11v8" />
      <path d="M10 11v8" />
      <path d="M14 11v8" />
      <path d="M18 11v8" />
      <path d="M4 21h16" />
    </>
  ),
  음식: (
    <>
      <path d="M8 3v6a2 2 0 0 0 2 2v10" />
      <path d="M8 3v6" />
      <path d="M11 3v6" />
      <path d="M17 3c-1.7 0-3 2.2-3 5s1.3 5 3 5v8" />
    </>
  ),
  자연관광: (
    <>
      <path d="M12 3 6 14h4l-3 7 12-10h-5l4-8Z" />
    </>
  ),
  체험관광: (
    <>
      <path d="M9 8a3 3 0 1 1 6 0c0 2-3 2.5-3 5.5" />
      <path d="M12 17v.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  '축제/공연/행사': (
    <>
      <path d="M5 21 6.5 12h11L19 21Z" />
      <path d="M8 12 9 6h6l1 6" />
      <path d="M10 6l.5-3h3l.5 3" />
    </>
  ),
}

export default function CategoryIcon({ category, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[category]}
    </svg>
  )
}
