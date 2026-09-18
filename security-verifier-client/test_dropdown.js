const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
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
    
    await new Promise(r => setTimeout(r, 500));
    
    const content = await page.content();
    if (content.includes('Switch User') && content.includes('Download App')) {
      console.log("SUCCESS: Dropdown appeared and contains expected items!");
    } else {
      console.log("FAILED: Dropdown items not found after clicking.");
    }
  } else {
    console.log("ERROR: Could not find the profile button with aria-label='User menu'.");
    const body = await page.$eval('body', el => el.innerText);
    console.log("Body text:", body.substring(0, 200));
  }
  
  await browser.close();
})();
