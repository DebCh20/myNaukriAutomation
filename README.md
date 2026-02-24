# Naukri automation

Node.js script that opens Naukri, **logs in with userid and password** (from env), then goes to **View profile** → **Edit** → **Save**.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install Playwright browsers (one-time)**

   ```bash
   npx playwright install chromium
   ```

3. **Set credentials**

   Copy `.env.example` to `.env` and set your Naukri login:

   ```bash
   copy .env.example .env
   ```

   Edit `.env`:

   ```
   NAUKRI_USERNAME=your_email_or_userid
   NAUKRI_PASSWORD=your_password
   ```

   Or use `NAUKRI_USERID` instead of `NAUKRI_USERNAME`. Set env vars in the shell:

   ```bash
   set NAUKRI_USERNAME=your_email
   set NAUKRI_PASSWORD=your_password
   npm start
   ```

## Run

```bash
npm start
```

## Flow

1. Opens `https://www.naukri.com/mnjuser/homepage`
2. If login form is shown, fills **userid** (username/email) and **password** and submits
3. If still on login, opens main site, clicks Login, fills form and submits
4. Goes to user homepage
5. Clicks **View profile** (or **My Profile**)
6. Clicks **Edit** (or **Edit Profile**)
7. Clicks **Save**

If the site’s HTML or button labels change, you may need to adjust the selectors in `index.js`.
# myNaukriAutomation
