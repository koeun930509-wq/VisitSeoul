import { useState } from 'react'
import WeatherIcon from './WeatherIcon'
import StatIcon from './StatIcon'
import CategoryIcon from './CategoryIcon'
import aiSparkleIcon from '../assets/ai-sparkle.png'
import { CATEGORIES, ALL_TAB } from '../categories'
import { getStrings, getCategoryLabel, getWeekdays } from '../i18n'

const TABS = [ALL_TAB, ...CATEGORIES]
const PREVIEW_SIZE = 3
const PAGE_SIZE = 6

function googleMapSearchUrl(region, name) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${region} ${name}`)}`
}

function formatDateWithWeekday(dateStr, language) {
  const d = new Date(`${dateStr}T00:00:00`)
  const formatted = dateStr.replace(/-/g, '.')
  return `${formatted} (${getWeekdays(language)[d.getDay()]})`
}

function RecommendationCard({ region, item, t }) {
  return (
    <article className="rec-card">
      {item.photo_url && (
        <img className="rec-card-photo" src={item.photo_url} alt={item.name} loading="lazy" />
      )}
      <div className="rec-card-body">
        <h4>{item.name}</h4>
        <p>{item.menu || item.description}</p>
        <p className="why">{item.why_this_weather}</p>
      </div>
      <div className="rec-card-links">
        {item.detail_url ? (
          <a className="map-link" href={item.detail_url} target="_blank" rel="noreferrer">
            {t.detailLink}
          </a>
        ) : (
          <a
            className="map-link"
            href={googleMapSearchUrl(region, item.name)}
            target="_blank"
            rel="noreferrer"
          >
            {t.mapLink}
          </a>
        )}
      </div>
    </article>
  )
}

function RecommendationSection({ title, region, items, isPreview, t }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visibleItems = isPreview ? items.slice(0, PREVIEW_SIZE) : items.slice(0, visibleCount)
  const hasMore = !isPreview && visibleCount < items.length

  return (
    <section className="rec-section">
      <h3>{title}</h3>
      <div className="card-grid">
        {visibleItems.map((item) => (
          <RecommendationCard key={item.name} region={region} item={item} t={t} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
        >
          {t.loadMore}
        </button>
      )}
    </section>
  )
}

export default function ResultView({ result, activeTab, onTabChange, language = 'ko' }) {
  const t = getStrings(language)
  const { region, weather, weather_by_day: weatherByDay, recommendation } = result
  const tripDays = weatherByDay && weatherByDay.length > 1 ? weatherByDay : null
  const categoryEntries = Object.entries(recommendation.categories).filter(
    ([category]) => activeTab === ALL_TAB || category === activeTab
  )

  return (
    <div className="result">
      <section className="weather-card">
        <div className="weather-heading">
          <svg className="weather-pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.32 11.5 7.02 12.2a.68.68 0 0 0 .96 0c.7-.7 7.02-6.95 7.02-12.2C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
          </svg>
          <span className="weather-region">{region}</span>
          <span className="weather-daterange">
            {formatDateWithWeekday(weather.date, language)}
            {tripDays ? ` ~ ${formatDateWithWeekday(tripDays[tripDays.length - 1].date, language)}` : ''}
          </span>
        </div>

        <div className="weather-top">
          <div className="weather-main">
            <div className="weather-main-icon">
              <WeatherIcon condition={weather.condition} date={weather.date} />
            </div>
            <div className="weather-main-info">
              <p className="weather-temp">
                {weather.temp_min}° ~ {weather.temp_max}°
              </p>
              <p className="weather-condition">{weather.condition}</p>
            </div>
          </div>

          <div className="weather-stats">
            <div className="weather-stat">
              <span className="weather-stat-label">
                <StatIcon type="umbrella" className="weather-stat-icon" /> {t.precipitation}
              </span>
              <span className="weather-stat-value">{weather.pop}%</span>
            </div>
            {weather.windspeed != null && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="wind" className="weather-stat-icon" /> {t.windspeed}
                </span>
                <span className="weather-stat-value">{weather.windspeed}m/s</span>
              </div>
            )}
            {weather.humidity != null && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="drop" className="weather-stat-icon" /> {t.humidity}
                </span>
                <span className="weather-stat-value">{weather.humidity}%</span>
              </div>
            )}
            {weather.travel_index && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="smile" className="weather-stat-icon" /> {t.travelIndex}
                </span>
                <span className="weather-stat-value">{weather.travel_index}</span>
              </div>
            )}
          </div>
        </div>

        {recommendation.weather_desc && (
          <div className="weather-summary-box">
            <span className="weather-summary-icon">
              <img src={aiSparkleIcon} alt="" />
            </span>
            <p className="weather-summary">
              {recommendation.weather_desc}
              <br />
              {recommendation.spot_reason}
            </p>
          </div>
        )}

        {tripDays && (
          <>
            <div className="daily-forecast">
              {tripDays.map((day) => (
                <div className="daily-forecast-item" key={day.date}>
                  <p className="daily-forecast-date">{day.date}</p>
                  <div className="daily-forecast-icon">
                    <WeatherIcon condition={day.condition} date={day.date} />
                  </div>
                  <p className="daily-forecast-condition">{day.condition}</p>
                  <p className="daily-forecast-temp">
                    <span className="daily-forecast-temp-range">
                      {day.temp_min}° ~ {day.temp_max}°C
                    </span>
                    <span className="daily-forecast-temp-pop">{t.precipitation} {day.pop}%</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="hint">{t.weatherForecastNote(weather.date)}</p>
          </>
        )}
      </section>

      {recommendation.weather_picks && recommendation.weather_picks.length > 0 && (
        <RecommendationSection
          title={t.weatherPicksTitle}
          region={region}
          items={recommendation.weather_picks}
          t={t}
        />
      )}

      <div className="category-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`category-tab${activeTab === tab ? ' is-active' : ''}`}
            onClick={() => onTabChange(tab)}
            aria-pressed={activeTab === tab}
          >
            <CategoryIcon category={tab} className="category-tab-icon" />
            {getCategoryLabel(language, tab)}
          </button>
        ))}
      </div>

      {categoryEntries.map(([category, { section_title: sectionTitle, items }]) => (
        <RecommendationSection
          key={category}
          title={sectionTitle || getCategoryLabel(language, category)}
          region={region}
          items={items}
          isPreview={activeTab === ALL_TAB}
          t={t}
        />
      ))}
    </div>
  )
}
