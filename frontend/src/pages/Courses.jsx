import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const stageColors = { 'ثالث إعدادي': 'stage-prep', 'أول ثانوي': 'stage-sec1', 'ثاني ثانوي': 'stage-sec1', 'ثالث ثانوي': 'stage-sec3' }
const stageIcons = { 'ثالث ثانوي': 'fa-bolt', 'أول ثانوي': 'fa-flask', 'ثاني ثانوي': 'fa-atom', 'ثالث إعدادي': 'fa-saturn' }
const thumbColors = [
  'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(157,78,221,0.15))',
  'linear-gradient(135deg, rgba(0,245,212,0.2), rgba(0,210,255,0.15))',
  'linear-gradient(135deg, rgba(157,78,221,0.2), rgba(255,190,11,0.15))',
  'linear-gradient(135deg, rgba(255,190,11,0.2), rgba(0,245,212,0.15))',
]

export default function Courses() {
  const { token, user } = useAuth()
  const [courses, setCourses] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => { setCourses(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? courses : courses.filter(c => {
    if (filter === 'prep') return c.stage === 'ثالث إعدادي'
    if (filter === 'sec1') return c.stage === 'أول ثانوي'
    if (filter === 'sec3') return c.stage === 'ثالث ثانوي'
    return true
  })

  const handleEnroll = async (courseId) => {
    if (!token) { alert('سجل دخول أولاً'); return }
    setEnrolling(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) { alert('تم التسجيل بنجاح!'); setSelectedCourse(null) }
      else alert(data.error)
    } catch { alert('خطأ في التسجيل') }
    setEnrolling(false)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>تصفح <span>الكورسات</span></h1>
        <p>اختر الكورس المناسب ل阶段ك وابدأ رحلتك نحو التفوق</p>
      </div>

      <div className="filter-bar">
        {[
          { key: 'all', icon: 'fa-layer-group', label: 'الكل' },
          { key: 'prep', icon: 'fa-saturn', label: 'إعدادي' },
          { key: 'sec1', icon: 'fa-flask', label: 'أول ثانوي' },
          { key: 'sec3', icon: 'fa-bolt', label: 'ثالث ثانوي' },
        ].map(f => (
          <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            <i className={`fa-solid ${f.icon}`}></i> {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {filtered.map((course, i) => (
            <div key={course.id} className="course-card" onClick={() => setSelectedCourse(course)}>
              <div className="course-thumb" style={{ background: thumbColors[i % thumbColors.length] }}>
                <i className={`fa-solid ${stageIcons[course.stage] || 'fa-book'}`}></i>
              </div>
              <div className="course-info">
                <span className={`course-stage ${stageColors[course.stage] || ''}`}>{course.stage}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-stats">
                  <span className="course-stat"><i className="fa-solid fa-video"></i> {course.lecture_count} محاضرة</span>
                  <span className="course-stat"><i className="fa-solid fa-users"></i> {course.student_count} طالب</span>
                </div>
                <div className="course-footer">
                  <span className="course-price">{course.price} ج.م</span>
                  <button className="btn-primary btn-sm">التفاصيل</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="modal-overlay active" onClick={() => setSelectedCourse(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 600 }}>
            <button className="modal-close" onClick={() => setSelectedCourse(null)}><i className="fa-solid fa-xmark"></i></button>
            <h2>{selectedCourse.title}</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>{selectedCourse.description}</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className={`course-stage ${stageColors[selectedCourse.stage]}`}>{selectedCourse.stage}</span>
              <span className="course-stat"><i className="fa-solid fa-video"></i> {selectedCourse.lecture_count} محاضرة</span>
              <span className="course-stat"><i className="fa-solid fa-users"></i> {selectedCourse.student_count} طالب مسجل</span>
              <span className="course-price">{selectedCourse.price} ج.م</span>
            </div>
            <p style={{ color: 'var(--text-dim)', marginBottom: 12 }}>المدرس: {selectedCourse.teacher_name || 'غير محدد'}</p>
            <button className="btn-primary" onClick={() => handleEnroll(selectedCourse.id)} disabled={enrolling} style={{ width: '100%', justifyContent: 'center' }}>
              {enrolling ? <><i className="fa-solid fa-spinner fa-spin"></i> جاري التسجيل...</> : <><i className="fa-solid fa-cart-plus"></i> تسجيل في الكورس</>}
            </button>
          </div>
        </div>
      )}

      <footer style={{ marginTop: 40, background: 'rgba(5,8,19,0.95)', borderTop: '1px solid var(--border-plasma)', padding: '30px 40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        © 2026 منصة نيوتن في الفيزياء والعلوم
      </footer>
    </div>
  )
}
