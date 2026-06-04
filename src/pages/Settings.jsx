import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from '../ThemeContext'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

export default function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)
  const { t, i18n } = useTranslation()

  return (
    <>
      <h1>{t('settings.title')}</h1>
      <section className="settings-section">
        <h2>{t('settings.appearance')}</h2>
        <div className="theme-toggle">
          {['system', 'light', 'dark'].map((opt) => (
            <button
              key={opt}
              className={theme === opt ? 'active' : ''}
              onClick={() => setTheme(opt)}
            >
              <i className={opt === 'system' ? 'bi-display' : opt === 'light' ? 'bi-sun' : 'bi-moon'} />
              {' '}{t(`theme.${opt}`)}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h2>{t('settings.language')}</h2>
        <div className="theme-toggle">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={i18n.language === lang.code ? 'active' : ''}
              onClick={() => i18n.changeLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
