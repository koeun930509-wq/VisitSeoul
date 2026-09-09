import { useEffect, useRef, useState } from 'react'

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export default function LanguageSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = LANGUAGES.find((lang) => lang.code === value) ?? LANGUAGES[0]

  return (
    <div className="language-select-wrap" ref={wrapRef}>
      <button
        type="button"
        className="language-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {current.label}
        <svg className="language-select-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="language-options" role="listbox">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                role="option"
                aria-selected={lang.code === value}
                className={lang.code === value ? 'is-selected' : ''}
                onClick={() => {
                  onChange?.(lang.code)
                  setOpen(false)
                }}
              >
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
