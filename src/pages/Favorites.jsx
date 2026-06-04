import { useTranslation } from 'react-i18next'
import { favoriteDishes } from '../data'

export default function Favorites() {
  const { t } = useTranslation()

  return (
    <>
      <h1>{t('favorites.title')}</h1>
      <ul className="favorites-list">
        {favoriteDishes.map((dish) => (
          <li className="favorites-item" key={dish.rank}>
            <span className="favorites-rank">{dish.rank}</span>
            <div className="favorites-info">
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
