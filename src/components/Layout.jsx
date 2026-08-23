import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '../data'
import { getMe, getSettings, logout } from '../api'
import { UserContext } from '../UserContext'
import { SettingsContext } from '../SettingsContext'
import logoMark from '../assets/logo-mark.png'

// The phone bar is a different shape, not just different styling — a dropdown is
// a trigger plus a popover, which no amount of CSS turns a flat <ul> into.
// Must stay in sync with the 768px breakpoint in App.css.
const MOBILE_QUERY = '(max-width: 768px)'

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  const [navOpen, setNavOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const navRef = useRef(null)
  const accountRef = useRef(null)

  // Fetched once here and shared through context: the sidebar chip, the Settings
  // account section and the Family page all need the same profile.
  useEffect(() => {
    let active = true
    getMe()
      .then((data) => { if (active) setUser(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Kept as its own effect rather than folded into the one above: a settings
  // failure should not blank the sidebar's user chip, or vice versa. Shared
  // because the Settings page edits these and the add-dish form reads the
  // currency off them.
  useEffect(() => {
    let active = true
    getSettings()
      .then((data) => { if (active) setSettings(data) })
      .catch((err) => { if (active) setSettingsError(err.message) })
      .finally(() => { if (active) setSettingsLoading(false) })
    return () => { active = false }
  }, [])

  // Mirrors the theme effect in App.jsx, which tracks prefers-color-scheme the
  // same way.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // One effect for both popovers, as the Favorites row menu and the ingredient
  // picker do individually. Escape closes both; a pointerdown closes whichever
  // menu the click landed outside of.
  useEffect(() => {
    if (!navOpen && !accountOpen) return
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setNavOpen(false)
      setAccountOpen(false)
    }
    const onPointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [navOpen, accountOpen])

  const initial = user ? user.username.charAt(0).toUpperCase() : ''
  // /add renders inside Layout but is not a sidebar entry, so without the
  // fallback the trigger would read blank there.
  const currentItem = navItems.find((item) => item.path === pathname)
  const currentLabel = currentItem ? t(`nav.${currentItem.key}`) : t('nav.pages')

  return (
    <SettingsContext.Provider
      value={{ settings, setSettings, loading: settingsLoading, error: settingsError }}
    >
    <UserContext.Provider value={{ user, loading, error }}>
      <aside className="sidebar">
        <p className="sidebar-brand">
          <img src={logoMark} alt="" className="sidebar-logo" />
          <span className="sidebar-brand-name">What4Dinner</span>
        </p>

        {isMobile ? (
          <>
            <div className="nav-menu" ref={navRef}>
              <button
                type="button"
                className="nav-trigger"
                aria-haspopup="menu"
                aria-expanded={navOpen}
                onClick={() => { setNavOpen((open) => !open); setAccountOpen(false) }}
              >
                {currentLabel} <i className="bi-chevron-down" />
              </button>
              {navOpen && (
                <ul className="nav-dropdown" role="menu">
                  {navItems.map((item) => (
                    <li key={item.key}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        role="menuitem"
                        onClick={() => setNavOpen(false)}
                      >
                        <i className={item.icon} />
                        <span className="nav-dropdown-label">{t(`nav.${item.key}`)}</span>
                        {item.path === pathname && <i className="bi-check-lg" />}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="account-menu" ref={accountRef}>
              <button
                type="button"
                className="sidebar-avatar"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label={t('auth.account')}
                onClick={() => { setAccountOpen((open) => !open); setNavOpen(false) }}
              >
                {initial}
              </button>
              {accountOpen && (
                <div className="account-dropdown" role="menu">
                  <span className="account-name">{user ? user.username : ''}</span>
                  <button
                    type="button"
                    className="account-logout"
                    role="menuitem"
                    onClick={logout}
                  >
                    <i className="bi-box-arrow-right" /> {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <ul className="sidebar-nav">
              {navItems.map((item) => (
                <li key={item.key}>
                  <NavLink to={item.path} end={item.path === '/'}>
                    <i className={item.icon} /> {t(`nav.${item.key}`)}
                  </NavLink>
                </li>
              ))}
            </ul>
            {/* Until the profile lands the circle stays empty rather than flashing a
                placeholder name; Settings is where a failed load is reported. */}
            <div className="sidebar-user">
              <div className="sidebar-avatar">{initial}</div>
              <span className="sidebar-user-name">{user ? user.username : ''}</span>
            </div>
            <button className="sidebar-logout" onClick={logout} aria-label={t('auth.logout')}>
              <i className="bi-box-arrow-right" />
              <span className="sidebar-logout-label">{t('auth.logout')}</span>
            </button>
          </>
        )}
      </aside>

      <main className="main-content">
        <Outlet />
        {pathname !== '/add' && (
          <button className="fab" onClick={() => navigate('/add')}>
            <i className="bi-plus-lg" /> {t('fab.addDish')}
          </button>
        )}
      </main>
    </UserContext.Provider>
    </SettingsContext.Provider>
  )
}
