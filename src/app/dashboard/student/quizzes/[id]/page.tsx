'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  image_url: string;
}

interface Quiz {
  id: number;
  title: string;
  time_limit: number;
  passing_score: number;
  questions: Question[];
}

interface QuizResult {
  score: number;
  total_points: number;
  passed: boolean;
  results: { id: number; correct: boolean; correct_answer: string }[];
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setQuiz(data);
          setTimeLeft(data.time_limit * 60);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (timeLeft === 0 && quiz && !submitted) handleSubmit();
  }, [timeLeft, quiz, submitted]);

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setResult(data);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative z-10">
      <i className="fas fa-spinner fa-spin text-4xl text-[var(--color-neon-blue)]"></i>
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 text-center text-gray-400">الكويز غير موجود</div>
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen relative z-10">
        <Navbar />
        <div className="pt-24 pb-12 px-6">
          <div className="max-w-2xl mx-auto glass p-8 text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <i className={`fas ${result.passed ? 'fa-check' : 'fa-times'}`}></i>
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {result.passed ? 'أحسنت! نجحت 🎉' : 'لم تنجح 😔'}
            </h1>
            <div className="stat-card mb-6">
              <div className="stat-value">{result.score}%</div>
              <div className="stat-label">النتيجة</div>
            </div>
            <p className="text-gray-400 mb-8">
              النتيجة: {result.score}% | الحد الأدنى: {quiz.passing_score}%
            </p>
            <button onClick={() => router.push('/dashboard/student')} className="btn-primary">
              <i className="fas fa-home ml-2"></i>العودة للوحة التحكم
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQ];

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass p-6 mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <div className={`text-lg font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-[var(--color-neon-blue)]'}`}>
              <i className="fas fa-clock ml-2"></i>{formatTime(timeLeft)}
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
                  i === currentQ ? 'bg-[var(--color-neon-blue)] text-white' :
                  answers[q.id] && i !== currentQ ? 'bg-green-500/20 text-green-400' :
                  'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {q.image_url && (
            <div className="glass p-4 mb-6">
              <img src={q.image_url} alt="صورة السؤال" className="max-h-64 mx-auto rounded-xl" />
            </div>
          )}

          <div className="glass p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center text-sm font-bold shrink-0">
                {currentQ + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{q.question}</h2>
                <span className="text-sm text-gray-400">{q.points} نقطة</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].filter(opt => q[`option_${opt.toLowerCase()}` as keyof Question]).map(opt => {
                const optionKey = `option_${opt.toLowerCase()}` as keyof Question;
                return (
                  <div
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`quiz-option flex items-center gap-3 ${answers[q.id] === opt ? 'selected' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      answers[q.id] === opt ? 'bg-[var(--color-neon-blue)] text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      {opt}
                    </div>
                    <span>{q[optionKey] as string}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="btn-secondary disabled:opacity-50"
            >
              <i className="fas fa-arrow-right ml-2"></i>السابق
            </button>

            {currentQ === quiz.questions.length - 1 ? (
              <button onClick={handleSubmit} className="btn-primary">
                <i className="fas fa-paper-plane ml-2"></i>إرسال الاختبار
              </button>
            ) : (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary">
                <i className="fas fa-arrow-left mr-2"></i>التالي
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
