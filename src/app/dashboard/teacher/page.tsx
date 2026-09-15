'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  energy: number;
}

interface TeacherCourse {
  id: number;
  title: string;
  stage: string;
  lecture_count: number;
  student_count: number;
  is_published: number;
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [tab, setTab] = useState<'courses' | 'create'>('courses');
  const [form, setForm] = useState({ title: '', description: '', stage: 'الصف الأول الثانوي', price: '' });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }

    const parsed = JSON.parse(userData);
    if (parsed.role !== 'teacher') { router.push('/login'); return; }
    setUser(parsed);

    fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); });
  }, [router]);

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, price: Number(form.price) || 0 }),
    });
    if (res.ok) {
      setTab('courses');
      setForm({ title: '', description: '', stage: 'الصف الأول الثانوي', price: '' });
      fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCourses(data); });
    }
  };

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
            <h1 className="text-2xl font-bold mb-2">مرحباً، الأستاذ {user.name} 🎓</h1>
            <p className="text-gray-400">إدارة الكورسات والمحاضرات</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => setTab('courses')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'courses' ? 'tab-active' : 'tab-inactive'}`}>
              <i className="fas fa-book ml-1"></i>كورساتي
            </button>
            <button onClick={() => setTab('create')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'create' ? 'tab-active' : 'tab-inactive'}`}>
              <i className="fas fa-plus ml-1"></i>إنشاء كورس
            </button>
          </div>

          {tab === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="glass-card p-6 cursor-pointer" onClick={() => router.push(`/courses/${course.id}`)}>
                  <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                  <span className="badge badge-blue text-xs">{course.stage}</span>
                  <div className="flex justify-between mt-4 text-sm text-gray-400">
                    <span><i className="fas fa-video ml-1"></i>{course.lecture_count}</span>
                    <span><i className="fas fa-users ml-1"></i>{course.student_count}</span>
                  </div>
                  <div className="mt-3">
                    {course.is_published === 1 ? (
                      <span className="badge badge-green">منشور</span>
                    ) : (
                      <span className="badge badge-yellow">مسودة</span>
                    )}
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <i className="fas fa-book-open text-5xl mb-4 block"></i>
                  <p>لم تإنشاء أي كورس بعد</p>
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <div className="glass p-8 max-w-2xl">
              <h2 className="text-xl font-bold mb-6">إنشاء كورس جديد</h2>
              <form onSubmit={createCourse} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">اسم الكورس</label>
                  <input className="input-field" placeholder="مثال: فيزياء 1 ثانوي" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">الوصف</label>
                  <textarea className="input-field min-h-[100px]" placeholder="وصف الكورس..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">المرحلة</label>
                  <select className="input-field" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-plus-circle ml-2"></i>إنشاء الكورس
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
