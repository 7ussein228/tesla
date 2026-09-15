import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const dashPath = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>تعلّم <span>الفيزياء والعلوم</span> بطريقة تانية خالص</h1>
          <p>منصة نيوتن للتعليم الإلكتروني — فيزياء وعلوم متكاملة للمراحل الإعدادية والثانوية. محاضرات مسجلة بجودة عالية، شيتات تفاعلية، كويزات فورية، وشهادات تكريم.</p>
          <div className="hero-actions">
            {user ? (
              <Link to={dashPath} className="btn-primary">
                <i class="fa-solid fa-arrow-left"></i> ادخل لوحة التحكم
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  <i className="fa-solid fa-rocket"></i> ابدأ رحلتك العلمية
                </Link>
                <Link to="/courses" className="btn-secondary">
                  <i className="fa-solid fa-eye"></i> تصفح الكورسات
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="atom-animation">
            <div className="orbit"></div>
            <div className="orbit"></div>
            <div className="orbit"></div>
            <div className="atom-nucleus">
              <i className="fa-solid fa-atom"></i>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card"><div className="stat-header"><span className="stat-label">طالب مسجل</span><div className="stat-icon"><i className="fa-solid fa-users"></i></div></div><div className="stat-value">1,200+</div></div>
          <div className="stat-card"><div className="stat-header"><span className="stat-label">محاضرة مسجلة</span><div className="stat-icon"><i className="fa-solid fa-video"></i></div></div><div className="stat-value">85+</div></div>
          <div className="stat-card"><div className="stat-header"><span className="stat-label">سؤال كويز</span><div className="stat-icon"><i className="fa-solid fa-question-circle"></i></div></div><div className="stat-value">500+</div></div>
          <div className="stat-card"><div className="stat-header"><span className="stat-label">نسبة الرضا</span><div className="stat-icon"><i className="fa-solid fa-star"></i></div></div><div className="stat-value">98%</div></div>
        </div>

        <h2 className="section-title">ليه منصة نيوتن؟</h2>
        <p className="section-subtitle">كل اللي محتاجه عشان تتفوق في الفيزياء والعلوم في مكان واحد</p>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-video"></i></div><h3>محاضرات مسجلة</h3><p>فيديوهات بجودة عالية مع شرح تفاعلي وأمثلة تطبيقية</p></div>
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-file-lines"></i></div><h3>شيتات وواجبات</h3><p>شيتات حل مسائل مع تصحيح إلكتروني ذكي</p></div>
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-brain"></i></div><h3>كويزات تفاعلية</h3><p>اختبارات قصيرة بعد كل محاضرة لقياس التقدم</p></div>
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-certificate"></i></div><h3>شهادات تقدير</h3><p>شهادات إلكترونية موثقة للطلاب المتميزين</p></div>
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-ranking-star"></i></div><h3>لوحة الأوائل</h3><p>تنافس مع زملائك في لوحة شرف الطاقة والإنجاز</p></div>
          <div className="feature-card"><div className="feature-icon"><i className="fa-solid fa-headset"></i></div><h3>دعم فني مباشر</h3><p>تواصل مع المساعدين على واتساب وتليجرام</p></div>
        </div>

        <div style={{ marginTop: 60 }}>
          <h2 className="section-title">كورساتنا المميزة</h2>
          <p className="section-subtitle">كورسات مصممة بعناية لتغطي المنهج المصري بالكامل</p>
          <div className="content-grid">
            <Link to="/courses" className="course-card" style={{ cursor: 'pointer' }}>
              <div className="course-thumb" style={{ background: 'linear-gradient(135deg, rgba(0,210,255,0.2), rgba(157,78,221,0.15))' }}>
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="course-info">
                <span className="course-stage stage-sec3">ثالث ثانوي</span>
                <h3>فيزياء 3 ثانوي - الكهربية</h3>
                <p>قانون أوم، توصيل المقاومات، قوانين كيرشوف</p>
                <div className="course-footer"><span className="course-price">600 ج.م</span><span className="course-stat"><i className="fa-solid fa-video"></i> 24 محاضرة</span></div>
              </div>
            </Link>
            <Link to="/courses" className="course-card" style={{ cursor: 'pointer' }}>
              <div className="course-thumb" style={{ background: 'linear-gradient(135deg, rgba(0,245,212,0.2), rgba(0,210,255,0.15))' }}>
                <i className="fa-solid fa-flask"></i>
              </div>
              <div className="course-info">
                <span className="course-stage stage-sec1">أول ثانوي</span>
                <h3>علوم متكاملة 1 ثانوي</h3>
                <p>النظام البيئي، التفاعلات الكيميائية، مصادر الطاقة</p>
                <div className="course-footer"><span className="course-price">500 ج.م</span><span className="course-stat"><i className="fa-solid fa-video"></i> 20 محاضرة</span></div>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 60 }}>
          <div className="cta-box">
            <h2>مستعد تبدأ رحلتك في الفيزياء؟</h2>
            <p>سجل دلوقتي واحصل على أول محاضرة مجاناً</p>
            <Link to={user ? dashPath : '/register'} className="btn-primary" style={{ margin: '0 auto' }}>
              <i className="fa-solid fa-rocket"></i> {user ? 'ادخل المنصة' : 'سجل مجاناً الآن'}
            </Link>
          </div>
        </div>
      </div>

      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand"><i className="fa-solid fa-atom"></i> منصة نيوتن</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, marginTop: 10 }}>منصة تعليمية متخصصة في تدريس الفيزياء والعلوم المتكاملة للمراحل الإعدادية والثانوية.</p>
          </div>
          <div className="footer-col"><h4>روابط سريعة</h4><Link to="/">الرئيسية</Link><Link to="/courses">الكورسات</Link><Link to="/student">لوحة الطالب</Link></div>
          <div className="footer-col"><h4>الكورسات</h4><Link to="/courses">فيزياء 3 ثانوي</Link><Link to="/courses">علوم 1 ثانوي</Link><Link to="/courses">علوم 3 إعدادي</Link></div>
          <div className="footer-col"><h4>تواصل معنا</h4><a href="#"><i className="fa-brands fa-whatsapp"></i> واتساب</a><a href="#"><i className="fa-brands fa-telegram"></i> تليجرام</a><a href="#"><i className="fa-brands fa-youtube"></i> يوتيوب</a></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 منصة نيوتن في الفيزياء والعلوم</span>
          <span>صُنع بـ <i className="fa-solid fa-heart" style={{ color: 'var(--neon-green)' }}></i> للمتفوقين</span>
        </div>
      </footer>
    </>
  )
}
