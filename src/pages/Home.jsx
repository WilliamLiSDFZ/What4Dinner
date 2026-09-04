import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { suggestions, initialDishes } from '../data'
import DishCover from '../components/DishCover'

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <SearchBar />
      <section className="guess-you-like">
        <h2>{t('home.guessYouLike')}</h2>
        <div className="guess-grid">
          {suggestions.map((item) => (
            <div className="guess-card" key={item.category}>
              <span className="guess-card-category">{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
        <button className="guess-refresh" onClick={() => {}}><i className="bi-arrow-clockwise" /> {t('home.refresh')}</button>
      </section>
      <h1>{t('home.topChoice')}</h1>
      <div className="menu-grid">
        {initialDishes.map((dish) => (
          <div className="dish-card" key={dish.id}>
            {/* Seed data from data.js carries no images, so these are always the
                placeholder — this page is still presentational. */}
            <DishCover className="dish-cover" />
            <h3>{dish.name}</h3>
            <p>{dish.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
