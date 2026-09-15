'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Course {
  id: number;
  title: string;
  description: string;
  stage: string;
  teacher_name: string;
  lecture_count: number;
  student_count: number;
  price: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stage, setStage] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/courses?stage=${stage}`)
      .then(r => r.json())
      .then(data => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setCourses([]); setLoading(false); });
  }, [stage]);

  const stages = ['all', 'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'];

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">
            <span className="bg-gradient-to-l from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] bg-clip-text text-transparent">
              الكورسات
            </span>
          </h1>

          <div className="flex flex-wrap gap-3 mb-8">
            {stages.map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${stage === s ? 'tab-active' : 'tab-inactive'}`}
              >
                {s === 'all' ? 'الكل' : s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <i className="fas fa-spinner fa-spin text-4xl text-[var(--color-neon-blue)]"></i>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <i className="fas fa-book-open text-5xl mb-4 block"></i>
              <p>لا يوجد كورسات حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="glass-card p-6 cursor-pointer" onClick={() => router.push(`/courses/${course.id}`)}>
                  <div className="h-40 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)]/20 to-[var(--color-neon-purple)]/20 flex items-center justify-center mb-4">
                    <i className="fas fa-book-open text-4xl text-[var(--color-neon-blue)]"></i>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="badge badge-blue">{course.stage}</span>
                    <span className="text-gray-500"><i className="fas fa-user ml-1"></i>{course.teacher_name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span><i className="fas fa-video ml-1"></i>{course.lecture_count} محاضرة</span>
                    <span><i className="fas fa-users ml-1"></i>{course.student_count} طالب</span>
                  </div>
                  {course.price > 0 && (
                    <div className="mt-3 text-center">
                      <span className="text-[var(--color-neon-blue)] font-bold">{course.price} ج.م</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
