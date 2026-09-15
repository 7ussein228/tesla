const puppeteer = require('puppeteer');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5000';

async function takeScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Helper
  async function screenshot(name, url, options = {}) {
    const { wait = 2000, fullPage = true, waitForSelector = null } = options;
    console.log(`📸 Capturing: ${name}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {});
      }
      await new Promise(r => setTimeout(r, wait));
      const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
      await page.screenshot({ path: filePath, fullPage });
      console.log(`  ✅ Saved: ${name}.png`);
    } catch (err) {
      console.log(`  ❌ Failed: ${name} - ${err.message}`);
    }
  }

  // 1. Homepage
  await screenshot('01-homepage', BASE, { wait: 3000 });

  // 2. Login page - navigate via JS
  await screenshot('02-login', BASE, { wait: 1000 });
  await page.evaluate(() => {
    // Click login button to open modal
    const links = document.querySelectorAll('a');
    links.forEach(l => { if (l.textContent.includes('تسجيل الدخول')) l.click(); });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-login-modal.png'), fullPage: false });
  console.log('  ✅ Saved: 02-login-modal.png');

  // 3. Courses page
  await screenshot('03-courses', `${BASE}/courses`, { wait: 2000 });

  // 4. Login as student and capture dashboard
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  
  // Fill login form
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'rawan@student.com'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    // Click submit
    setTimeout(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }, 500);
  });
  await new Promise(r => setTimeout(r, 3000));

  // 5. Student dashboard
  await screenshot('04-student-dashboard', `${BASE}/student`, { wait: 2000 });

  // Click on a course if available
  await page.evaluate(() => {
    const cards = document.querySelectorAll('.my-course-card');
    if (cards.length) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-student-lecture.png'), fullPage: true });
  console.log('  ✅ Saved: 05-student-lecture.png');

  // Click quiz tab
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => { if (t.textContent.includes('الكويز')) t.click(); });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-student-quiz.png'), fullPage: true });
  console.log('  ✅ Saved: 06-student-quiz.png');

  // Click ranks tab
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => { if (t.textContent.includes('أوائل')) t.click(); });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-student-ranks.png'), fullPage: true });
  console.log('  ✅ Saved: 07-student-ranks.png');

  // 6. Logout and login as teacher
  await page.evaluate(() => { localStorage.removeItem('newton_token'); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'teacher@newton.edu'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    setTimeout(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }, 500);
  });
  await new Promise(r => setTimeout(r, 3000));
  await screenshot('08-teacher-dashboard', `${BASE}/teacher`, { wait: 2000 });

  // 7. Logout and login as admin
  await page.evaluate(() => { localStorage.removeItem('newton_token'); });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.type === 'email') { i.value = 'admin@newton.edu'; i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (i.type === 'password') { i.value = '123456'; i.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    setTimeout(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    }, 500);
  });
  await new Promise(r => setTimeout(r, 3000));
  await screenshot('09-admin-dashboard', `${BASE}/admin`, { wait: 2000 });

  // Click users tab in admin
  await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    links.forEach(l => { if (l.textContent.includes('المستخدمين')) l.click(); });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-admin-users.png'), fullPage: true });
  console.log('  ✅ Saved: 10-admin-users.png');

  // Click leaderboard
  await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    links.forEach(l => { if (l.textContent.includes('أوائل')) l.click(); });
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-admin-leaderboard.png'), fullPage: true });
  console.log('  ✅ Saved: 11-admin-leaderboard.png');

  await browser.close();
  console.log('\n🎉 All screenshots captured in screenshots/ folder!');
}

takeScreenshots().catch(err => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
