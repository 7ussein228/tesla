const bcrypt = require('bcryptjs');
const { getSupabase } = require('./config/supabase');

async function seedSupabase() {
  const supabase = getSupabase();
  console.log('🌱 Seeding Supabase database...');

  const hash = bcrypt.hashSync('123456', 10);

  const { data: existing } = await supabase.from('users').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('ℹ️ Already seeded, skipping...');
    return;
  }

  // Users (IDs 1-3 admin/teacher, IDs 4+ students)
  const users = [
    { name: 'المدير العام', email: 'admin@newton.edu', password: hash, role: 'admin', stage: '', phone: '', energy: 0, avatar: '' },
    { name: 'الأستاذ أحمد نيوتن', email: 'teacher@newton.edu', password: hash, role: 'teacher', stage: '', phone: '', energy: 0, avatar: '' },
    { name: 'الأستاذة سارة فيزياء', email: 'teacher2@newton.edu', password: hash, role: 'teacher', stage: '', phone: '', energy: 0, avatar: '' },
    { name: 'روان مصطفى عزت', email: 'rawan@student.com', password: hash, role: 'student', stage: 'ثالث ثانوي', phone: '', energy: 940, avatar: '' },
    { name: 'كريم عبد الله', email: 'kareem@student.com', password: hash, role: 'student', stage: 'ثالث ثانوي', phone: '', energy: 890, avatar: '' },
    { name: 'هاجر إبراهيم', email: 'hagar@student.com', password: hash, role: 'student', stage: 'ثالث ثانوي', phone: '', energy: 865, avatar: '' },
    { name: 'محمد عادل', email: 'mohamed@student.com', password: hash, role: 'student', stage: 'أول ثانوي', phone: '', energy: 720, avatar: '' },
    { name: 'سارة محمد', email: 'sara@student.com', password: hash, role: 'student', stage: 'ثالث إعدادي', phone: '', energy: 650, avatar: '' },
    { name: 'عمر خالد', email: 'omar@student.com', password: hash, role: 'student', stage: 'ثالث إعدادي', phone: '', energy: 620, avatar: '' },
    { name: 'نورهان حسين', email: 'norhan@student.com', password: hash, role: 'student', stage: 'ثالث ثانوي', phone: '', energy: 595, avatar: '' },
    { name: 'أحمد سمير', email: 'ahmed@student.com', password: hash, role: 'student', stage: 'ثالث ثانوي', phone: '', energy: 580, avatar: '' },
    { name: 'ياسمين علي', email: 'yasmin@student.com', password: hash, role: 'student', stage: 'أول ثانوي', phone: '', energy: 560, avatar: '' },
  ];
  const { data: insertedUsers } = await supabase.from('users').insert(users).select();
  console.log(`  ✅ ${insertedUsers?.length || 0} users`);

  // Get actual IDs
  const tId = insertedUsers?.find(u => u.email === 'teacher@newton.edu')?.id || 2;
  const t2Id = insertedUsers?.find(u => u.email === 'teacher2@newton.edu')?.id || 3;
  const rawanId = insertedUsers?.find(u => u.email === 'rawan@student.com')?.id || 4;
  const kareemId = insertedUsers?.find(u => u.email === 'kareem@student.com')?.id || 5;
  const hagarId = insertedUsers?.find(u => u.email === 'hagar@student.com')?.id || 6;
  const mohamedId = insertedUsers?.find(u => u.email === 'mohamed@student.com')?.id || 7;
  const saraId = insertedUsers?.find(u => u.email === 'sara@student.com')?.id || 8;
  const omarId = insertedUsers?.find(u => u.email === 'omar@student.com')?.id || 9;

  // Courses (INTEGER booleans!)
  const courses = [
    { title: 'فيزياء 3 ثانوي - الكهربية والتيار المستمر', description: 'قانون أوم، توصيل المقاومات، قوانين كيرشوف', stage: 'ثالث ثانوي', price: 600, teacher_id: tId, is_published: 1 },
    { title: 'فيزياء 3 ثانوي - الحث الكهرومغناطيسي', description: 'الحث الذاتي، التيار المتذبذب، محولات التيار', stage: 'ثالث ثانوي', price: 550, teacher_id: tId, is_published: 1 },
    { title: 'فيزياء 3 ثانوي - الفيزياء الحديثة', description: 'الظاهرة الكهروضوئية، تأثير Compton', stage: 'ثالث ثانوي', price: 500, teacher_id: tId, is_published: 1 },
    { title: 'علوم متكاملة 1 ثانوي - النظام البيئي', description: 'النظام البيئي المائي والبري', stage: 'أول ثانوي', price: 500, teacher_id: t2Id, is_published: 1 },
    { title: 'علوم 3 إعدادي - القوى والحركة', description: 'القوى والحركة، العدسات والمرايا', stage: 'ثالث إعدادي', price: 400, teacher_id: t2Id, is_published: 1 },
    { title: 'علوم 3 إعدادي - الفصل الثاني', description: 'الضوء والألوان، الطاقة الكهربائية', stage: 'ثالث إعدادي', price: 350, teacher_id: t2Id, is_published: 1 },
  ];
  const { data: insertedCourses } = await supabase.from('courses').insert(courses).select();
  console.log(`  ✅ ${insertedCourses?.length || 0} courses`);

  const c1 = insertedCourses?.[0]?.id || 1;
  const c4 = insertedCourses?.[3]?.id || 4;
  const c5 = insertedCourses?.[4]?.id || 5;

  // Lectures (INTEGER booleans!)
  const lectures = [
    { course_id: c1, title: 'المحاضرة 1: شدة التيار وفارق الجهد', duration: 65, sort_order: 1, is_free: 1 },
    { course_id: c1, title: 'المحاضرة 2: المقاومة النوعية والتوصيلية', duration: 60, sort_order: 2, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 3: قانون أوم وتطبيقات المسائل', duration: 70, sort_order: 3, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 4: توصيل المقاومات وتوزيع الجهد والتيار', duration: 65, sort_order: 4, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 5: قوانين كيرشوف الأولى والثانية', duration: 75, sort_order: 5, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 6: المقاومة المكافئة - مستوى أول', duration: 60, sort_order: 6, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 7: المقاومة المكافئة - مستوى ثاني', duration: 65, sort_order: 7, is_free: 0 },
    { course_id: c1, title: 'المحاضرة 8: تدريبات شاملة على الكهربية', duration: 80, sort_order: 8, is_free: 0 },
    { course_id: c4, title: 'المحاضرة 1: مكونات النظام البيئي المائي', duration: 55, sort_order: 1, is_free: 1 },
    { course_id: c4, title: 'المحاضرة 2: التفاعلات الكيميائية', duration: 60, sort_order: 2, is_free: 0 },
    { course_id: c4, title: 'المحاضرة 3: التوازن البيولوجي والفيزيائي', duration: 50, sort_order: 3, is_free: 0 },
    { course_id: c4, title: 'المحاضرة 4: مصادر الطاقة الكيميائية', duration: 55, sort_order: 4, is_free: 0 },
    { course_id: c5, title: 'المحاضرة 1: مفهوم الحركة في اتجاه واحد', duration: 45, sort_order: 1, is_free: 1 },
    { course_id: c5, title: 'المحاضرة 2: السرعة المتوسطة والنسبية', duration: 50, sort_order: 2, is_free: 0 },
    { course_id: c5, title: 'المحاضرة 3: العجلة والتمثيل البياني', duration: 55, sort_order: 3, is_free: 0 },
  ];
  await supabase.from('lectures').insert(lectures);
  console.log(`  ✅ ${lectures.length} lectures`);

  // Quizzes
  const quizzes = [
    { course_id: c1, title: 'كويز قانون أوم', description: 'اختبار على المحاضرتين الأولى والثانية', time_limit: 15, passing_score: 60 },
    { course_id: c1, title: 'كويز قوانين كيرشوف', description: 'اختبار على قوانين كيرشوف', time_limit: 20, passing_score: 60 },
    { course_id: c4, title: 'كويز النظام البيئي', description: 'اختبار على النظام البيئي المائي', time_limit: 12, passing_score: 60 },
  ];
  const { data: insertedQuizzes } = await supabase.from('quizzes').insert(quizzes).select();
  console.log(`  ✅ ${insertedQuizzes?.length || 0} quizzes`);

  const q1 = insertedQuizzes?.[0]?.id || 1;
  const q2 = insertedQuizzes?.[1]?.id || 2;

  // Quiz questions
  const questions = [
    { quiz_id: q1, question: 'إذا زاد فارق الجهد عبر مقاومة ثابتة x2، فإن شدة التيار تساوي:', option_a: 'ضعف التيار الأصلي', option_b: 'نصف التيار الأصلي', option_c: 'التيار الأصلي', option_d: '', correct_answer: 'A', points: 1, sort_order: 0 },
    { quiz_id: q1, question: 'وحدة المقاومة في النظام الدولي هي:', option_a: 'الأمبير', option_b: 'الفولت', option_c: 'الأوم', option_d: '', correct_answer: 'C', points: 1, sort_order: 1 },
    { quiz_id: q1, question: 'سلك طوله 2 متر وقطره 1 مم، مقاومته 4 أوم', option_a: '4 أوم', option_b: '2 أوم', option_c: '8 أوم', option_d: '', correct_answer: 'A', points: 2, sort_order: 2 },
    { quiz_id: q1, question: 'قانون أوم ينص على أن:', option_a: 'V = I/R', option_b: 'V = IR', option_c: 'I = VR', option_d: '', correct_answer: 'B', points: 1, sort_order: 3 },
    { quiz_id: q1, question: 'في دارة مغلقة، مجموع فوارق الجهد يساوي:', option_a: 'التيار الكلي', option_b: 'الصفر', option_c: 'المقاومة الكلية', option_d: '', correct_answer: 'B', points: 1, sort_order: 4 },
    { quiz_id: q2, question: 'القانون الأول لكيرشوف:', option_a: 'مجموع فوارق الجهد = 0', option_b: 'مجموع التيارات الداخلة = مجموع الخارجة', option_c: 'V = IR', option_d: '', correct_answer: 'B', points: 1, sort_order: 0 },
    { quiz_id: q2, question: 'في نقطة تشع، إذا دخل 3 أمبير من فرعين:', option_a: '3 أمبير', option_b: '6 أمبير', option_c: '1.5 أمبير', option_d: '', correct_answer: 'A', points: 1, sort_order: 1 },
    { quiz_id: q2, question: 'قانون الثاني لكيرشوف يتعلق بـ:', option_a: 'التيارات فقط', option_b: 'فوارق الجهد في الحلقات', option_c: 'المقاومة المكافئة', option_d: '', correct_answer: 'B', points: 1, sort_order: 2 },
  ];
  await supabase.from('quiz_questions').insert(questions);
  console.log(`  ✅ ${questions.length} questions`);

  // Enrollments (using actual IDs)
  await supabase.from('enrollments').insert([
    { student_id: rawanId, course_id: c1, progress: 80 },
    { student_id: rawanId, course_id: insertedCourses?.[1]?.id || 2, progress: 30 },
    { student_id: kareemId, course_id: c1, progress: 65 },
    { student_id: hagarId, course_id: c1, progress: 50 },
    { student_id: mohamedId, course_id: c4, progress: 40 },
    { student_id: saraId, course_id: c5, progress: 25 },
    { student_id: omarId, course_id: c5, progress: 15 },
  ]);
  console.log('  ✅ Enrollments');

  await supabase.from('sheets').insert([
    { course_id: c1, title: 'شيت قانون أوم - مستوى أول' },
    { course_id: c1, title: 'شيت قوانين كيرشوف - مستوى ثاني' },
    { course_id: c4, title: 'شيت التفاعلات الكيميائية' },
  ]);
  console.log('  ✅ Sheets');

  await supabase.from('notifications').insert([
    { user_id: rawanId, title: 'مرحباً بك في الكورس!', message: 'تم تسجيلك بنجاح في كورس فيزياء 3 ثانوي' },
    { user_id: rawanId, title: 'تنبيه: واجب جديد', message: 'تم رفع شيت قانون أوم' },
  ]);
  console.log('  ✅ Notifications');

  console.log('\n🎉 Supabase seeded!');
  console.log('📧 admin@newton.edu / 123456');
  console.log('📧 teacher@newton.edu / 123456');
  console.log('📧 rawan@student.com / 123456');
}

module.exports = seedSupabase;

if (require.main === module) {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  seedSupabase().catch(err => { console.error('Seed failed:', err); process.exit(1); });
}
