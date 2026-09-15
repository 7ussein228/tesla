'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  stage: string;
  energy: number;
}

interface EnrolledCourse {
  id: number;
  title: string;
  stage: string;
  teacher_name: string;
  progress: number;
  lecture_count: number;
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [tab, setTab] = useState<'courses' | 'quizzes' | 'homework' | 'leaderboard'>('courses');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }

    const parsed = JSON.parse(userData);
    if (parsed.role !== 'student') { router.push('/login'); return; }
    setUser(parsed);

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.id) setUser(data); });

    fetch('/api/courses/my', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); });
  }, [router]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <i className="fas fa-spinner fa-spin text-4xl text-[var(--color-neon-blue)]"></i>
    </div>
  );

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="glass p-6 mb-8">
            <h1 className="text-2xl font-bold mb-2">مرحباً، {user.name} 👋</h1>
            <p className="text-gray-400">{user.stage || 'لم تحدد مرحلتك'}</p>
            <div className="flex items-center gap-2 mt-3">
              <i className="fas fa-bolt text-[var(--color-neon-blue)]"></i>
              <span className="font-bold text-lg">{user.energy}</span>
              <span className="text-gray-400 text-sm">نقطة طاقة</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { key: 'courses', icon: 'fa-book', label: 'كورساتي' },
              { key: 'quizzes', icon: 'fa-question-circle', label: 'الاختبارات' },
              { key: 'homework', icon: 'fa-file-alt', label: 'الواجبات' },
              { key: 'leaderboard', icon: 'fa-trophy', label: 'المتصدرين' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === item.key ? 'tab-active' : 'tab-inactive'}`}
              >
                <i className={`fas ${item.icon} ml-1`}></i>{item.label}
              </button>
            ))}
          </div>

          {tab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">كورساتي المسجلة</h2>
                <button onClick={() => router.push('/courses')} className="btn-secondary text-sm px-4 py-2">
                  <i className="fas fa-plus ml-1"></i>تصفح الكورسات
                </button>
              </div>
              {courses.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <i className="fas fa-book-open text-5xl mb-4 block"></i>
                  <p>لم تسجل في أي كورس بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="glass-card p-6 cursor-pointer" onClick={() => router.push(`/courses/${course.id}`)}>
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-400 mb-3">{course.stage}</p>
                      <div className="progress-bar mb-2">
                        <div className="progress-bar-fill" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{course.progress}% مكتمل</span>
                        <span>{course.lecture_count} محاضرة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'leaderboard' && <LeaderboardTab />}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const [leaders, setLeaders] = useState<{ id: number; name: string; energy: number }[]>([]);

  useEffect(() => {
    fetch('/api/admin/leaderboard').then(r => r.json()).then(data => { if (Array.isArray(data)) setLeaders(data); });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">
        <i className="fas fa-trophy ml-2 text-yellow-400"></i>لوحة المتصدرين
      </h2>
      <div className="glass-card p-6">
        {leaders.map((leader, i) => (
          <div key={leader.id} className="flex items-center gap-4 py-3 border-b border-[var(--color-dark-border)] last:border-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
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
        {leaders.length === 0 && <p className="text-gray-400 text-center py-8">لا يوجد بيانات</p>}
      </div>
    </div>
  );
}
