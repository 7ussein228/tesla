import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userFilter, setUserFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers).catch(() => {})
    fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setCourses).catch(() => {})
    fetch('/api/admin/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {})
  }, [token])

  const loadUsers = async (role, q) => {
    let url = '/api/admin/users?'
    if (role && role !== 'all') url += `role=${role}&`
    if (q) url += `search=${q}&`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    setUsers(await res.json())
  }

  const updateUser = async (id, data) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    })
    loadUsers(userFilter, search)
  }

  const deleteUser = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    loadUsers(userFilter, search)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, minWidth: 260, background: 'rgba(8,12,28,0.95)', borderLeft: '1px solid var(--border-plasma)',
        padding: '24px 16px', position: 'fixed', right: 0, top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <div className="brand-logo" style={{ padding: '0 8px 20px', borderBottom: '1px solid var(--border-plasma)', marginBottom: 20, fontSize: '1.1rem' }}>
          <i className="fa-solid fa-atom fa-spin" style={{ '--fa-animation-duration': '12s' }}></i> نيوتن - الإدارة
        </div>
        {[
          { section: 'الرئيسية', items: [{ id: 'dashboard', icon: 'fa-gauge-high', label: 'لوحة التحكم' }] },
          { section: 'إدارة المحتوى', items: [{ id: 'courses', icon: 'fa-book', label: 'الكورسات' }, { id: 'users', icon: 'fa-users', label: 'المستخدمين' }] },
          { section: 'المالية', items: [{ id: 'leaderboard', icon: 'fa-ranking-star', label: 'لوحة الأوائل' }] },
        ].map(s => (
          <div key={s.section}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '16px 14px 6px', letterSpacing: 1 }}>{s.section}</div>
            {s.items.map(item => (
              <a key={item.id} href="#" onClick={e => { e.preventDefault(); setTab(item.id) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                  color: tab === item.id ? 'white' : 'var(--text-dim)', fontWeight: 700, fontSize: '0.9rem',
                  background: tab === item.id ? 'rgba(0,210,255,0.1)' : 'transparent',
                  marginBottom: 4, transition: 'all 0.2s'
                }}>
                <i className={`fa-solid ${item.icon}`} style={{ width: 20, textAlign: 'center' }}></i> {item.label}
              </a>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 30, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-plasma)' }}>
          <strong style={{ fontSize: '0.9rem' }}>{user?.name}</strong>
          <span style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem' }}>{user?.email}</span>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginRight: 260, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900 }}>
            <i className="fa-solid fa-gauge-high" style={{ color: 'var(--neon-blue)' }}></i>{' '}
            {tab === 'dashboard' ? 'لوحة التحكم' : tab === 'courses' ? 'إدارة الكورسات' : tab === 'users' ? 'إدارة المستخدمين' : 'لوحة الأوائل'}
          </h1>
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">إجمالي الطلاب</span><div className="stat-icon"><i className="fa-solid fa-users"></i></div></div>
                <div className="stat-value">{stats.students || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">الكورسات</span><div className="stat-icon"><i className="fa-solid fa-book-open"></i></div></div>
                <div className="stat-value">{stats.publishedCourses || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">المسجلين</span><div className="stat-icon"><i className="fa-solid fa-user-check"></i></div></div>
                <div className="stat-value">{stats.enrollments || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-header"><span className="stat-label">شيتات معلقة</span><div className="stat-icon"><i className="fa-solid fa-file-arrow-up"></i></div></div>
                <div className="stat-value">{stats.pendingHomework || 0}</div>
              </div>
            </div>

            <div className="content-grid">
              <div className="panel">
                <div className="panel-header"><h2><i className="fa-solid fa-chart-line" style={{ color: 'var(--neon-blue)' }}></i> إحصائيات سريعة</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="lesson-node"><span>إجمالي الطاقة المكتسبة</span><strong style={{ color: 'var(--atom-gold)' }}>{stats.totalEnergy || 0} جول</strong></div>
                  <div className="lesson-node"><span>محاولات الكويزات</span><strong>{stats.quizAttempts || 0}</strong></div>
                  <div className="lesson-node"><span>شيتات تم تسليمها</span><strong>{stats.homeworkCount || 0}</strong></div>
                  <div className="lesson-node"><span>المدرسين</span><strong>{stats.teachers || 0}</strong></div>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><h2><i className="fa-solid fa-bell" style={{ color: 'var(--atom-gold)' }}></i> آخر المستخدمين</h2></div>
                {(stats.recentUsers || []).slice(0, 5).map(u => (
                  <div key={u.id} className="notif-item">
                    <div className="notif-icon"><i className={`fa-solid ${u.role === 'admin' ? 'fa-shield' : u.role === 'teacher' ? 'fa-chalkboard-user' : 'fa-user'}`}></i></div>
                    <div className="notif-text"><strong>{u.name}</strong><span>{u.role} • {u.email}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div className="panel">
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>الكورس</th><th>المدرس</th><th>المرحلة</th><th>المحاضرات</th><th>المسجلين</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {courses.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{c.title}</td>
                    <td>{c.teacher_name || '-'}</td>
                    <td><span className={`course-stage ${c.stage === 'ثالث ثانوي' ? 'stage-sec3' : c.stage === 'أول ثانوي' ? 'stage-sec1' : 'stage-prep'}`}>{c.stage}</span></td>
                    <td>{c.lecture_count}</td>
                    <td>{c.student_count}</td>
                    <td><span className={`status-badge ${c.is_published ? 'status-active' : 'status-pending'}`}>{c.is_published ? 'نشط' : 'مسودة'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="panel">
            <div className="panel-header">
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'student', 'teacher', 'admin'].map(r => (
                  <button key={r} className={`tab-btn ${userFilter === r ? 'active' : ''}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    onClick={() => { setUserFilter(r); loadUsers(r, search) }}>
                    {r === 'all' ? 'الكل' : r === 'student' ? 'طلاب' : r === 'teacher' ? 'مدرسين' : 'مدراء'}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); loadUsers(userFilter, e.target.value) }}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-plasma)', background: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: 'Cairo', width: 200 }} />
            </div>
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>الاسم</th><th>البريد</th><th>الدور</th><th>المرحلة</th><th>الطاقة</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`status-badge ${u.role === 'admin' ? 'status-blocked' : u.role === 'teacher' ? 'status-pending' : 'status-active'}`}>
                      {u.role === 'admin' ? 'مدير' : u.role === 'teacher' ? 'مدرس' : 'طالب'}
                    </span></td>
                    <td>{u.stage || '-'}</td>
                    <td style={{ color: 'var(--atom-gold)' }}>{u.energy || 0} جول</td>
                    <td>
                      <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-plasma)', background: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: 'Cairo', fontSize: '0.8rem' }}>
                        <option value="student">طالب</option><option value="teacher">مدرس</option><option value="admin">مدير</option>
                      </select>
                      <button className="action-btn danger" onClick={() => deleteUser(u.id)} style={{ marginRight: 4 }}><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="panel">
            <h2 style={{ color: 'var(--atom-gold)', marginBottom: 16 }}><i className="fa-solid fa-trophy"></i> لوحة الأوائل</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaderboard.map((l, i) => (
                <div key={l.id} className="lesson-node" style={{ borderColor: i < 3 ? 'var(--atom-gold)' : undefined, background: i === 0 ? 'rgba(255,190,11,0.08)' : undefined }}>
                  <span>{['🥇','🥈','🥉'][i] || `${i+1}.`} {l.name} <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>({l.stage})</span></span>
                  <strong style={{ color: i === 0 ? 'var(--atom-gold)' : 'var(--text-dim)' }}>{l.energy} جول</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
