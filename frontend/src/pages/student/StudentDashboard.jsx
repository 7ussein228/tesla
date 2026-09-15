import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState('content')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [activeLecture, setActiveLecture] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [homeworkFile, setHomeworkFile] = useState(null)
  const [uploadingHw, setUploadingHw] = useState(false)
  const [myHomework, setMyHomework] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetch('/api/courses/my/enrolled', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setCourses).catch(() => {})
    fetch('/api/admin/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {})
    fetch('/api/homework/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setMyHomework).catch(() => {})
  }, [token])

  const loadCourse = async (courseId) => {
    const res = await fetch(`/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setSelectedCourse(data)
    setLectures(data.lectures || [])
    setQuizzes(data.quizzes || [])
    if (data.lectures?.length) setActiveLecture(data.lectures[0])
  }

  const loadQuiz = async (quizId) => {
    const res = await fetch(`/api/quizzes/${quizId}`)
    const data = await res.json()
    setActiveQuiz(data)
    setQuizAnswers({})
    setQuizResult(null)
  }

  const submitQuiz = async () => {
    const res = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: quizAnswers })
    })
    const data = await res.json()
    setQuizResult(data)
  }

  const markComplete = async (lectureId) => {
    await fetch(`/api/courses/lectures/${lectureId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ completed: 1, watched_seconds: 3600 })
    })
    if (selectedCourse) loadCourse(selectedCourse.id)
  }

  const submitHomework = async (sheetId) => {
    if (!homeworkFile) return alert('اختر ملف أولاً')
    setUploadingHw(true)
    const formData = new FormData()
    formData.append('file', homeworkFile)
    formData.append('sheet_id', sheetId)
    try {
      const res = await fetch('/api/homework/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        alert('تم تسليم الواجب بنجاح!')
        setHomeworkFile(null)
        fetch('/api/homework/my', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(setMyHomework).catch(() => {})
      } else {
        const err = await res.json()
        alert(err.error || 'خطأ في التسليم')
      }
    } catch (e) { alert('خطأ في التسليم') }
    setUploadingHw(false)
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="energy-banner">
        <div>
          <h2 style={{ fontWeight: 800 }}>مرحباً، {user?.name} 👋</h2>
          <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>كورساتك и تقدمك في مكان واحد</p>
          <div className="quantum-bar"><div className="quantum-fill" style={{ width: `${courses.length ? Math.round(courses.reduce((a,c) => a + (c.progress||0), 0) / courses.length) : 0}%` }}></div></div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--neon-green)', display: 'block' }}>{user?.energy || 0} جول</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>طاقة مكتسبة</span>
        </div>
      </div>

      {/* My Courses */}
      {courses.length > 0 && (
        <div className="glass-box">
          <h3 style={{ marginBottom: 14 }}><i className="fa-solid fa-book-open" style={{ color: 'var(--neon-blue)' }}></i> كورساتي ({courses.length})</h3>
          <div className="my-courses-grid">
            {courses.map(c => (
              <div key={c.id} className="my-course-card" onClick={() => { loadCourse(c.id); setTab('content') }}>
                <div className="my-course-icon"><i className={`fa-solid ${c.stage === 'ثالث ثانوي' ? 'fa-bolt' : c.stage === 'أول ثانوي' ? 'fa-flask' : 'fa-saturn'}`}></i></div>
                <div className="my-course-info">
                  <h4>{c.title}</h4>
                  <p>{c.progress || 0}% مكتمل • {c.lecture_count} محاضرة</p>
                  <div className="mini-progress"><div className="mini-progress-fill" style={{ width: `${c.progress || 0}%` }}></div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {selectedCourse && (
        <>
          <div className="tabs-nav">
            {[
              { id: 'content', icon: 'fa-play-circle', label: 'المحاضرات' },
              { id: 'quiz', icon: 'fa-calculator', label: 'الكويزات' },
              { id: 'homework', icon: 'fa-file-arrow-up', label: 'الواجبات' },
              { id: 'ranks', icon: 'fa-ranking-star', label: 'لوحة الأوائل' },
            ].map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                <i className={`fa-solid ${t.icon}`}></i> {t.label}
              </button>
            ))}
          </div>

          {/* Lecture Tab */}
          {tab === 'content' && (
            <div className="study-layout">
              <div className="glass-box">
                <div className="video-container">
                  <div className="watermark-shield">الطالب: #{user?.id} - {user?.name}</div>
                  <div className="neon-play"><i className="fa-solid fa-play"></i></div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <h3>{activeLecture?.title || 'اختر محاضرة'}</h3>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
                    {activeLecture ? `زمن الحصة: ${activeLecture.duration} دقيقة` : ''}
                  </p>
                  {activeLecture && (
                    <button className="btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => markComplete(activeLecture.id)}>
                      <i className="fa-solid fa-check"></i> تم المشاهدة
                    </button>
                  )}
                </div>
              </div>
              <div className="glass-box">
                <h3>فهرس المحاضرات</h3>
                <ul className="lesson-list">
                  {lectures.map((l, i) => (
                    <li key={l.id} className={`lesson-node ${activeLecture?.id === l.id ? 'active' : ''}`} onClick={() => setActiveLecture(l)}>
                      <span>{l.title}</span>
                      {l.is_free ? <span style={{ color: 'var(--neon-green)' }}><i className="fa-solid fa-check"></i> مجاني</span> :
                       <span style={{ color: 'var(--text-dim)' }}><i className="fa-solid fa-lock"></i> مقفول</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {tab === 'quiz' && (
            <div className="glass-box">
              <h2 style={{ color: 'var(--neon-blue)', marginBottom: 20 }}><i className="fa-solid fa-calculator"></i> الكويزات التفاعلية</h2>
              {!activeQuiz ? (
                quizzes.length ? quizzes.map(q => (
                  <div key={q.id} className="lesson-node" style={{ marginBottom: 8 }} onClick={() => loadQuiz(q.id)}>
                    <span><i className="fa-solid fa-circle-question" style={{ color: 'var(--atom-gold)' }}></i> {q.title}</span>
                    <span style={{ color: 'var(--text-dim)' }}>{q.time_limit} دقيقة</span>
                  </div>
                )) : <p style={{ color: 'var(--text-dim)' }}>لا توجد كويزات متاحة حالياً</p>
              ) : (
                <div>
                  <h3 style={{ marginBottom: 16 }}>{activeQuiz.title}</h3>
                  {activeQuiz.questions?.map((q, i) => (
                    <div key={q.id} className="quiz-question-card" style={{ marginBottom: 24, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid var(--border-plasma)' }}>
                      <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '1.05rem' }}>
                        <span style={{ color: 'var(--neon-blue)', marginLeft: 8 }}>{i + 1}.</span>
                        {q.question}
                      </p>
                      {q.image_url && (
                        <div style={{ marginBottom: 14 }}>
                          <img src={q.image_url} alt={`صورة السؤال ${i + 1}`} style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 10, border: '1px solid var(--border-plasma)' }} />
                        </div>
                      )}
                      {['A', 'B', 'C', 'D'].filter(k => q[`option_${k.toLowerCase()}`]).map(opt => (
                        <label key={opt} className="option-item" style={{ borderColor: quizResult && activeQuiz.questions[i]?.correct_answer === opt ? 'var(--neon-green)' : undefined }}>
                          <input type="radio" name={`q_${q.id}`} value={opt} checked={quizAnswers[q.id] === opt} onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })} />
                          <span>{q[`option_${opt.toLowerCase()}`]}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                  {!quizResult ? (
                    <button className="btn-primary" onClick={submitQuiz}>
                      <i className="fa-solid fa-paper-plane"></i> تسليم الإجابة
                    </button>
                  ) : (
                    <div className={`quiz-verdict ${quizResult.passed ? 'correct' : 'wrong'}`}>
                      <strong>{quizResult.passed ? '🎉 نجحت!' : '❌ لم تنجح'}</strong><br />
                      الدرجة: {quizResult.score}% — {quizResult.passed ? 'أحسنت!' : 'حاول مرة أخرى'}
                      <button className="btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setActiveQuiz(null); setQuizResult(null) }}>العودة لقائمة الكويزات</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Homework Tab */}
          {tab === 'homework' && (
            <div className="glass-box">
              <h2 style={{ color: 'var(--neon-green)', marginBottom: 16 }}><i className="fa-solid fa-upload"></i> تسليم الواجبات</h2>
              
              {/* Submit new homework */}
              {selectedCourse?.sheets?.length > 0 ? (
                <>
                  <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>ارفع صورة أو ملف PDF لحل مسائل الشيت</p>
                  {selectedCourse.sheets.map(sheet => (
                    <div key={sheet.id} style={{ marginBottom: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-plasma)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700 }}><i className="fa-solid fa-file-lines" style={{ color: 'var(--atom-gold)', marginLeft: 8 }}></i>{sheet.title}</span>
                        {sheet.file_url && <a href={sheet.file_url} target="_blank" rel="noreferrer" className="action-btn"><i className="fa-solid fa-download"></i> تحميل الشيت</a>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input type="file" accept="image/*,.pdf" onChange={e => setHomeworkFile(e.target.files[0])} style={{ flex: 1, color: 'var(--text-dim)' }} />
                        <button className="btn-primary btn-sm" onClick={() => submitHomework(sheet.id)} disabled={uploadingHw}>
                          <i className={`fa-solid ${uploadingHw ? 'fa-spinner fa-spin' : 'fa-upload'}`}></i> {uploadingHw ? 'جاري التسليم...' : 'تسليم'}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 30 }}>لا توجد شيتات في هذا الكورس</p>
              )}

              {/* My submitted homework */}
              {myHomework.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 12, color: 'var(--neon-blue)' }}><i className="fa-solid fa-clock-rotate-left"></i> واجباتي السابقة</h3>
                  <table className="data-table">
                    <thead><tr><th>الشيت</th><th>الكورس</th><th>التاريخ</th><th>الحالة</th><th>الدرجة</th></tr></thead>
                    <tbody>
                      {myHomework.map(hw => (
                        <tr key={hw.id}>
                          <td>{hw.sheet_title}</td>
                          <td>{hw.course_title}</td>
                          <td>{new Date(hw.submitted_at).toLocaleDateString('ar-EG')}</td>
                          <td><span className={`status-badge ${hw.status === 'graded' ? 'status-active' : 'status-pending'}`}>{hw.status === 'graded' ? 'تم التصحيح' : 'قيد المراجعة'}</span></td>
                          <td>{hw.grade !== null ? `${hw.grade}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Rankings Tab */}
          {tab === 'ranks' && (
            <div className="glass-box">
              <h2 style={{ color: 'var(--atom-gold)', marginBottom: 16 }}><i className="fa-solid fa-trophy"></i> فرسان المنصة</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaderboard.map((l, i) => (
                  <div key={l.id} className="lesson-node" style={{ borderColor: i < 3 ? 'var(--atom-gold)' : undefined, background: i === 0 ? 'rgba(255,190,11,0.08)' : undefined }}>
                    <span>{['🥇','🥈','🥉'][i] || `${i+1}.`} {l.name}</span>
                    <strong style={{ color: i === 0 ? 'var(--atom-gold)' : 'var(--text-dim)' }}>{l.energy} جول</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
