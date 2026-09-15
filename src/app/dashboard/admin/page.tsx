'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Stats {
  students: number;
  teachers: number;
  courses: number;
  publishedCourses: number;
  enrollments: number;
  quizAttempts: number;
  homeworkCount: number;
  pendingHomework: number;
  totalEnergy: number;
  recentUsers: { id: number; name: string; email: string; role: string; stage: string }[];
}

export default function AdminDashboard() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<'overview' | 'users' | 'courses'>('overview');
  const [users, setUsers] = useState<{ id: number; name: string; email: string; role: string; stage: string; energy: number }[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin') { router.push('/login'); return; }
    setUser(parsed);

    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.students !== undefined) setStats(data); });
  }, [router]);

  useEffect(() => {
    if (tab === 'users') {
      const token = localStorage.getItem('token');
      fetch(`/api/admin/users?role=${roleFilter}&search=${search}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setUsers(data); });
    }
  }, [tab, roleFilter, search]);

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
            <h1 className="text-2xl font-bold mb-2">لوحة الإدارة 👑</h1>
            <p className="text-gray-400">مرحباً، {user.name}</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { key: 'overview', icon: 'fa-chart-bar', label: 'نظرة عامة' },
              { key: 'users', icon: 'fa-users', label: 'المستخدمين' },
              { key: 'courses', icon: 'fa-book', label: 'الكورسات' },
            ].map(item => (
              <button key={item.key} onClick={() => setTab(item.key as typeof tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === item.key ? 'tab-active' : 'tab-inactive'}`}>
                <i className={`fas ${item.icon} ml-1`}></i>{item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && stats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="stat-card">
                  <div className="stat-value">{stats.students}</div>
                  <div className="stat-label">طالب</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.teachers}</div>
                  <div className="stat-label">معلم</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.courses}</div>
                  <div className="stat-label">كورس</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.enrollments}</div>
                  <div className="stat-label">تسجيل</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.quizAttempts}</div>
                  <div className="stat-label">محاولة اختبار</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.pendingHomework}</div>
                  <div className="stat-label">واجب معلّق</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.totalEnergy}</div>
                  <div className="stat-label">إجمالي الطاقة</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.publishedCourses}</div>
                  <div className="stat-label">كورس منشور</div>
                </div>
              </div>

              {stats.recentUsers.length > 0 && (
                <div className="glass p-6">
                  <h2 className="text-xl font-bold mb-4">آخر المسجلين</h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>البريد</th>
                          <th>الدور</th>
                          <th>المرحلة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentUsers.map(u => (
                          <tr key={u.id}>
                            <td className="font-semibold">{u.name}</td>
                            <td className="text-gray-400 text-sm">{u.email}</td>
                            <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'teacher' ? 'badge-yellow' : 'badge-blue'}`}>
                              {u.role === 'admin' ? 'مدير' : u.role === 'teacher' ? 'معلم' : 'طالب'}
                            </span></td>
                            <td className="text-gray-400 text-sm">{u.stage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="glass p-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <input className="input-field max-w-xs" placeholder="بحث بالاسم أو البريد..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="input-field max-w-[160px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  <option value="all">الكل</option>
                  <option value="student">طلاب</option>
                  <option value="teacher">معلمين</option>
                  <option value="admin">مدراء</option>
                </select>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>البريد</th>
                      <th>الدور</th>
                      <th>المرحلة</th>
                      <th>الطاقة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td className="text-gray-400 text-sm">{u.email}</td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'teacher' ? 'badge-yellow' : 'badge-blue'}`}>
                          {u.role === 'admin' ? 'مدير' : u.role === 'teacher' ? 'معلم' : 'طالب'}
                        </span></td>
                        <td className="text-gray-400 text-sm">{u.stage}</td>
                        <td className="text-[var(--color-neon-blue)] font-bold">{u.energy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
