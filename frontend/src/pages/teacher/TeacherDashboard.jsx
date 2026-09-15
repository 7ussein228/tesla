import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { user, token } = useAuth()
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState([])
  const [pendingHomework, setPendingHomework] = useState([])
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [showAddQuiz, setShowAddQuiz] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', stage: 'ثالث ثانوي', price: 0 })
  const [newLecture, setNewLecture] = useState({ title: '', course_id: '', duration: 60 })
  const [newQuiz, setNewQuiz] = useState({ course_id: '', title: '', questions: [] })

  useEffect(() => {
    loadCourses()
    loadPendingHomework()
  }, [token])

  const loadCourses = () => {
    fetch('/api/courses/teacher/my-courses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setCourses).catch(() => {})
  }

  const loadPendingHomework = () => {
    fetch('/api/homework/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPendingHomework).catch(() => {})
  }

  const addCourse = async () => {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newCourse)
    })
    if (res.ok) { setShowAddCourse(false); loadCourses(); setNewCourse({ title: '', description: '', stage: 'ثالث ثانوي', price: 0 }) }
  }

  const addLecture = async () => {
    const res = await fetch(`/api/courses/${newLecture.course_id}/lectures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newLecture.title, duration: newLecture.duration, sort_order: 99 })
    })
    if (res.ok) { setShowAddLecture(false); setNewLecture({ title: '', course_id: '', duration: 60 }) }
  }

  const gradeHomework = async (hwId, grade, feedback) => {
    await fetch(`/api/homework/${hwId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ grade, feedback })
    })
    loadPendingHomework()
  }

  return (
    <div className="container">
      <div className="energy-banner">
        <div>
          <h2 style={{ fontWeight: 800 }}>لوحة المدرس 👨‍🏫</h2>
          <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>{user?.name} — إدارة الكورسات والمحتوى</p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--neon-green)', display: 'block' }}>{courses.length}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>كورس نشط</span>
        </div>
      </div>

      <div className="tabs-nav">
        {[
          { id: 'courses', icon: 'fa-book', label: 'كورساتي' },
          { id: 'lectures', icon: 'fa-video', label: 'المحاضرات' },
          { id: 'quizzes', icon: 'fa-question-circle', label: 'الكويزات' },
          { id: 'homework', icon: 'fa-file-arrow-up', label: 'شيتات الطلاب' },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`fa-solid ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* My Courses */}
      {tab === 'courses' && (
        <div className="glass-box">
          <div className="panel-header">
            <h2>كورساتي ({courses.length})</h2>
            <button className="btn-primary" onClick={() => setShowAddCourse(true)}><i className="fa-solid fa-plus"></i> كورس جديد</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>الكورس</th><th>المرحلة</th><th>المحاضرات</th><th>المسجلين</th><th>الحالة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {courses.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.title}</td>
                  <td><span className={`course-stage ${c.stage === 'ثالث ثانوي' ? 'stage-sec3' : c.stage === 'أول ثانوي' ? 'stage-sec1' : 'stage-prep'}`}>{c.stage}</span></td>
                  <td>{c.lecture_count}</td>
                  <td>{c.student_count}</td>
                  <td><span className={`status-badge ${c.is_published ? 'status-active' : 'status-pending'}`}>{c.is_published ? 'نشط' : 'مسودة'}</span></td>
                  <td>
                    <button className="action-btn" onClick={() => { setNewLecture({ ...newLecture, course_id: c.id }); setShowAddLecture(true) }}><i className="fa-solid fa-plus"></i> محاضرة</button>
                    <button className="action-btn" onClick={() => { setNewQuiz({ ...newQuiz, course_id: c.id }); setShowAddQuiz(true) }} style={{ marginRight: 4 }}><i className="fa-solid fa-plus"></i> كويز</button>
                  </td>
                </tr>
              ))}
              {!courses.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>لم تُنشئ كورسات بعد</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Lectures */}
      {tab === 'lectures' && (
        <div className="glass-box">
          <div className="panel-header">
            <h2>إدارة المحاضرات</h2>
            <button className="btn-primary" onClick={() => setShowAddLecture(true)}><i className="fa-solid fa-upload"></i> رفع محاضرة</button>
          </div>
          <div className="upload-area" onClick={() => setShowAddLecture(true)}>
            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2.5rem', color: 'var(--neon-blue)', marginBottom: 12 }}></i>
            <p>اضغط لرفع فيديو محاضرة جديد</p>
          </div>
        </div>
      )}

      {/* Quizzes */}
      {tab === 'quizzes' && (
        <div className="glass-box">
          <div className="panel-header">
            <h2>إدارة الكويزات</h2>
            <button className="btn-primary" onClick={() => setShowAddQuiz(true)}><i className="fa-solid fa-plus"></i> كويز جديد</button>
          </div>
          <p style={{ color: 'var(--text-dim)' }}>أنشئ كويزات تفاعلية لاختبار طلابك</p>
        </div>
      )}

      {/* Homework */}
      {tab === 'homework' && (
        <div className="glass-box">
          <div className="panel-header">
            <h2>شيتات الطلاب المعلقة ({pendingHomework.length})</h2>
          </div>
          {pendingHomework.length ? (
            <table className="data-table">
              <thead>
                <tr><th>الطالب</th><th>الشيت</th><th>الكورس</th><th>التاريخ</th><th>إجراءات</th></tr>
              </thead>
              <tbody>
                {pendingHomework.map(hw => (
                  <tr key={hw.id}>
                    <td>{hw.student_name}</td>
                    <td>{hw.sheet_title}</td>
                    <td>{hw.course_title}</td>
                    <td>{new Date(hw.submitted_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <button className="action-btn btn-success btn-sm" onClick={() => gradeHomework(hw.id, 90, 'ممتاز')}>90%</button>
                      <button className="action-btn btn-warning btn-sm" onClick={() => gradeHomework(hw.id, 75, 'جيد')} style={{ marginRight: 4 }}>75%</button>
                      <button className="action-btn danger btn-sm" onClick={() => gradeHomework(hw.id, 50, 'يحتاج تحسين')} style={{ marginRight: 4 }}>50%</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>لا توجد شيتات معلقة</p>}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="modal-overlay active" onClick={() => setShowAddCourse(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddCourse(false)}><i className="fa-solid fa-xmark"></i></button>
            <h2><i className="fa-solid fa-plus-circle" style={{ color: 'var(--neon-blue)' }}></i> إضافة كورس جديد</h2>
            <div className="form-group"><label>اسم الكورس</label><input value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="مثال: فيزياء 3 ثانوي" /></div>
            <div className="form-group"><label>الوصف</label><textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="وصف الكورس..." /></div>
            <div className="form-group"><label>المرحلة</label>
              <select value={newCourse.stage} onChange={e => setNewCourse({ ...newCourse, stage: e.target.value })}>
                <option>ثالث ثانوي</option><option>أول ثانوي</option><option>ثاني ثانوي</option><option>ثالث إعدادي</option>
              </select>
            </div>
            <div className="form-group"><label>السعر (ج.م)</label><input type="number" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: parseInt(e.target.value) || 0 })} /></div>
            <button className="btn-primary" onClick={addCourse} style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-check"></i> إنشاء الكورس</button>
          </div>
        </div>
      )}

      {/* Add Lecture Modal */}
      {showAddLecture && (
        <div className="modal-overlay active" onClick={() => setShowAddLecture(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddLecture(false)}><i className="fa-solid fa-xmark"></i></button>
            <h2>إضافة محاضرة جديدة</h2>
            <div className="form-group"><label>الكورس</label>
              <select value={newLecture.course_id} onChange={e => setNewLecture({ ...newLecture, course_id: e.target.value })}>
                <option value="">اختر الكورس</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label>عنوان المحاضرة</label><input value={newLecture.title} onChange={e => setNewLecture({ ...newLecture, title: e.target.value })} placeholder="المحاضرة 5: ..." /></div>
            <div className="form-group"><label>المدة (دقيقة)</label><input type="number" value={newLecture.duration} onChange={e => setNewLecture({ ...newLecture, duration: parseInt(e.target.value) || 0 })} /></div>
            <div className="upload-area" style={{ marginBottom: 16 }}><i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '2rem', color: 'var(--neon-blue)' }}></i><p>اسحب الفيديو هنا أو اضغط لاختيار ملف</p></div>
            <button className="btn-primary" onClick={addLecture} style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-check"></i> رفع المحاضرة</button>
          </div>
        </div>
      )}

      {/* Add Quiz Modal */}
      {showAddQuiz && (
        <div className="modal-overlay active" onClick={() => setShowAddQuiz(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddQuiz(false)}><i className="fa-solid fa-xmark"></i></button>
            <h2>إنشاء كويز جديد</h2>
            <div className="form-group"><label>الكورس</label>
              <select value={newQuiz.course_id} onChange={e => setNewQuiz({ ...newQuiz, course_id: e.target.value })}>
                <option value="">اختر الكورس</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label>عنوان الكويز</label><input value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} placeholder="كويز قانون أوم" /></div>
            <button className="btn-primary" onClick={async () => {
              const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...newQuiz, time_limit: 15, passing_score: 60, questions: [] })
              })
              if (res.ok) { setShowAddQuiz(false); setNewQuiz({ course_id: '', title: '', questions: [] }) }
            }} style={{ width: '100%', justifyContent: 'center' }}><i className="fa-solid fa-check"></i> إنشاء الكويز</button>
          </div>
        </div>
      )}
    </div>
  )
}
