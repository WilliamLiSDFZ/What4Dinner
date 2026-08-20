import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from '../ThemeContext'
import { UserContext } from '../UserContext'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

export default function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)
  const { user, loading, error } = useContext(UserContext)
  const { t, i18n } = useTranslation()

  return (
    <>
      <h1>{t('settings.title')}</h1>
      <section className="settings-section">
        <h2>{t('settings.account')}</h2>
        {loading && <p className="menu-status">{t('settings.loading')}</p>}
        {error && <p className="menu-status menu-error">{t('settings.error', { message: error })}</p>}
        {user && (
          <ul className="settings-account">
            <li>
              <span className="settings-account-label">{t('settings.username')}</span>
              <span className="settings-account-value">{user.username}</span>
            </li>
            <li>
              <span className="settings-account-label">{t('settings.email')}</span>
              <span className="settings-account-value">{user.email}</span>
            </li>
            <li>
              <span className="settings-account-label">{t('settings.memberSince')}</span>
              <span className="settings-account-value">
                {new Date(user.createdAt).toLocaleDateString(i18n.language)}
              </span>
            </li>
          </ul>
        )}
      </section>
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
