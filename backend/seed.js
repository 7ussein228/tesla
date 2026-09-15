const bcrypt = require('bcryptjs');

async function seed(externalDb) {
  const { initDatabase, getDb } = require('./config/database');
  
  if (!externalDb) {
    await initDatabase();
  }
  const db = externalDb || getDb();
  console.log('🌱 Seeding database...');

const hash = bcrypt.hashSync('123456', 10);

// Users
const users = [
  { name: 'المدير العام', email: 'admin@newton.edu', role: 'admin' },
  { name: 'الأستاذ أحمد نيوتن', email: 'teacher@newton.edu', role: 'teacher' },
  { name: 'الأستاذة سارة فيزياء', email: 'teacher2@newton.edu', role: 'teacher' },
  { name: 'روان مصطفى عزت', email: 'rawan@student.com', role: 'student', stage: 'ثالث ثانوي', energy: 940 },
  { name: 'كريم عبد الله', email: 'kareem@student.com', role: 'student', stage: 'ثالث ثانوي', energy: 890 },
  { name: 'هاجر إبراهيم', email: 'hagar@student.com', role: 'student', stage: 'ثالث ثانوي', energy: 865 },
  { name: 'محمد عادل', email: 'mohamed@student.com', role: 'student', stage: 'أول ثانوي', energy: 720 },
  { name: 'سارة محمد', email: 'sara@student.com', role: 'student', stage: 'ثالث إعدادي', energy: 650 },
  { name: 'عمر خالد', email: 'omar@student.com', role: 'student', stage: 'ثالث إعدادي', energy: 620 },
  { name: 'نورهان حسين', email: 'norhan@student.com', role: 'student', stage: 'ثالث ثانوي', energy: 595 },
  { name: 'أحمد سمير', email: 'ahmed@student.com', role: 'student', stage: 'ثالث ثانوي', energy: 580 },
  { name: 'ياسمين علي', email: 'yasmin@student.com', role: 'student', stage: 'أول ثانوي', energy: 560 },
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (name, email, password, role, stage, energy) VALUES (?, ?, ?, ?, ?, ?)');
users.forEach(u => insertUser.run(u.name, u.email, hash, u.role, u.stage || '', u.energy || 0));

const teacherId = db.prepare("SELECT id FROM users WHERE email = 'teacher@newton.edu'").get()?.id || 2;
const teacher2Id = db.prepare("SELECT id FROM users WHERE email = 'teacher2@newton.edu'").get()?.id || 3;

// Courses
const courses = [
  { title: 'فيزياء 3 ثانوي - الكهربية والتيار المستمر', description: 'قانون أوم، توصيل المقاومات، قوانين كيرشوف، القوى الكهربية والمغناطيسية', stage: 'ثالث ثانوي', price: 600, teacher_id: teacherId },
  { title: 'فيزياء 3 ثانوي - الحث الكهرومغناطيسي', description: 'الحث الذاتي، التيار المتذبذب، محولات التيار، الطاقة المغناطيسية', stage: 'ثالث ثانوي', price: 550, teacher_id: teacherId },
  { title: 'فيزياء 3 ثانوي - الفيزياء الحديثة', description: 'الظاهرة الكهروضوئية، تأثير Compton، النموذج الذري، الطاقة النووية', stage: 'ثالث ثانوي', price: 500, teacher_id: teacherId },
  { title: 'علوم متكاملة 1 ثانوي - النظام البيئي', description: 'النظام البيئي المائي والبري، التفاعلات الكيميائية، مصادر الطاقة', stage: 'أول ثانوي', price: 500, teacher_id: teacher2Id },
  { title: 'علوم 3 إعدادي - القوى والحركة', description: 'القوى والحركة، العدسات والمرايا، الكون والمجرة', stage: 'ثالث إعدادي', price: 400, teacher_id: teacher2Id },
  { title: 'علوم 3 إعدادي - الفصل الثاني', description: 'الضوء والألوان، الطاقة الكهربائية، التنوع البيولوجي', stage: 'ثالث إعدادي', price: 350, teacher_id: teacher2Id },
];

const insertCourse = db.prepare('INSERT OR IGNORE INTO courses (title, description, stage, price, teacher_id, is_published) VALUES (?, ?, ?, ?, ?, 1)');
courses.forEach(c => insertCourse.run(c.title, c.description, c.stage, c.price, c.teacher_id));

// Lectures for course 1
const lectures1 = [
  { title: 'المحاضرة 1: شدة التيار وفارق الجهد', duration: 65, sort_order: 1, is_free: 1 },
  { title: 'المحاضرة 2: المقاومة النوعية والتوصيلية', duration: 60, sort_order: 2, is_free: 0 },
  { title: 'المحاضرة 3: قانون أوم وتطبيقات المسائل', duration: 70, sort_order: 3, is_free: 0 },
  { title: 'المحاضرة 4: توصيل المقاومات وتوزيع الجهد والتيار', duration: 65, sort_order: 4, is_free: 0 },
  { title: 'المحاضرة 5: قوانين كيرشوف الأولى والثانية', duration: 75, sort_order: 5, is_free: 0 },
  { title: 'المحاضرة 6: المقاومة المكافئة - مستوى أول', duration: 60, sort_order: 6, is_free: 0 },
  { title: 'المحاضرة 7: المقاومة المكافئة - مستوى ثاني', duration: 65, sort_order: 7, is_free: 0 },
  { title: 'المحاضرة 8: تدريبات شاملة على الكهربية', duration: 80, sort_order: 8, is_free: 0 },
];

const insertLecture = db.prepare('INSERT OR IGNORE INTO lectures (course_id, title, duration, sort_order, is_free) VALUES (?, ?, ?, ?, ?)');
lectures1.forEach(l => insertLecture.run(1, l.title, l.duration, l.sort_order, l.is_free));

// Lectures for course 4 (Science)
const lectures4 = [
  { title: 'المحاضرة 1: مكونات النظام البيئي المائي', duration: 55, sort_order: 1, is_free: 1 },
  { title: 'المحاضرة 2: التفاعلات الكيميائية داخل الأنظمة الحيوية', duration: 60, sort_order: 2, is_free: 0 },
  { title: 'المحاضرة 3: التوازن البيولوجي والفيزيائي', duration: 50, sort_order: 3, is_free: 0 },
  { title: 'المحاضرة 4: مصادر الطاقة الكيميائية', duration: 55, sort_order: 4, is_free: 0 },
];
lectures4.forEach(l => insertLecture.run(4, l.title, l.duration, l.sort_order, l.is_free));

// Lectures for course 5 (Prep)
const lectures5 = [
  { title: 'المحاضرة 1: مفهوم الحركة في اتجاه واحد', duration: 45, sort_order: 1, is_free: 1 },
  { title: 'المحاضرة 2: السرعة المتوسطة والنسبية', duration: 50, sort_order: 2, is_free: 0 },
  { title: 'المحاضرة 3: العجلة والتمثيل البياني', duration: 55, sort_order: 3, is_free: 0 },
];
lectures5.forEach(l => insertLecture.run(5, l.title, l.duration, l.sort_order, l.is_free));

// Quizzes
const insertQuiz = db.prepare('INSERT OR IGNORE INTO quizzes (course_id, title, description, time_limit, passing_score) VALUES (?, ?, ?, ?, ?)');
insertQuiz.run(1, 'كويز قانون أوم', 'اختبار قصير على م笋ادات المحاضرتين الأولى والثانية', 15, 60);
insertQuiz.run(1, 'كويز قوانين كيرشوف', 'اختبار على قوانين كيرشوف الأولى والثانية', 20, 60);
insertQuiz.run(4, 'كويز النظام البيئي', 'اختبار على م笋ادات النظام البيئي المائي', 12, 60);

// Quiz questions for quiz 1
const insertQ = db.prepare('INSERT OR IGNORE INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertQ.run(1, 'إذا زاد فارق الجهد عبر مقاومة ثابتة x2، فإن شدة التيار تساوي:', 'ضعف التيار الأصلي', 'نصف التيار الأصلي', 'التيار الأصلي', '', 'A', 1, 0);
insertQ.run(1, 'وحدة المقاومة في النظام الدولي هي:', 'الأمبير', 'الفولت', 'الأوم', '', 'C', 1, 1);
insertQ.run(1, 'سلك طوله 2 متر وقطره 1 مم، مقاومته 4 أوم. ما مقاومة سلك من نفس المادة طوله 4 متر وقطره 2 مم؟', '4 أوم', '2 أوم', '8 أوم', '', 'A', 2, 2);
insertQ.run(1, 'قانون أوم ينص على أن:', 'V = I/R', 'V = IR', 'I = VR', '', 'B', 1, 3);
insertQ.run(1, 'في دارة مغلقة، مجموع فوارق الجهد حول حلقة مفرغة يساوي:', 'التيار الكلي', 'الصفر', 'المقاومة الكلية', '', 'B', 1, 4);

// Quiz questions for quiz 2
insertQ.run(2, 'القانون الأول لكيرشوف ينص على أن:', 'مجموع فوارق الجهد = 0', 'مجموع التيارات الداخلة = مجموع التيارات الخارجة', 'V = IR', '', 'B', 1, 0);
insertQ.run(2, 'في نقطة تشع، إذا دخل تيار 3 أمبير من فرعين، فإن التيار الخارج:', '3 أمبير', '6 أمبير', '1.5 أمبير', '', 'A', 1, 1);
insertQ.run(2, 'قانون الثاني لكيرشوف يتعلق بـ:', 'التيارات فقط', 'فوارق الجهد في الحلقات', 'المقاومة المكافئة', '', 'B', 1, 2);

// Enrollments
const insertEnroll = db.prepare('INSERT OR IGNORE INTO enrollments (student_id, course_id, progress) VALUES (?, ?, ?)');
insertEnroll.run(4, 1, 80);
insertEnroll.run(4, 2, 30);
insertEnroll.run(5, 1, 65);
insertEnroll.run(6, 1, 50);
insertEnroll.run(7, 4, 40);
insertEnroll.run(8, 5, 25);
insertEnroll.run(9, 5, 15);

// Sheets
const insertSheet = db.prepare('INSERT OR IGNORE INTO sheets (course_id, title) VALUES (?, ?)');
insertSheet.run(1, 'شيت قانون أوم - مستوى أول');
insertSheet.run(1, 'شيت قوانين كيرشوف - مستوى ثاني');
insertSheet.run(4, 'شيت التفاعلات الكيميائية');

// Notifications
const insertNotif = db.prepare('INSERT OR IGNORE INTO notifications (user_id, title, message) VALUES (?, ?, ?)');
insertNotif.run(4, 'مرحباً بك في الكورس!', 'تم تسجيلك بنجاح في كورس فيزياء 3 ثانوي');
insertNotif.run(4, 'تنبيه: واجب جديد', 'تم رفع شيت قانون أوم - حلّه وأرسله قبل الموعد');
insertNotif.run(5, 'مرحباً بك!', 'أهلاً بك في منصة نيوتن. ابدأ رحلتك العلمية الآن!');

console.log('✅ Database seeded successfully!');
console.log('📧 Login: admin@newton.edu / 123456');
console.log('📧 Teacher: teacher@newton.edu / 123456');
console.log('📧 Student: rawan@student.com / 123456');
}

// Run standalone
if (require.main === module) {
  seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
}

module.exports = seed;
