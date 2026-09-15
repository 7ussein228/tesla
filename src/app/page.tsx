'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [courses, setCourses] = useState<{ id: number; title: string; description: string; stage: string; teacher_name: string; lecture_count: number; student_count: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ id: number; name: string; energy: number }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(setCourses).catch(() => {});
    fetch('/api/admin/leaderboard').then(r => r.json()).then(setLeaderboard).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6">
            <span className="glass-card px-4 py-2 text-sm text-[var(--color-neon-blue)]">
              <i className="fas fa-rocket ml-2"></i>مرحباً بك في عالم العلوم
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-l from-[var(--color-neon-blue)] via-[var(--color-neon-purple)] to-[var(--color-neon-pink)] bg-clip-text text-transparent">
              منصة نيوتن
            </span>
            <br />
            <span className="text-2xl md:text-3xl text-gray-300 font-semibold">
              في الفيزياء والعلوم
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            منصة تعليمية متكاملة تقدم لك أفضل المحتويات التعليمية في الفيزياء والعلوم مع اختبارات تفاعلية ومتابعة مستمرة
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              <i className="fas fa-rocket ml-2"></i>ابدأ رحلتك الآن
            </Link>
            <Link href="/courses" className="btn-secondary text-lg px-8 py-3">
              <i className="fas fa-book ml-2"></i>تصفح الكورسات
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
              لماذا منصة نيوتن؟
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'fa-video', title: 'محاضرات مسجلة', desc: 'محاضرات فيديو عالية الجودة مع شرح مبسط' },
              { icon: 'fa-question-circle', title: 'اختبارات تفاعلية', desc: 'اختبارات فورية مع تقييم وتصحيح تلقائي' },
              { icon: 'fa-chart-line', title: 'تتبع التقدم', desc: 'متابعة مستمرة لمستوى التعلم والإنجاز' },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center">
                  <i className={`fas ${item.icon} text-2xl text-white`}></i>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
                أحدث الكورسات
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.slice(0, 6).map(course => (
                <div key={course.id} className="glass-card p-6 cursor-pointer" onClick={() => router.push(`/courses/${course.id}`)}>
                  <div className="h-40 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)]/20 to-[var(--color-neon-purple)]/20 flex items-center justify-center mb-4">
                    <i className="fas fa-book-open text-4xl text-[var(--color-neon-blue)]"></i>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="badge badge-blue">{course.stage}</span>
                    <span className="text-gray-500"><i className="fas fa-user ml-1"></i>{course.teacher_name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span><i className="fas fa-video ml-1"></i>{course.lecture_count} محاضرة</span>
                    <span><i className="fas fa-users ml-1"></i>{course.student_count} طالب</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {leaderboard.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
                لوحة المتصدرين
              </span>
            </h2>
            <div className="glass-card p-6">
              {leaderboard.slice(0, 5).map((leader, i) => (
                <div key={leader.id} className="flex items-center gap-4 py-3 border-b border-[var(--color-dark-border)] last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-300/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">{leader.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--color-neon-blue)]">
                    <i className="fas fa-bolt"></i>
                    <span className="font-bold">{leader.energy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 px-6 border-t border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2026 منصة نيوتن في الفيزياء والعلوم. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
