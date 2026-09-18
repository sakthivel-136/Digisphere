const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('access_token', 'faketoken');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('adminName', 'TestUser');
    localStorage.setItem('name', 'TestUser');
  });

  await page.setCookie({
    name: 'access_token',
    value: 'faketoken',
    url: 'http://localhost:3000',
  });
  
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  
  const button = await page.$('button[aria-label="User menu"]');
  if (button) {
    console.log("Found profile button! Clicking it...");
    await button.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: '/Users/rekha/.gemini/antigravity/brain/b1d883cf-b5f5-45de-a3b9-e8f80aeccd6b/dropdown_screenshot.png' });
    console.log("Screenshot saved.");
  } else {
    console.log("ERROR: Button not found");
  }
  
  await browser.close();
})();
