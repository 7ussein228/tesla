import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>تسجيل الدخول</h1>
        <p className="subtitle">ادخل بياناتك للوصول إلى حسابك</p>
        {error && <div className="error-msg"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> جاري الدخول...</> : <><i className="fa-solid fa-right-to-bracket"></i> دخول</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-dim)' }}>
          ليس لديك حساب؟ <Link to="/register" style={{ color: 'var(--neon-blue)', fontWeight: 700 }}>سجل الآن</Link>
        </p>
        <div style={{ marginTop: 20, padding: 14, background: 'rgba(0,210,255,0.05)', borderRadius: 12, border: '1px solid var(--border-plasma)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}><strong style={{ color: 'var(--neon-blue)' }}>للتجربة:</strong></p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 4 }}>طالب: rawan@student.com / 123456</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>مدرس: teacher@newton.edu / 123456</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>مدير: admin@newton.edu / 123456</p>
        </div>
      </div>
    </div>
  )
}
