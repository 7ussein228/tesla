'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Lecture {
  id: number;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  is_free: number;
}

interface Quiz {
  id: number;
  title: string;
  time_limit: number;
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  stage: string;
  teacher_name: string;
  price: number;
  lectures: Lecture[];
  quizzes: Quiz[];
  sheets: { id: number; title: string; file_url: string }[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`/api/courses/${id}`)
      .then(r => r.json())
      .then(data => { setCourse(data); setLoading(false); })
      .catch(() => setLoading(false));

    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(user => {
          if (user.role === 'student') {
            fetch('/api/courses/my', { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then(myCourses => {
                if (Array.isArray(myCourses)) {
                  setEnrolled(myCourses.some((c: { id: number }) => c.id === Number(id)));
                }
              });
          }
        });
    }
  }, [id]);

  const handleEnroll = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const res = await fetch(`/api/courses/${id}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setEnrolled(true);
    else alert(data.error);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <i className="fas fa-spinner fa-spin text-4xl text-[var(--color-neon-blue)]"></i>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 text-center text-gray-400">الكورس غير موجود</div>
    </div>
  );

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass p-8 mb-8">
            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
            <p className="text-gray-400 mb-6">{course.description}</p>
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="badge badge-blue">{course.stage}</span>
              <span className="text-gray-400"><i className="fas fa-user ml-1"></i>{course.teacher_name}</span>
              <span className="text-gray-400"><i className="fas fa-video ml-1"></i>{course.lectures.length} محاضرة</span>
            </div>

            {!enrolled && (
              <button onClick={handleEnroll} className="btn-primary">
                <i className="fas fa-plus-circle ml-2"></i>سجّل في الكورس
              </button>
            )}
            {enrolled && (
              <span className="badge badge-green text-lg px-4 py-2">
                <i className="fas fa-check-circle ml-2"></i>مسجّل في الكورس
              </span>
            )}
          </div>

          {course.lectures.length > 0 && (
            <div className="glass p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">
                <i className="fas fa-video ml-2 text-[var(--color-neon-blue)]"></i>المحاضرات
              </h2>
              <div className="space-y-3">
                {course.lectures.map((lecture, i) => (
                  <div key={lecture.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl hover:bg-black/30 transition">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{lecture.title}</h3>
                      <p className="text-sm text-gray-400">{lecture.description}</p>
                    </div>
                    {lecture.is_free === 1 && <span className="badge badge-green">مجاني</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.quizzes.length > 0 && (
            <div className="glass p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">
                <i className="fas fa-question-circle ml-2 text-[var(--color-neon-purple)]"></i>الاختبارات
              </h2>
              <div className="space-y-3">
                {course.quizzes.map(quiz => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl hover:bg-black/30 transition cursor-pointer"
                    onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id}`)}>
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-gray-400">{quiz.time_limit} دقيقة</p>
                    </div>
                    <i className="fas fa-arrow-left text-[var(--color-neon-blue)]"></i>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
