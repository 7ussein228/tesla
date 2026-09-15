import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'

  return (
    <header>
      <div className="brand-logo">
        <Link to="/">
          <i className="fa-solid fa-atom fa-spin" style={{ '--fa-animation-duration': '12s' }}></i> منصة نيوتن
        </Link>
      </div>
      <nav className="nav-links">
        <Link to="/">الرئيسية</Link>
        <Link to="/courses">الكورسات</Link>
        {user && <Link to={dashboardPath}>لوحة التحكم</Link>}
        {user ? (
          <div className="user-menu">
            <span className="user-badge">
              <i className="fa-solid fa-user-astronaut"></i>
              {user.name}
            </span>
            <button className="btn-logout" onClick={() => { logout(); navigate('/') }}>
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-login">
            <i className="fa-solid fa-right-to-bracket"></i> تسجيل الدخول
          </Link>
        )}
      </nav>
    </header>
  )
}
