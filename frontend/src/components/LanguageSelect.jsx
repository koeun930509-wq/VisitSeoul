const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export default function LanguageSelect({ value, onChange }) {
  return (
    <div className="language-select-wrap">
      <select
        className="language-select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="언어 선택"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
