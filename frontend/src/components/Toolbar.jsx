import ExchangeRateTicker from './ExchangeRateTicker'
import LocationToggle from './LocationToggle'
import LanguageSelect from './LanguageSelect'

export default function Toolbar({ language, onLanguageChange, onLocate }) {
  return (
    <div className="toolbar">
      <ExchangeRateTicker />
      <div className="toolbar-actions">
        <LocationToggle onLocate={onLocate} />
        <LanguageSelect value={language} onChange={onLanguageChange} />
      </div>
    </div>
  )
}
