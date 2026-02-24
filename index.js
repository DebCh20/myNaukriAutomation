/**
 * Naukri.com automation: login with userid/password → view profile → edit → save
 * Uses NAUKRI_USERNAME (or NAUKRI_USERID) and NAUKRI_PASSWORD from environment variables.
 */

require('dotenv').config();
const { chromium } = require('playwright');

const HOMEPAGE_URL = 'https://www.naukri.com/mnjuser/homepage';
const NAUKRI_BASE = 'https://www.naukri.com';

async function run() {
  const username = process.env.NAUKRI_USERNAME 
  const password = process.env.NAUKRI_PASSWORD;

  if (!username || !password) {
    console.error('Missing NAUKRI_USERNAME (or NAUKRI_USERID) or NAUKRI_PASSWORD in environment.');
    console.error('Create a .env file or set them before running:');
    console.error('  NAUKRI_USERNAME=your_email_or_userid');
    console.error('  NAUKRI_PASSWORD=your_password');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    // 1) Open Naukri homepage (may redirect to login if not logged in)
    console.log('Opening Naukri...');
    await page.goto(HOMEPAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2) If login form is visible, fill userid and password and submit
    const passwordField = page.locator('input[type="password"]').first();
    if (await passwordField.count() > 0 && await passwordField.isVisible()) {
      console.log('Login form found, signing in with userid and password...');
      const userInput = page.locator('input[type="text"], input[name="username"], input[name="email"], input[id*="username"], input[id*="email"], input[placeholder*="Email"], input[placeholder*="User"]').first();
      await userInput.fill(username);
      await passwordField.fill(password);
      await page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first().click();
      await page.waitForTimeout(4000);
    }

    // 3) If still on login, open main site and click Login then fill form
    if (page.url().includes('login') || (await page.locator('input[type="password"]').count() > 0 && await page.locator('input[type="password"]').isVisible())) {
      await page.goto(NAUKRI_BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), [title="Login"]').first();
      if (await loginLink.count() > 0 && await loginLink.isVisible()) {
        await loginLink.click();
        await page.waitForTimeout(2000);
      }
      const pwd = page.locator('input[type="password"]').first();
      if (await pwd.count() > 0 && await pwd.isVisible()) {
        const userInput = page.locator('input[type="text"], input[name="username"], input[name="email"]').first();
        await userInput.fill(username);
        await pwd.fill(password);
        await page.locator('button[type="submit"], input[type="submit"], button:has-text("Login")').first().click();
        await page.waitForTimeout(4000);
      }
    }

    // 4) Go to user homepage if not already there
    if (!page.url().includes('mnjuser')) {
      await page.goto(HOMEPAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // 5) Click "View profile" (or "My Profile" / "View Profile")
    console.log('Looking for View profile / My Profile...');
    const viewProfileSelectors = [
      'a:has-text("View profile")',
      'a:has-text("View Profile")',
      'a:has-text("My Profile")',
      'span:has-text("View profile")',
      'span:has-text("My Profile")',
      '[title="View profile"]',
      '[title="My Profile"]',
      'a[href*="viewprofile"], a[href*="my-naukri"]',
    ];
    let viewProfileClicked = false;
    for (const sel of viewProfileSelectors) {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.click();
        viewProfileClicked = true;
        console.log('Clicked view/profile link.');
        break;
      }
    }
    if (!viewProfileClicked) {
      console.log('View profile link not found by text; trying by href...');
      await page.locator('a[href*="profile"], a[href*="mnjuser"]').first().click().catch(() => null);
    }
    await page.waitForTimeout(3000);

    // 6) Click Edit button (specific XPath first, then fall back)
    console.log('Looking for Edit button (XPath first)...');

    // Try your exact XPath target
    const editByXPath = page.locator(
      'xpath=//*[@id="root"]/div/div/span/div/div/div/div/div[1]/div[1]/div[1]/div/div/div/div[2]/div[1]/div/div[1]/em'
    );
    let editClicked = false;

    if (await editByXPath.count() > 0 && await editByXPath.isVisible()) {
      await editByXPath.click();
      editClicked = true;
      console.log('Clicked Edit using XPath.');
    } else {
      console.log('XPath Edit element not found or not visible, falling back to generic selectors...');
      const editSelectors = [
        'button:has-text("Edit")',
        'a:has-text("Edit")',
        'span:has-text("Edit")',
        '[title="Edit"]',
        'input[value="Edit"]',
        'button:has-text("Edit Profile")',
        'a:has-text("Edit Profile")',
      ];
      for (const sel of editSelectors) {
        const el = page.locator(sel).first();
        if (await el.count() > 0 && await el.isVisible()) {
          await el.click();
          editClicked = true;
          console.log('Clicked Edit using generic selector:', sel);
          break;
        }
      }
      if (!editClicked) {
        console.log('Edit not found by common selectors; trying generic Edit link.');
        await page
          .locator('a:has-text("Edit"), button:has-text("Edit")')
          .first()
          .click()
          .catch(() => null);
      }
    }
    await page.waitForTimeout(2000);

    // 7) Click Save button (scroll to #saveBasicDetailsBtn first)
    console.log('Looking for Save button (saveBasicDetailsBtn)...');

    // Try specific Save button by id, ensuring it is scrolled into view
    let saveClicked = false;
    const saveById = page.locator('#saveBasicDetailsBtn');
    if (await saveById.count() > 0 && await saveById.isVisible()) {
      await saveById.scrollIntoViewIfNeeded().catch(() => null);
      await saveById.click();
      saveClicked = true;
      console.log('Clicked Save using #saveBasicDetailsBtn.');
    } else {
      console.log('#saveBasicDetailsBtn not found or not visible, falling back to generic selectors...');
      const saveSelectors = [
        'button:has-text("Save")',
        'input[type="submit"][value="Save"]',
        'input[value="Save"]',
        'a:has-text("Save")',
        'span:has-text("Save")',
        '[title="Save"]',
        'button:has-text("Save Changes")',
      ];
      for (const sel of saveSelectors) {
        const el = page.locator(sel).first();
        if (await el.count() > 0 && await el.isVisible()) {
          await el.scrollIntoViewIfNeeded().catch(() => null);
          await el.click();
          saveClicked = true;
          console.log('Clicked Save using generic selector:', sel);
          break;
        }
      }
      if (!saveClicked) {
        console.log('Save button not found by common selectors.');
      }
    }

    console.log('Flow completed. Browser will stay open for 5 seconds.');
    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

run();
