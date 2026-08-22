import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from '../ThemeContext'
import { UserContext } from '../UserContext'
import { SettingsContext } from '../SettingsContext'
import { updateSettings } from '../api'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

// Straight from the browser, so the ids are always correctly cased — the
// endpoint rejects `asia/shanghai`, and a free-text field would invite exactly
// that. Computed once: both lists are hundreds of entries.
const TIMEZONES = Intl.supportedValuesOf('timeZone')
const CURRENCIES = Intl.supportedValuesOf('currency')

export default function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)
  const { user, loading, error } = useContext(UserContext)
  const {
    settings,
    setSettings,
    loading: settingsLoading,
    error: settingsError,
  } = useContext(SettingsContext)
  const { t, i18n } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const savedTimer = useRef(null)

  // The "Saved" flash is on a timer, so it has to be cleared or a quick
  // unmount would set state on a dead component.
  useEffect(() => () => clearTimeout(savedTimer.current), [])

  const currencyNames = new Intl.DisplayNames([i18n.language], { type: 'currency' })

  // Optimistic: the selects are controlled by `settings`, so waiting for the
  // response would make the dropdown visibly snap back mid-flight. Rolls back
  // on failure, as the Favorites page does when unfavoriting.
  async function saveFamilySetting(field, value) {
    const previous = settings
    setSaveError(null)
    setSaved(false)
    setSaving(true)
    setSettings({ ...settings, family: { ...settings.family, [field]: value } })
    try {
      // Only the changed field is sent — the endpoint is partial at both levels.
      const next = await updateSettings({ family: { [field]: value } })
      setSettings(next)
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSettings(previous)
      setSaveError(
        err.message === 'HTTP 400'
          ? t('settings.settingInvalid')
          : t('settings.saveFailed', { message: err.message }),
      )
    } finally {
      setSaving(false)
    }
  }

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
        <h2>
          {t('settings.family')}
          {saving && <span className="settings-save-status">{t('settings.saving')}</span>}
          {!saving && saved && <span className="settings-save-status">{t('settings.saved')}</span>}
        </h2>
        <p className="settings-hint">{t('settings.familyShared')}</p>
        {settingsLoading && <p className="menu-status">{t('settings.familyLoading')}</p>}
        {settingsError && (
          <p className="menu-status menu-error">
            {t('settings.familyError', { message: settingsError })}
          </p>
        )}
        {saveError && <p className="menu-status menu-error">{saveError}</p>}
        {settings && (
          <div className="settings-fields">
            <div className="add-dish-field">
              <label className="add-dish-label" htmlFor="family-timezone">
                {t('settings.timezone')}
              </label>
              <select
                id="family-timezone"
                className="settings-select"
                value={settings.family?.timezone ?? ''}
                onChange={(e) => saveFamilySetting('timezone', e.target.value)}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            <div className="add-dish-field">
              <label className="add-dish-label" htmlFor="family-currency">
                {t('settings.currency')}
              </label>
              <select
                id="family-currency"
                className="settings-select"
                value={settings.family?.currencyUnit ?? ''}
                onChange={(e) => saveFamilySetting('currencyUnit', e.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>{code} — {currencyNames.of(code)}</option>
                ))}
              </select>
            </div>
          </div>
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
