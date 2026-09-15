'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') router.push('/dashboard/admin');
      else if (data.user.role === 'teacher') router.push('/dashboard/teacher');
      else router.push('/dashboard/student');
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
            <i className="fas fa-atom text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="text-gray-400 text-sm mt-2">أدخل بياناتك للدخول إلى المنصة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              <i className="fas fa-exclamation-circle ml-2"></i>{error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">كلمة المرور</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin ml-2"></i>جاري التسجيل...</>
            ) : (
              <><i className="fas fa-sign-in-alt ml-2"></i>تسجيل الدخول</>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-[var(--color-neon-blue)] hover:underline">سجل الآن</Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-black/20 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">حسابات تجريبية:</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p><span className="text-[var(--color-neon-blue)]">طالب:</span> rawan@student.com / 123456</p>
            <p><span className="text-[var(--color-neon-blue)]">معلم:</span> teacher@newton.edu / 123456</p>
            <p><span className="text-[var(--color-neon-blue)]">admin:</span> admin@newton.edu / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
