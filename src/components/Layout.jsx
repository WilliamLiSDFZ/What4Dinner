import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { navItems } from '../data'

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-brand">What4Dinner</p>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.key}>
              <NavLink to={item.path} end={item.path === '/'}>
                <i className={item.icon} /> {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="sidebar-user">
          <div className="sidebar-avatar">W</div>
          <span className="sidebar-user-name">William</span>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
        {pathname !== '/add' && (
          <button className="fab" onClick={() => navigate('/add')}>
            <i className="bi-plus-lg" /> Add new dish
          </button>
        )}
      </main>
    </>
  )
}
