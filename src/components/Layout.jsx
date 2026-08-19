import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '../data'
import { logout } from '../api'
import logoMark from '../assets/logo-mark.png'

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  return (
    <>
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
        <div className="sidebar-user">
          <div className="sidebar-avatar">W</div>
          <span className="sidebar-user-name">William</span>
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
    </>
  )
}
