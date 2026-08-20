import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '../data'
import { getMe, logout } from '../api'
import { UserContext } from '../UserContext'
import logoMark from '../assets/logo-mark.png'

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      <aside className="sidebar">
        <p className="sidebar-brand">
          <img src={logoMark} alt="" className="sidebar-logo" />
          What4Dinner
        </p>
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
          <div className="sidebar-avatar">{user ? user.username.charAt(0).toUpperCase() : ''}</div>
          <span className="sidebar-user-name">{user ? user.username : ''}</span>
        </div>
        <button className="sidebar-logout" onClick={logout} aria-label={t('auth.logout')}>
          <i className="bi-box-arrow-right" />
          <span className="sidebar-logout-label">{t('auth.logout')}</span>
        </button>
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
  )
}
