const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);
  console.log("clicking My Account");
  // The first login needs to be skipped or handled since we need user?
  // User might not be logged in in the fresh browser. Wait, we can't test "My Account" without logging in!
  await page.evaluate(() => {
    // If there's an error on just navigating or rendering account... Wait, my account is hidden unless `user` is true!
    // But wait, the user says "my account page its not opening".
    // Does the user click "My Account" button and nothing happens if they ARE logged in?
    // Or does clicking the 'nav-link' not work?
  });
  await browser.close();
})();
