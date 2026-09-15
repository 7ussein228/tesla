import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', stage: 'ثالث ثانوي', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1>حساب جديد</h1>
        <p className="subtitle">سجل في منصة نيوتن وابدأ رحلتك العلمية</p>
        {error && <div className="error-msg"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="اسم الطالب" required />
          </div>
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>رقم الهاتف</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="01xxxxxxxxx" />
          </div>
          <div className="form-group">
            <label>المرحلة الدراسية</label>
            <select name="stage" value={form.stage} onChange={handleChange}>
              <option>ثالث إعدادي</option>
              <option>أول ثانوي</option>
              <option>ثاني ثانوي</option>
              <option>ثالث ثانوي</option>
            </select>
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="6 أحرف على الأقل" required minLength={6} />
          </div>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> جاري الإنشاء...</> : <><i className="fa-solid fa-user-plus"></i> إنشاء حساب</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-dim)' }}>
          لديك حساب بالفعل؟ <Link to="/login" style={{ color: 'var(--neon-blue)', fontWeight: 700 }}>سجل دخولك</Link>
        </p>
      </div>
    </div>
  )
}
