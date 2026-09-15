import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function QuizBuilder() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('course_id')

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(courseId || '')
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState(15)
  const [passingScore, setPassingScore] = useState(60)
  const [questions, setQuestions] = useState([])
  const [quizCreated, setQuizCreated] = useState(false)
  const [quizId, setQuizId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraQuestionIdx, setCameraQuestionIdx] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [uploadingImage, setUploadingImage] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/courses/teacher/my-courses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setCourses(Array.isArray(data) ? data : [])
        if (courseId) setSelectedCourse(courseId)
      }).catch(() => {})
  }, [token, courseId])

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_answer: 'A', points: 1, image_url: ''
    }])
  }

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setQuestions(updated)
  }

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const duplicateQuestion = (idx) => {
    const dup = { ...questions[idx], question: questions[idx].question + ' (نسخة)' }
    const updated = [...questions]
    updated.splice(idx + 1, 0, dup)
    setQuestions(updated)
  }

  const moveQuestion = (idx, dir) => {
    const updated = [...questions]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= updated.length) return
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    setQuestions(updated)
  }

  const createQuiz = async () => {
    if (!selectedCourse || !quizTitle.trim()) return alert('اختر الكورس واكتب عنوان الكويز')
    setSaving(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          course_id: selectedCourse, title: quizTitle, description: quizDescription,
          time_limit: timeLimit, passing_score: passingScore, questions: []
        })
      })
      if (res.ok) {
        const data = await res.json()
        setQuizId(data.id)
        setQuizCreated(true)
      }
    } catch (e) { alert('خطأ في إنشاء الكويز') }
    setSaving(false)
  }

  const saveQuestions = async () => {
    if (!quizId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions })
      })
      if (res.ok) alert('تم حفظ الأسئلة بنجاح!')
    } catch (e) { alert('خطأ في الحفظ') }
    setSaving(false)
  }

  const uploadImage = async (file, idx) => {
    setUploadingImage(idx)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await fetch('/api/quizzes/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        updateQuestion(idx, 'image_url', data.url)
      }
    } catch (e) { alert('خطأ في رفع الصورة') }
    setUploadingImage(null)
  }

  const handleImageDrop = (e, idx) => {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file) uploadImage(file, idx)
  }

  // Camera OCR
  const startCamera = async (idx) => {
    setCameraQuestionIdx(idx)
    setShowCamera(true)
    setScanResult('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (e) {
      alert('لا يمكن الوصول للكاميرا. تأكد من إعطاء الإذن.')
      setShowCamera(false)
    }
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return
    setScanning(true)
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    // Convert to base64 and send to a simple OCR endpoint
    // For now, we'll use a client-side approach with the image
    const imageData = canvas.toDataURL('image/png')

    // Use Tesseract.js-like approach via API
    try {
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const formData = new FormData()
      formData.append('image', blob, 'scan.png')

      // Try using the upload endpoint and manual entry as fallback
      const res = await fetch('/api/quizzes/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        updateQuestion(cameraQuestionIdx, 'image_url', data.url)
        setScanResult('تم رفع الصورة بنجاح! اكتب السؤال يدوياً أو الصق النص من الصورة.')
      }
    } catch (e) {
      setScanResult('تم التقاط الصورة. اكتب السؤال يدوياً.')
    }
    setScanning(false)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setCameraQuestionIdx(null)
  }

  useEffect(() => {
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        const activeIdx = questions.length - 1
        if (activeIdx >= 0) uploadImage(file, activeIdx)
      }
    }
  }

  return (
    <div className="container" onPaste={handlePaste}>
      <div className="energy-banner">
        <div>
          <h2 style={{ fontWeight: 800 }}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--atom-gold)', marginLeft: 10 }}></i>
            منشئ الكويزات الذكي
          </h2>
          <p style={{ color: 'var(--text-dim)', marginTop: 4 }}>أنشئ أسئلة تفاعلية مع صور وكاميرا</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/teacher')}>
          <i className="fa-solid fa-arrow-right"></i> العودة للوحة المدرس
        </button>
      </div>

      {/* Quiz Setup */}
      {!quizCreated ? (
        <div className="glass-box">
          <h3 style={{ marginBottom: 20, color: 'var(--neon-blue)' }}>
            <i className="fa-solid fa-gear"></i> إعدادات الكويز
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label><i className="fa-solid fa-book"></i> الكورس</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">اختر الكورس</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-heading"></i> عنوان الكويز</label>
              <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="مثال: كويز قانون أوم" />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-clock"></i> الوقت (دقيقة)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || 15)} min="1" />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-percent"></i> درجة النجاح (%)</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value) || 60)} min="0" max="100" />
            </div>
          </div>
          <div className="form-group">
            <label><i className="fa-solid fa-align-right"></i> وصف الكويز</label>
            <textarea value={quizDescription} onChange={e => setQuizDescription(e.target.value)} placeholder="وصف اختياري للكويز..." />
          </div>
          <button className="btn-primary" onClick={createQuiz} disabled={saving} style={{ marginTop: 8 }}>
            <i className="fa-solid fa-rocket"></i> {saving ? 'جاري الإنشاء...' : 'إنشاء الكويز'}
          </button>
        </div>
      ) : (
        <>
          {/* Quiz Info Bar */}
          <div className="glass-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
            <div>
              <h3 style={{ color: 'var(--neon-green)' }}>
                <i className="fa-solid fa-circle-check"></i> {quizTitle}
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
                {questions.length} سؤال • {timeLimit} دقيقة • درجة النجاح: {passingScore}%
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={saveQuestions} disabled={saving}>
                <i className="fa-solid fa-floppy-disk"></i> {saving ? 'جاري الحفظ...' : 'حفظ الأسئلة'}
              </button>
              <button className="btn-secondary" onClick={() => navigate('/teacher')}>
                <i className="fa-solid fa-check"></i> تم
              </button>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, idx) => (
            <div key={idx} className="glass-box question-card" style={{ position: 'relative' }}>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="question-number">{idx + 1}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-star" style={{ color: 'var(--atom-gold)', marginLeft: 4 }}></i>
                    {q.points} نقطة
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="action-btn" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="تحريك لأعلى">
                    <i className="fa-solid fa-arrow-up"></i>
                  </button>
                  <button className="action-btn" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="تحريك لأسفل">
                    <i className="fa-solid fa-arrow-down"></i>
                  </button>
                  <button className="action-btn" onClick={() => duplicateQuestion(idx)} title="تكرار السؤال">
                    <i className="fa-solid fa-copy"></i>
                  </button>
                  <button className="action-btn danger" onClick={() => removeQuestion(idx)} title="حذف السؤال">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Question Text + Image Upload */}
              <div style={{ display: 'grid', gridTemplateColumns: q.image_url ? '1fr 250px' : '1fr', gap: 16 }}>
                <div>
                  <textarea
                    className="question-textarea"
                    value={q.question}
                    onChange={e => updateQuestion(idx, 'question', e.target.value)}
                    placeholder={`السؤال ${idx + 1}: اكتب السؤال هنا...`}
                    rows={3}
                  />
                </div>
                {q.image_url && (
                  <div className="question-image-preview">
                    <img src={q.image_url} alt="صورة السؤال" />
                    <button className="action-btn danger" style={{ position: 'absolute', top: 8, left: 8 }} onClick={() => updateQuestion(idx, 'image_url', '')}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Image Upload Tools */}
              <div className="question-tools" style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
                <label className="action-btn tool-btn" style={{ cursor: 'pointer' }}>
                  <i className="fa-solid fa-image"></i> رفع صورة
                  <input type="file" accept="image/*" hidden onChange={e => e.target.files[0] && uploadImage(e.target.files[0], idx)} />
                </label>
                <button className="action-btn tool-btn" onClick={() => startCamera(idx)}>
                  <i className="fa-solid fa-camera"></i> كاميرا
                </button>
                <label className="action-btn tool-btn" style={{ cursor: 'pointer' }}>
                  <i className="fa-solid fa-file-pdf"></i> رفع PDF
                  <input type="file" accept=".pdf" hidden onChange={e => e.target.files[0] && uploadImage(e.target.files[0], idx)} />
                </label>
                {uploadingImage === idx && (
                  <span style={{ color: 'var(--neon-blue)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> جاري الرفع...
                  </span>
                )}
              </div>

              {/* Drag & Drop Zone */}
              <div
                className="image-drop-zone"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleImageDrop(e, idx)}
                style={{ display: q.image_url ? 'none' : 'block' }}
              >
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.2rem', color: 'var(--neon-blue)' }}></i>
                <span>اسحب صورة هنا أو الصق من الحافظة (Ctrl+V)</span>
              </div>

              {/* MCQ Options */}
              <div className="options-grid" style={{ marginTop: 16 }}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} className={`option-input-row ${q.correct_answer === opt ? 'correct' : ''}`}>
                    <label className="option-label" onClick={() => updateQuestion(idx, 'correct_answer', opt)}>
                      <input
                        type="radio"
                        name={`correct_${idx}`}
                        checked={q.correct_answer === opt}
                        onChange={() => updateQuestion(idx, 'correct_answer', opt)}
                      />
                      <span className={`option-letter ${q.correct_answer === opt ? 'active' : ''}`}>{opt}</span>
                    </label>
                    <input
                      className="option-input"
                      value={q[`option_${opt.toLowerCase()}`]}
                      onChange={e => updateQuestion(idx, `option_${opt.toLowerCase()}`, e.target.value)}
                      placeholder={`الخيار ${opt}`}
                    />
                    {q.correct_answer === opt && (
                      <span className="correct-badge"><i className="fa-solid fa-check"></i></span>
                    )}
                  </div>
                ))}
              </div>

              {/* Points */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>النقاط:</label>
                <select value={q.points} onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value))} className="points-select">
                  {[1, 2, 3, 5, 10].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button className="add-question-btn" onClick={addQuestion}>
            <i className="fa-solid fa-circle-plus"></i>
            <span>إضافة سؤال جديد</span>
          </button>
        </>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="modal-overlay active" onClick={stopCamera}>
          <div className="modal-box camera-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={stopCamera}><i className="fa-solid fa-xmark"></i></button>
            <h2 style={{ marginBottom: 16 }}><i className="fa-solid fa-camera" style={{ color: 'var(--neon-blue)' }}></i> كاميرا المسح</h2>
            <div className="camera-container">
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            {scanResult && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,245,212,0.1)', borderRadius: 10, color: 'var(--neon-green)' }}>
                <i className="fa-solid fa-check-circle"></i> {scanResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={captureAndScan} disabled={scanning}>
                <i className={`fa-solid ${scanning ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                {scanning ? 'جاري المسح...' : 'التقاط ورفع'}
              </button>
              <button className="btn-secondary" onClick={stopCamera}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
