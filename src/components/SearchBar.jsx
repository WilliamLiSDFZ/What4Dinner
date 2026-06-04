import { useTranslation } from 'react-i18next'

export default function SearchBar() {
  const { t } = useTranslation()

  return (
    <div className="search-wrapper">
      <i className="bi-search" />
      <input
        className="search-bar"
        type="text"
        placeholder={t('search.placeholder')}
      />
    </div>
  )
}
