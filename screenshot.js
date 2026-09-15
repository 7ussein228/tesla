const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5000';

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

async function typeIn(page, selector, text) {
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, text, { delay: 15 });
}

async function newPage(browser) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1400, height: 900 });
  return p;
}

async function run() {
  console.log('🚀 جاري التقاط السكرين شوت...\n');

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--window-size=1400,900'] });

  // === 1. HOMEPAGE ===
  console.log('📄 الرئيسية:');
  let page = await newPage(browser);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 15000 });
  await shot(page, 'homepage-hero');

  await page.evaluate(() => window.scrollTo(0, 700));
  await shot(page, 'homepage-stats');

  await page.evaluate(() => window.scrollTo(0, 1300));
  await shot(page, 'homepage-features');

  await page.evaluate(() => window.scrollTo(0, 2000));
  await shot(page, 'homepage-courses');

  await page.evaluate(() => window.scrollTo(0, 2800));
  await shot(page, 'homepage-cta');

  await page.evaluate(() => window.scrollTo(0, 99999));
  await shot(page, 'homepage-footer');
  await page.close();

  // === 2. LOGIN ===
  console.log('\n📄 تسجيل الدخول:');
  page = await newPage(browser);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await shot(page, 'login-page', { full: false });
  await page.close();

  // === 3. REGISTER ===
  console.log('\n📄 التسجيل:');
  page = await newPage(browser);
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle2' });
  await shot(page, 'register-page', { full: false });
  await page.close();

  // === 4. COURSES ===
  console.log('\n📄 الكورسات:');
  page = await newPage(browser);
  await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle2' });
  await shot(page, 'courses-all');

  await page.evaluate(() => {
    document.querySelectorAll('.filter-btn').forEach(b => { if (b.textContent.includes('إعدادي')) b.click(); });
  });
  await shot(page, 'courses-filter-prep');

  await page.evaluate(() => {
    document.querySelectorAll('.filter-btn').forEach(b => { if (b.textContent.includes('ثالث ثانوي')) b.click(); });
  });
  await shot(page, 'courses-filter-sec3');
  await page.close();

  // === 5. STUDENT DASHBOARD ===
  console.log('\n📄 لوحة الطالب:');
  page = await newPage(browser);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
  await typeIn(page, 'input[type="email"]', 'rawan@student.com');
  await typeIn(page, 'input[type="password"]', '123456');
  await page.click('.btn-primary');
  await new Promise(r => setTimeout(r, 3000));
  console.log(`  📍 URL: ${page.url()}`);

  await shot(page, 'student-dashboard');

  await page.evaluate(() => window.scrollTo(0, 300));
  await shot(page, 'student-my-courses');

  const clicked = await page.evaluate(() => {
    const cards = document.querySelectorAll('.my-course-card');
    if (cards.length) { cards[0].click(); return true; }
    return false;
  });
  console.log(`  📚 Course clicked: ${clicked}`);
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, 'student-lecture');

  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الكويز')) t.click(); });
  });
  await shot(page, 'student-quiz');

  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الواجب')) t.click(); });
  });
  await shot(page, 'student-homework');

  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('أوائل')) t.click(); });
  });
  await shot(page, 'student-ranks');
  await page.close();

  // === 6. TEACHER DASHBOARD ===
  console.log('\n📄 لوحة المدرس:');
  page = await newPage(browser);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
  await typeIn(page, 'input[type="email"]', 'teacher@newton.edu');
  await typeIn(page, 'input[type="password"]', '123456');
  await page.click('.btn-primary');
  await new Promise(r => setTimeout(r, 3000));
  console.log(`  📍 URL: ${page.url()}`);

  await shot(page, 'teacher-courses');

  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('المحاضرات')) t.click(); });
  });
  await shot(page, 'teacher-lectures');

  await page.evaluate(() => {
    document.querySelectorAll('.tab-btn').forEach(t => { if (t.textContent.includes('الشيتات')) t.click(); });
  });
  await shot(page, 'teacher-homework');
  await page.close();

  // === 7. ADMIN DASHBOARD ===
  console.log('\n📄 لوحة الإدارة:');
  page = await newPage(browser);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));
  await typeIn(page, 'input[type="email"]', 'admin@newton.edu');
  await typeIn(page, 'input[type="password"]', '123456');
  await page.click('.btn-primary');
  await new Promise(r => setTimeout(r, 3000));
  console.log(`  📍 URL: ${page.url()}`);

  await shot(page, 'admin-dashboard');

  await page.evaluate(() => window.scrollTo(0, 250));
  await shot(page, 'admin-stats');

  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('الكورسات')) a.click(); });
  });
  await shot(page, 'admin-courses');

  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('المستخدمين')) a.click(); });
  });
  await shot(page, 'admin-users');

  await page.evaluate(() => {
    document.querySelectorAll('a').forEach(a => { if (a.textContent.includes('أوائل')) a.click(); });
  });
  await shot(page, 'admin-leaderboard');
  await page.close();

  await browser.close();
  console.log(`\n🎉 تم التقاط ${counter} سكرين شوت`);
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
