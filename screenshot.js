const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5000';

// Clean old screenshots
fs.readdirSync(DIR).forEach(f => { if (f.endsWith('.png')) fs.unlinkSync(path.join(DIR, f)); });

let counter = 0;
async function shot(page, name, opts = {}) {
  counter++;
  const num = String(counter).padStart(2, '0');
  const file = path.join(DIR, `${num}-${name}.png`);
  await new Promise(r => setTimeout(r, opts.wait || 1500));
  await page.screenshot({ path: file, fullPage: opts.full !== false });
  console.log(`  ✅ ${num}-${name}.png`);
}

async function run() {
  console.log('🚀 جاري التقاط السكرين شوت...\n');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--window-size=1400,900'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // === 1. HOMEPAGE ===
  console.log('📄 الرئيسية:');
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 15000 });
  await shot(page, 'homepage-hero');

  // scroll to features
  await page.evaluate(() => window.scrollTo(0, 700));
  await shot(page, 'homepage-stats');

  await page.evaluate(() => window.scrollTo(0, 1300));
  await shot(page, 'homepage-features');

  await page.evaluate(() => window.scrollTo(0, 2000));
  await shot(page, 'homepage-courses-preview');

  await page.evaluate(() => window.scrollTo(0, 2800));
  await shot(page, 'homepage-testimonials');

  await page.evaluate(() => window.scrollTo(0, 3500));
  await shot(page, 'homepage-cta');

  await page.evaluate(() => window.scrollTo(0, 99999));
  await shot(page, 'homepage-footer');

  // === 2. LOGIN ===
  console.log('\n📄 تسجيل الدخول:');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await shot(page, 'login-page', { full: false });

  // === 3. REGISTER ===
  console.log('\n📄 التسجيل:');
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle2' });
  await shot(page, 'register-page', { full: false });

  // === 4. COURSES ===
  console.log('\n📄 الكورسات:');
  await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle2' });
  await shot(page, 'courses-all');

  // filter prep
  await page.evaluate(() => {
    document.querySelectorAll('.filter-btn').forEach(b => { if (b.textContent.includes('إعدادي')) b.click(); });
  });
  await shot(page, 'courses-filter-prep');

  // filter sec3
  await page.evaluate(() => {
    document.querySelectorAll('.filter-btn').forEach(b => { if (b.textContent.includes('ثالث ثانوي')) b.click(); });
  });
  await shot(page, 'courses-filter-sec3');

  // === 5. STUDENT DASHBOARD ===
  console.log('\n📄 لوحة الطالب:');
  await page.evaluate(() => { localStorage.removeItem('newton_token'); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'rawan@student.com'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    setTimeout(() => document.querySelector('button[type="submit"]')?.click(), 300);
  });
  await new Promise(r => setTimeout(r, 3000));

  await page.goto(`${BASE}/student`, { waitUntil: 'networkidle2' });
  await shot(page, 'student-dashboard');

  // My courses section
  await page.evaluate(() => window.scrollTo(0, 300));
  await shot(page, 'student-my-courses');

  // Click first course
  await page.evaluate(() => {
    const cards = document.querySelectorAll('.my-course-card');
    if (cards.length) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, 'student-lecture-view');

  // Lecture sidebar
  await page.evaluate(() => window.scrollTo(0, 500));
  await shot(page, 'student-lecture-sidebar');

  // Quiz tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الكويز')) t.click(); });
  });
  await shot(page, 'student-quiz-list');

  // Homework tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الواجب')) t.click(); });
  });
  await shot(page, 'student-homework');

  // Ranks tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('أوائل')) t.click(); });
  });
  await shot(page, 'student-ranks');

  // === 6. TEACHER DASHBOARD ===
  console.log('\n📄 لوحة المدرس:');
  await page.evaluate(() => { localStorage.removeItem('newton_token'); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'teacher@newton.edu'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    setTimeout(() => document.querySelector('button[type="submit"]')?.click(), 300);
  });
  await new Promise(r => setTimeout(r, 3000));

  await page.goto(`${BASE}/teacher`, { waitUntil: 'networkidle2' });
  await shot(page, 'teacher-courses');

  // Lectures tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('المحاضرات')) t.click(); });
  });
  await shot(page, 'teacher-lectures');

  // Quizzes tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الكويزات')) t.click(); });
  });
  await shot(page, 'teacher-quizzes');

  // Homework tab
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الشيتات')) t.click(); });
  });
  await shot(page, 'teacher-homework');

  // === 7. ADMIN DASHBOARD ===
  console.log('\n📄 لوحة الإدارة:');
  await page.evaluate(() => { localStorage.removeItem('newton_token'); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'admin@newton.edu'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    setTimeout(() => document.querySelector('button[type="submit"]')?.click(), 300);
  });
  await new Promise(r => setTimeout(r, 3000));

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' });
  await shot(page, 'admin-dashboard');

  // Stats cards
  await page.evaluate(() => window.scrollTo(0, 200));
  await shot(page, 'admin-stats');

  // Recent activity
  await page.evaluate(() => window.scrollTo(0, 600));
  await shot(page, 'admin-activity');

  // Courses management
  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('الكورسات')) a.click(); });
  });
  await shot(page, 'admin-courses');

  // Users management
  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('المستخدمين')) a.click(); });
  });
  await shot(page, 'admin-users');

  // Filter students
  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(b => { if (b.textContent.includes('طلاب')) b.click(); });
  });
  await shot(page, 'admin-users-students');

  // Leaderboard
  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('أوائل')) a.click(); });
  });
  await shot(page, 'admin-leaderboard');

  await browser.close();
  console.log(`\n🎉 تم التقاط ${counter} سكرين شوت في فولدر screenshots/`);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
