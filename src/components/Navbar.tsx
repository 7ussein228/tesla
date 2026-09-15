'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  stage: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  if (!user) {
    return (
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center">
              <i className="fas fa-atom text-white text-lg"></i>
            </div>
            <span className="text-lg font-bold bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
              منصة نيوتن
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              <i className="fas fa-sign-in-alt ml-2"></i>تسجيل الدخول
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              <i className="fas fa-user-plus ml-2"></i>إنشاء حساب
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const dashboardLink = user.role === 'admin' ? '/dashboard/admin' : user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href={dashboardLink} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center">
            <i className="fas fa-atom text-white text-lg"></i>
          </div>
          <span className="text-lg font-bold bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
            منصة نيوتن
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/courses" className={`text-sm ${pathname === '/courses' ? 'text-[var(--color-neon-blue)]' : 'text-gray-400 hover:text-white'} transition`}>
            <i className="fas fa-book ml-1"></i>الكورسات
          </Link>
          {user.role === 'student' && (
            <>
              <Link href="/dashboard/student" className={`text-sm ${pathname === '/dashboard/student' ? 'text-[var(--color-neon-blue)]' : 'text-gray-400 hover:text-white'} transition`}>
                <i className="fas fa-home ml-1"></i>لوحة التحكم
              </Link>
            </>
          )}
          {user.role === 'teacher' && (
            <Link href="/dashboard/teacher" className={`text-sm ${pathname === '/dashboard/teacher' ? 'text-[var(--color-neon-blue)]' : 'text-gray-400 hover:text-white'} transition`}>
              <i className="fas fa-chalkboard-teacher ml-1"></i>لوحة المعلم
            </Link>
          )}
          {user.role === 'admin' && (
            <Link href="/dashboard/admin" className={`text-sm ${pathname === '/dashboard/admin' ? 'text-[var(--color-neon-blue)]' : 'text-gray-400 hover:text-white'} transition`}>
              <i className="fas fa-cog ml-1"></i>لوحة الإدارة
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <span className="text-sm hidden md:inline">{user.name}</span>
          </div>
          <button onClick={logout} className="text-gray-400 hover:text-red-400 transition text-sm">
            <i className="fas fa-sign-out-alt"></i>
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-[var(--color-dark-border)] pt-4 flex flex-col gap-3">
          <Link href="/courses" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
            <i className="fas fa-book ml-2"></i>الكورسات
          </Link>
          <Link href={dashboardLink} onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white">
            <i className="fas fa-home ml-2"></i>لوحة التحكم
          </Link>
          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300 text-right">
            <i className="fas fa-sign-out-alt ml-2"></i>تسجيل الخروج
          </button>
        </div>
      )}
    </nav>
  );
}
