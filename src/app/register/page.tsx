'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', stage: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'student' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard/student');
    } catch {
      setError('خطأ في الاتصال بالخادم');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="glass p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center animate-glow">
            <i className="fas fa-user-plus text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
          <p className="text-gray-400 text-sm mt-2">سجّل الآن وابدأ رحلة التعلم</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              <i className="fas fa-exclamation-circle ml-2"></i>{error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">الاسم الكامل</label>
            <input type="text" className="input-field" placeholder="أدخل اسمك" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
            <input type="email" className="input-field" placeholder="example@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">كلمة المرور</label>
            <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">المرحلة الدراسية</label>
            <select className="input-field" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>
              <option value="">اختر المرحلة</option>
              <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
              <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
              <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">رقم الهاتف (اختياري)</label>
            <input type="tel" className="input-field" placeholder="01XXXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin ml-2"></i>جاري التسجيل...</>
            ) : (
              <><i className="fas fa-user-plus ml-2"></i>إنشاء حساب</>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-[var(--color-neon-blue)] hover:underline">سجل دخولك</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
