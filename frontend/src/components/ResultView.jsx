import WeatherIcon from './WeatherIcon'
import StatIcon from './StatIcon'
import aiSparkleIcon from '../assets/ai-sparkle.png'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function kakaoMapSearchUrl(region, name) {
  return `https://map.kakao.com/link/search/${encodeURIComponent(`${region} ${name}`)}`
}

function formatDateWithWeekday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const formatted = dateStr.replace(/-/g, '.')
  return `${formatted} (${WEEKDAYS[d.getDay()]})`
}

export default function ResultView({ result }) {
  const { region, weather, weather_by_day: weatherByDay, recommendation } = result
  const tripDays = weatherByDay && weatherByDay.length > 1 ? weatherByDay : null

  return (
    <div className="result">
      <section className="weather-card">
        <div className="weather-heading">
          <svg className="weather-pin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 6.32 11.5 7.02 12.2a.68.68 0 0 0 .96 0c.7-.7 7.02-6.95 7.02-12.2C19.5 5.36 16.14 2 12 2Zm0 10.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
          </svg>
          <span className="weather-region">{region}</span>
          <span className="weather-daterange">
            {formatDateWithWeekday(weather.date)}
            {tripDays ? ` ~ ${formatDateWithWeekday(tripDays[tripDays.length - 1].date)}` : ''}
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
                <StatIcon type="umbrella" className="weather-stat-icon" /> 강수확률
              </span>
              <span className="weather-stat-value">{weather.pop}%</span>
            </div>
            {weather.windspeed != null && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="wind" className="weather-stat-icon" /> 풍속
                </span>
                <span className="weather-stat-value">{weather.windspeed}m/s</span>
              </div>
            )}
            {weather.humidity != null && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="drop" className="weather-stat-icon" /> 습도
                </span>
                <span className="weather-stat-value">{weather.humidity}%</span>
              </div>
            )}
            {weather.travel_index && (
              <div className="weather-stat">
                <span className="weather-stat-label">
                  <StatIcon type="smile" className="weather-stat-icon" /> 여행지수
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
                    <span className="daily-forecast-temp-pop">강수확률 {day.pop}%</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="hint">아래 추천은 첫째 날({weather.date}) 날씨를 기준으로 생성됐어요.</p>
          </>
        )}
      </section>

      {Object.entries(recommendation.categories).map(([category, { section_title: sectionTitle, items }]) => (
        <section className="rec-section" key={category}>
          <h3>{sectionTitle || category}</h3>
          <div className="card-grid">
            {items.map((item) => (
              <article className="rec-card" key={item.name}>
                {item.photo_url && (
                  <img className="rec-card-photo" src={item.photo_url} alt={item.name} loading="lazy" />
                )}
                <div className="rec-card-body">
                  <h4>{item.name}</h4>
                  <p>{item.menu || item.description}</p>
                  <p className="why">{item.why_this_weather}</p>
                </div>
                <a
                  className="map-link"
                  href={kakaoMapSearchUrl(region, item.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  지도에서 보기 ↗
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
