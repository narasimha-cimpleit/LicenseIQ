# LicenseIQ - Hostinger UI Deployment Guide
## Complete Visual Walkthrough Using Hostinger's Website Interface

This guide shows you **exactly where to click** in Hostinger's control panel (hPanel) to deploy your LicenseIQ application. Perfect for those who prefer using the web interface over command-line tools.

---

## 📋 Table of Contents

1. [Purchase VPS Through Hostinger Website](#1-purchase-vps-through-hostinger-website)
2. [Initial VPS Setup via hPanel](#2-initial-vps-setup-via-hpanel)
3. [Accessing Your VPS via Browser Terminal](#3-accessing-your-vps-via-browser-terminal)
4. [Installing Software via Browser Terminal](#4-installing-software-via-browser-terminal)
5. [Setting Up Domain DNS via hPanel](#5-setting-up-domain-dns-via-hpanel)
6. [Installing SSL Certificate via hPanel](#6-installing-ssl-certificate-via-hpanel)
7. [Managing Your VPS via hPanel](#7-managing-your-vps-via-hpanel)
8. [Monitoring & Troubleshooting](#8-monitoring--troubleshooting)

---

## 1. Purchase VPS Through Hostinger Website

### Step 1.1: Go to Hostinger VPS Page

1. Open your web browser
2. Go to: **https://www.hostinger.com/vps-hosting**
3. You'll see different VPS plans displayed

### Step 1.2: Choose Your VPS Plan

**Recommended Plans:**

| Plan | Price | RAM | Storage | CPU | Best For |
|------|-------|-----|---------|-----|----------|
| **KVM 1** | $4.99/mo | 4GB | 50GB NVMe | 1 vCPU | Testing/Small apps |
| **KVM 2** | $8.99/mo | 8GB | 100GB NVMe | 2 vCPU | **Production (Recommended)** |
| **KVM 4** | $12.99/mo | 16GB | 200GB NVMe | 4 vCPU | High traffic apps |

**For LicenseIQ, choose KVM 2 or higher**

1. Click the **"Add to Cart"** button on your chosen plan
2. Review the plan period (longer periods = bigger discount)
3. Click **"Checkout Now"**

### Step 1.3: Complete Purchase

1. **Create Account** (if new user):
   - Enter your email address
   - Create a password
   - Click "Create Account"

2. **Payment Information**:
   - Choose payment method (Credit Card, PayPal, etc.)
   - Enter payment details
   - Click **"Submit Secure Payment"**

3. **Confirmation**:
   - You'll receive confirmation email
   - VPS will appear in your account within 5-10 minutes

---

## 2. Initial VPS Setup via hPanel

### Step 2.1: Access hPanel Dashboard

1. Go to: **https://hpanel.hostinger.com**
2. **Login** with your Hostinger account credentials
3. You'll see your hPanel dashboard

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────┐
│ [🏠 Home] [🌐 Websites] [🔗 Domains] [📧 Email]    │
│ [💻 VPS] [💳 Billing] [🛍️ Marketplace]              │
└─────────────────────────────────────────────────────┘
```

### Step 2.2: Navigate to VPS Section

1. Click on **"VPS"** in the top navigation menu
2. You'll see your VPS plan (shows "Waiting for Setup" if new)
3. Click the **"Setup"** button

### Step 2.3: Configure VPS Settings

**You'll see a setup wizard with these options:**

#### **Section 1: Basic Information**

**Hostname:**
- Enter a name for your server
- Example: `licenseiq-production`
- This is just for identification in hPanel

**Server Location:**
- Click the dropdown menu
- Choose location closest to your users:
  - 🇺🇸 **USA (East Coast)** - Ashburn, Virginia
  - 🇺🇸 **USA (West Coast)** - Los Angeles, California
  - 🇬🇧 **Europe** - London, United Kingdom
  - 🇳🇱 **Europe** - Amsterdam, Netherlands
  - 🇸🇬 **Asia** - Singapore
  - 🇮🇳 **Asia** - India

#### **Section 2: Operating System**

**Two Options Shown:**

1. **"Plain OS" Tab** ⬅️ **Select This**
   - Click **"Ubuntu 22.04 64bit"** or **"Ubuntu 24.04 64bit"**
   - These are clean Linux installations
   - Best for full control

2. **"Applications" Tab**
   - Pre-installed software stacks
   - NOT recommended for LicenseIQ (we'll install manually)

**Selection:**
```
┌─────────────────────────────────────────────┐
│  ○ Plain OS    ● Applications               │
├─────────────────────────────────────────────┤
│  [✓] Ubuntu 22.04 64bit                     │
│  [ ] Ubuntu 24.04 64bit                     │
│  [ ] CentOS 7 64bit                         │
│  [ ] Debian 11 64bit                        │
│  [ ] AlmaLinux 8 64bit                      │
└─────────────────────────────────────────────┘
```
**Click on Ubuntu 22.04** (recommended for stability)

#### **Section 3: Root Password**

1. **Create a strong password:**
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Example: `LicenseIQ2024!Secure#`

2. **IMPORTANT: Save this password!**
   - Copy it to a password manager
   - You'll need it to access your server
   - Write it down somewhere safe

**Password Requirements:**
```
✓ Minimum 8 characters
✓ At least one uppercase letter
✓ At least one number
✓ At least one special character
```

### Step 2.4: Complete Setup

1. Review all your selections
2. Click the **"Finish Setup"** button at the bottom
3. **Wait for installation** (2-5 minutes)
   - You'll see a progress indicator
   - Status will change from "Setting up..." to "Active"

**Setup Progress Screen:**
```
╔══════════════════════════════════════════╗
║  Setting up your VPS...                  ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 65%             ║
║                                          ║
║  Installing Ubuntu 22.04...              ║
║  Expected time: 3 minutes                ║
╚══════════════════════════════════════════╝
```

### Step 2.5: Get Your VPS Details

**Once setup is complete:**

1. Your VPS status will show **"Active"** with a green dot
2. Click the **"Manage"** button next to your VPS
3. You'll see the **VPS Overview** page with important information:

```
┌────────────────── VPS Overview ──────────────────┐
│                                                   │
│  Status: ● Active                                │
│  IP Address: 123.45.67.89                        │
│  SSH Access: root@123.45.67.89                   │
│  SSH Port: 22                                    │
│  Operating System: Ubuntu 22.04 64bit            │
│                                                   │
│  [Browser Terminal] [Settings] [Snapshots]       │
└───────────────────────────────────────────────────┘
```

**📝 Write down:**
- ✅ IP Address: `_________________`
- ✅ Root Password: `_________________`
- ✅ SSH Port: `22`

---

## 3. Accessing Your VPS via Browser Terminal

### Step 3.1: Open Browser Terminal

**From VPS Overview Page:**

1. Find the **"Browser Terminal"** button
2. Click **"Browser Terminal"**
3. A new browser window/tab opens with a black terminal screen

**What you'll see:**
```
┌─────────────────────────────────────────────┐
│ Hostinger Browser Terminal                  │
├─────────────────────────────────────────────┤
│                                             │
│ Connecting to 123.45.67.89...               │
│ root@licenseiq-production:~#                │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**✅ You're now connected!** The terminal is ready for commands.

### Step 3.2: Understanding the Terminal

**Terminal Prompt Explained:**
```
root@licenseiq-production:~#
│    │                    │ │
│    │                    │ └─ Prompt symbol (waiting for command)
│    │                    └─── Current directory (~ = home)
│    └──────────────────────── Hostname
└───────────────────────────── Username (root = admin)
```

**How to Use:**
1. **Type or paste** commands
2. Press **Enter** to execute
3. **Wait** for command to complete
4. You'll see output, then prompt returns

**📝 Pro Tip:** Right-click to paste in Browser Terminal

---

## 4. Installing Software via Browser Terminal

Now that you have the terminal open, let's install everything needed for LicenseIQ.

### Step 4.1: Update System

**Copy and paste this command:**
```bash
apt update && apt upgrade -y
```

**Press Enter**

**What it does:**
- Updates package lists
- Upgrades installed software
- Takes 2-5 minutes

**You'll see scrolling text like:**
```
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease
Reading package lists... Done
Building dependency tree... Done
...
```

**Wait until you see the prompt (`root@...#`) again**

### Step 4.2: Install Essential Utilities

```bash
apt install -y curl wget git vim ufw build-essential
```

**What this installs:**
- `curl` - Download files from internet
- `wget` - Another download tool
- `git` - Version control (to get your code)
- `vim` - Text editor
- `ufw` - Firewall
- `build-essential` - Compilation tools

### Step 4.3: Install Node.js 20 (LTS)

**Run these commands one by one:**

**Command 1:** Download NodeSource setup script
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

**Command 2:** Install Node.js
```bash
apt install -y nodejs
```

**Command 3:** Verify installation
```bash
node --version
npm --version
```

**Expected output:**
```
v20.11.0
10.2.4
```

### Step 4.4: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

**What it does:**
- Installs PM2 globally
- PM2 keeps your app running 24/7
- Auto-restarts if it crashes

**Verify:**
```bash
pm2 --version
```

### Step 4.5: Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
```

**Takes 1-2 minutes**

**Start PostgreSQL:**
```bash
systemctl start postgresql
systemctl enable postgresql
```

**Verify it's running:**
```bash
systemctl status postgresql
```

**Should show:** `Active: active (running)` in green

**Press `q` to exit status view**

### Step 4.6: Install pgvector Extension

**Required for LicenseIQ's semantic search features**

**Step 1:** Install development files
```bash
apt install -y postgresql-server-dev-14
```

**Step 2:** Download and compile pgvector
```bash
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
make install
```

**Step 3:** Return to home directory
```bash
cd ~
```

### Step 4.7: Install Nginx

```bash
apt install -y nginx
```

**Start Nginx:**
```bash
systemctl start nginx
systemctl enable nginx
```

**Test:** Open your browser and go to `http://YOUR_VPS_IP`
- You should see the **"Welcome to nginx!"** page

---

## 4.8: Deploy Your LicenseIQ Application

Now let's deploy your actual React + Node.js + PostgreSQL application!

### Step 4.8.1: Create Application Directory

```bash
mkdir -p /var/www/licenseiq
cd /var/www/licenseiq
```

### Step 4.8.2: Get Your Application Code

**Option A: Clone from GitHub** (If you have your code in GitHub)

```bash
# If public repository:
git clone https://github.com/yourusername/licenseiq.git .

# If private repository, you'll need SSH key or Personal Access Token
```

**Option B: Upload Files via SFTP**

1. Download **FileZilla** (free SFTP client): https://filezilla-project.org
2. Open FileZilla
3. Fill in connection details:
   - **Host:** `sftp://YOUR_VPS_IP`
   - **Username:** `root`
   - **Password:** Your VPS root password
   - **Port:** `22`
4. Click **"Quickconnect"**
5. Navigate to `/var/www/licenseiq`
6. Drag and drop your local LicenseIQ folder to the server

**Option C: Upload via CloudPanel File Manager** (If available)

1. In CloudPanel, go to **Files** or **File Manager**
2. Navigate to `/var/www/licenseiq`
3. Use Upload button to upload your files

### Step 4.8.3: Set Up PostgreSQL Database

**Create database and user:**

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run these commands:
CREATE DATABASE licenseiq_db;
CREATE USER licenseiq_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE licenseiq_db TO licenseiq_user;

# For PostgreSQL 15+ (grant schema permissions):
\c licenseiq_db
GRANT ALL ON SCHEMA public TO licenseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO licenseiq_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO licenseiq_user;

# Enable pgvector extension:
CREATE EXTENSION IF NOT EXISTS vector;

# Verify extension:
\dx

# Exit PostgreSQL:
\q
```

### Step 4.8.4: Configure Environment Variables

**Create .env file:**

```bash
cd /var/www/licenseiq
nano .env
```

**Add these environment variables** (update with your values):

```env
# Database Configuration
DATABASE_URL=postgresql://licenseiq_user:YourSecurePassword123!@localhost:5432/licenseiq_db
PGHOST=localhost
PGPORT=5432
PGDATABASE=licenseiq_db
PGUSER=licenseiq_user
PGPASSWORD=YourSecurePassword123!

# Server Configuration
NODE_ENV=production
PORT=5000

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# AI Service API Keys (get these from your accounts)
OPENAI_API_KEY=sk-your-openai-key-here
GROQ_API_KEY=gsk_your-groq-key-here
HUGGINGFACE_API_KEY=hf_your-huggingface-key-here

# Application URL (update after domain setup)
APP_URL=https://qa.licenseiq.ai
```

**Save file:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

**Secure the file:**
```bash
chmod 600 .env
```

### Step 4.8.5: Install Application Dependencies

```bash
cd /var/www/licenseiq
npm install
```

**This will take 2-5 minutes** - installing all React and Node.js packages

### Step 4.8.6: Run Database Migrations

**Push your Drizzle schema to the database:**

```bash
npm run db:push
```

**If you get a data-loss warning:**
```bash
npm run db:push --force
```

**You should see:**
```
✓ pgvector extension enabled
✓ Database schema synced successfully
```

### Step 4.8.7: Build React Frontend

```bash
npm run build
```

**This compiles your React app for production** - takes 1-3 minutes

**You should see:**
```
vite v5.x.x building for production...
✓ built in X.XXs
```

### Step 4.8.8: Set Up PM2 Process Manager

**Create PM2 configuration:**

```bash
nano ecosystem.config.js
```

**Add this configuration:**

```javascript
module.exports = {
  apps: [{
    name: 'licenseiq',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/licenseiq',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/licenseiq/logs/pm2-error.log',
    out_file: '/var/www/licenseiq/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

**Create logs directory:**
```bash
mkdir -p /var/www/licenseiq/logs
```

**Start the application with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

**Copy and run the command that PM2 outputs** (starts with `sudo env...`)

**Check if running:**
```bash
pm2 status
pm2 logs licenseiq --lines 50
```

**You should see:**
```
┌─────┬─────────────┬─────────┬─────────┬─────────┐
│ id  │ name        │ mode    │ status  │ cpu     │
├─────┼─────────────┼─────────┼─────────┼─────────┤
│ 0   │ licenseiq   │ cluster │ online  │ 0%      │
│ 1   │ licenseiq   │ cluster │ online  │ 0%      │
└─────┴─────────────┴─────────┴─────────┴─────────┘
```

### Step 4.8.9: Configure Nginx for Your App

**Create Nginx configuration:**

```bash
nano /etc/nginx/sites-available/licenseiq
```

**Add this configuration** (replace `qa.licenseiq.ai` with your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name qa.licenseiq.ai;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Logs
    access_log /var/log/nginx/licenseiq_access.log;
    error_log /var/log/nginx/licenseiq_error.log;
}
```

**Save:** `Ctrl + X`, then `Y`, then `Enter`

**Enable the site:**
```bash
ln -s /etc/nginx/sites-available/licenseiq /etc/nginx/sites-enabled/
```

**Remove default site:**
```bash
rm /etc/nginx/sites-enabled/default
```

**Test Nginx configuration:**
```bash
nginx -t
```

**Should show:** `syntax is ok` and `test is successful`

**Restart Nginx:**
```bash
systemctl restart nginx
```

### Step 4.8.10: Set Up Firewall

```bash
# Allow SSH (IMPORTANT!)
ufw allow OpenSSH

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Enable firewall
ufw enable

# Check status
ufw status verbose
```

### Step 4.8.11: Test Your Application

**Test locally first:**
```bash
curl http://localhost:5000
```

**Should return HTML from your React app**

**Test via IP:**
- Open browser
- Go to: `http://YOUR_VPS_IP`
- You should see your LicenseIQ app!

---

## 5. Setting Up Domain DNS

**⚠️ IMPORTANT:** Domain DNS is managed at your **domain registrar**, NOT in CloudPanel or VPS settings!

### Step 5.1: Identify Your Control Panel

**Check which control panel you have:**

**Option A: Hostinger hPanel** (Default Hostinger interface)
- Login at: https://hpanel.hostinger.com
- Clean, modern blue/white interface
- ➡️ Follow **Section 5A** below

**Option B: CloudPanel/cPanel** (Server control panel)
- Shows "CloudPanel" or "cPanel" at top
- Manages sites/databases on your VPS
- ➡️ Follow **Section 5B** below

---

## 5A. DNS Setup for hPanel Users

### Step 5A.1: Access Domain Management

**From hPanel Dashboard:**

1. Click **"Domains"** in the top menu (NOT VPS!)
2. You'll see list of your domains
3. Find the domain you want to use for LicenseIQ
4. Click the **"Manage"** button next to it

**Domain Management Page Opens:**
```
┌──────────────────────────────────────────────┐
│  yourdomain.com                              │
├──────────────────────────────────────────────┤
│  [Overview] [DNS/Nameservers] [Email]       │
│  [Redirects] [Settings]                      │
└──────────────────────────────────────────────┘
```

### Step 5.2: Access DNS Settings

1. Click the **"DNS / Nameservers"** tab
2. Scroll down to **"DNS Records"** section

**You'll see existing records:**
```
┌─── DNS Records ──────────────────────────────┐
│  Type   Name    Points To          TTL       │
├──────────────────────────────────────────────┤
│  A      @       old-ip-address     14400     │
│  A      www     old-ip-address     14400     │
│  ...                                          │
└──────────────────────────────────────────────┘
```

### Step 5.3: Update A Records

**For Root Domain (@):**

1. Find the A record with Name = **"@"**
2. Click the **"Edit"** icon (pencil) next to it
3. **Update** the following:
   - **Type:** Keep as `A`
   - **Name:** Keep as `@`
   - **Points to:** Enter your **VPS IP address** (from Step 2.5)
   - **TTL:** Leave as `14400` (or `Automatic`)
4. Click **"Save"** or **"Update"**

**For www Subdomain:**

1. Find the A record with Name = **"www"**
2. Click the **"Edit"** icon
3. **Update** the following:
   - **Type:** `A`
   - **Name:** `www`
   - **Points to:** Your **VPS IP address**
   - **TTL:** `14400`
4. Click **"Save"**

**Visual Example:**
```
┌─── Edit DNS Record ───────────────────────┐
│                                            │
│  Type: [A ▼]                               │
│  Name: [@]                                 │
│  Points to: [123.45.67.89]                 │
│  TTL: [14400 ▼]                            │
│                                            │
│  [Cancel]  [Save Changes]                  │
└────────────────────────────────────────────┘
```

### Step 5.4: Add Subdomain (Optional)

**If you want `app.yourdomain.com`:**

1. Click **"Add Record"** button
2. Fill in:
   - **Type:** `A`
   - **Name:** `app` (or your preferred subdomain)
   - **Points to:** Your VPS IP
   - **TTL:** `14400`
3. Click **"Add Record"**

### Step 5.5: Wait for DNS Propagation

**Important:** DNS changes take time to spread globally

**Typical Timeline:**
- ⏱️ **5-15 minutes** - Starts working
- ⏱️ **1-4 hours** - Mostly propagated
- ⏱️ **24 hours** - Fully propagated worldwide

**Check Propagation:**
1. Go to: **https://www.whatsmydns.net**
2. Enter your domain name
3. Select "A" record type
4. Click "Search"
5. You should see your VPS IP address appearing globally

---

## 5B. DNS Setup for CloudPanel/cPanel Users ⬅️ **YOU ARE HERE!**

**⚠️ CRITICAL:** If you're using CloudPanel (like in your screenshot), DNS is **NOT managed in CloudPanel**! 

You must set DNS at your **domain registrar** (where you bought the domain).

### Step 5B.1: Find Where Your Domain is Registered

**Check your domain registrar:**

1. Go to: **https://who.is**
2. Enter your domain: `licenseiq.ai` (or `rao.licenseiq.ai`)
3. Look for **"Registrar"** in the results
4. Common registrars: Hostinger, GoDaddy, Namecheap, Cloudflare, etc.

### Step 5B.2: Access Domain DNS at Registrar

**If domain registered at Hostinger:**

1. Go to: **https://hpanel.hostinger.com** (different from your CloudPanel!)
2. Login with your Hostinger account
3. Click **"Domains"** in top menu
4. Find `licenseiq.ai`
5. Click **"Manage"**
6. Click **"DNS / Nameservers"** tab
7. ➡️ **Continue to Step 5B.3**

**If domain registered elsewhere (GoDaddy, Namecheap, etc.):**

1. Login to your domain registrar's website
2. Find "DNS Management" or "Domain Management"
3. Locate "DNS Records" or "Advanced DNS"
4. ➡️ **Continue to Step 5B.3**

### Step 5B.3: Add A Record for Your Domain

**You need to create an A record pointing to your VPS IP**

**Get your VPS IP address first:**
- From CloudPanel: Check your VPS dashboard
- From Hostinger hPanel: VPS → Manage → Overview
- Example: `123.45.67.89`

**Add A Record:**

1. Click **"Add Record"** or **"Add DNS Record"**
2. Fill in these details:

| Field | Value |
|-------|-------|
| **Type** | `A` |
| **Host/Name** | `@` (for main domain) or `rao` (for subdomain) |
| **Points to/Value** | Your VPS IP (e.g., `123.45.67.89`) |
| **TTL** | `14400` or `Automatic` |

3. Click **"Save"** or **"Add Record"**

**Example for subdomain `rao.licenseiq.ai`:**
```
┌─── Add DNS Record ────────────────────────┐
│                                            │
│  Type: [A ▼]                               │
│  Name: [rao]                               │
│  Value: [123.45.67.89]  ← Your VPS IP     │
│  TTL: [14400 ▼]                            │
│                                            │
│  [Cancel]  [Add Record]                    │
└────────────────────────────────────────────┘
```

### Step 5B.4: Wait for DNS Propagation

**DNS changes take 5 minutes to 24 hours to propagate**

**Check if it's working:**
1. Open Terminal/Command Prompt on your computer
2. Type: `ping rao.licenseiq.ai`
3. Should show your VPS IP address

**Or use online tool:**
1. Go to: **https://www.whatsmydns.net**
2. Enter: `rao.licenseiq.ai`
3. Select: `A`
4. Click **"Search"**
5. Should show your VPS IP globally

### Step 5B.5: Add Site to CloudPanel

**Once DNS is set, add the site in CloudPanel:**

1. In CloudPanel, go to **"Sites"** (or "Domains")
2. Click **"+ ADD SITE"** button
3. Fill in:
   - **Domain Name:** `rao.licenseiq.ai`
   - **Application/Type:** Select `Static` or `Node.js` (if available)
   - **User:** Select existing or create new
4. Click **"Create"** or **"Add"**

**CloudPanel will:**
- Create directory for your site
- Set up basic Nginx configuration
- Prepare SSL certificate capability

---

## 6. Installing SSL Certificate

**Choose the method based on your control panel:**

### 6A. SSL for CloudPanel Users ⬅️ **YOU ARE HERE!**

**CloudPanel has built-in SSL certificate management!**

**Step 1: Wait for DNS Propagation**
- Make sure your domain is pointing to VPS (check Step 5B.4)
- Wait at least 15-30 minutes after DNS changes

**Step 2: Add SSL in CloudPanel**

1. In CloudPanel, go to **"Sites"**
2. Find your site: `rao.licenseiq.ai`
3. Click **"Manage"** next to it
4. Look for **"SSL/TLS"** or **"Certificates"** section
5. Click **"Install SSL Certificate"** or **"Let's Encrypt"**
6. CloudPanel will automatically:
   - Verify domain ownership
   - Generate SSL certificate
   - Configure Nginx
   - Enable HTTPS redirect

**Step 3: Verify SSL**
- Visit: `https://rao.licenseiq.ai`
- You should see a padlock 🔒 in browser

**If CloudPanel doesn't have SSL UI, use Method 2:**

**Method 2: Install SSL via Terminal**

1. SSH into your VPS (via CloudPanel terminal or Browser Terminal)
2. Install Certbot:
```bash
apt install -y certbot python3-certbot-nginx
```

3. Generate certificate:
```bash
certbot --nginx -d rao.licenseiq.ai
```

4. Follow the prompts:
   - Enter your email
   - Agree to terms (type `A`)
   - Choose HTTPS redirect (option `2`)

**Auto-renewal is automatic** - Certbot sets up a cron job

---

### 6B. SSL for hPanel Users

**⚠️ IMPORTANT:** Wait for DNS to fully propagate before installing SSL!

### Method 1: Using Browser Terminal

**Step 1:** Go back to your Browser Terminal

**Step 2:** Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

**Step 3:** Obtain SSL Certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
**Replace `yourdomain.com` with your actual domain**

**Step 4:** Follow the prompts in terminal:

**Prompt 1: Email Address**
```
Enter email address (used for urgent renewal and security notices)
(Enter 'c' to cancel): 
```
**Type your email and press Enter**

**Prompt 2: Terms of Service**
```
Please read the Terms of Service at https://letsencrypt.org/documents/LE-SA-v1.3-September-21-2022.pdf
(A)gree/(C)ancel: 
```
**Type `A` and press Enter**

**Prompt 3: Share Email (Optional)**
```
Would you be willing to share your email address...
(Y)es/(N)o: 
```
**Type `N` and press Enter**

**Prompt 4: HTTPS Redirect**
```
Please choose whether or not to redirect HTTP traffic to HTTPS
1: No redirect
2: Redirect - Make all requests redirect to secure HTTPS access
Select the appropriate number [1-2] then [enter]:
```
**Type `2` and press Enter** ⬅️ **Recommended**

**Step 5:** Success Message
```
Congratulations! You have successfully enabled HTTPS on 
https://yourdomain.com and https://www.yourdomain.com
```

**✅ Your site is now secured with SSL!**

### Method 2: Using Hostinger's SSL Tool (Alternative)

**From hPanel:**

1. Go to **"Websites"** section
2. Find your domain
3. Click **"Manage"**
4. Scroll to **"Security"** section
5. Click **"SSL"**
6. Select **"Install SSL"**
7. Choose **"Let's Encrypt"** (free)
8. Follow on-screen prompts

**Note:** This method works best if you're hosting the website files directly on Hostinger, not on VPS.

---

## 7. Managing Your VPS via hPanel

### 7.1: VPS Dashboard Overview

**Access:** hPanel → VPS → Manage

**Dashboard Sections:**

```
┌────────────────────────────────────────────────┐
│  [Overview] [Operating System] [Settings]      │
│  [Security] [Snapshots] [Browser Terminal]     │
└────────────────────────────────────────────────┘
```

#### **Overview Tab**
Shows:
- ✅ Server status (Active/Inactive)
- 📊 Resource usage (CPU, RAM, Disk, Bandwidth)
- 📍 IP Address
- 🔐 SSH access details

#### **Operating System Tab**
Functions:
- 🔄 Change OS (reinstalls VPS - **destroys all data!**)
- 📋 View installed software
- 🔧 Access control panels (if installed)

#### **Settings Tab**
Configure:
- ⚙️ Server hostname
- 🌐 PTR record (reverse DNS)
- 🔌 Power controls (Reboot, Shutdown)

#### **Security Tab**
Manage:
- 🔥 Firewall rules
- 🔑 SSH keys
- 🛡️ IP blocking

#### **Snapshots Tab**
- 📸 Create backups of entire VPS
- ♻️ Restore from previous snapshots
- **Important:** Create snapshot before major changes!

### 7.2: Creating a Snapshot (Backup)

**Before making any major changes:**

1. Go to VPS → **Snapshots** tab
2. Click **"Create Snapshot"** button
3. Enter a description (e.g., "Before app deployment")
4. Click **"Create"**
5. Wait 5-10 minutes for snapshot to complete

**You can restore anytime:**
1. Go to Snapshots tab
2. Find your snapshot
3. Click **"Restore"**
4. Confirm restoration

**⚠️ Warning:** Restoring a snapshot overwrites current VPS state!

### 7.3: Firewall Configuration via hPanel

1. Go to VPS → **Security** → **Firewall**
2. Click **"Create firewall configuration"**
3. Name it: `LicenseIQ-Firewall`
4. Click **"Add Rule"** for each port:

**Rule 1: SSH**
- **Port:** `22`
- **Protocol:** `TCP`
- **Source:** `Anywhere` or your IP
- Click **"Add"**

**Rule 2: HTTP**
- **Port:** `80`
- **Protocol:** `TCP`
- **Source:** `Anywhere`
- Click **"Add"**

**Rule 3: HTTPS**
- **Port:** `443`
- **Protocol:** `TCP`
- **Source:** `Anywhere`
- Click **"Add"**

5. Click **"Save Configuration"**
6. Click **"Apply to VPS"**

### 7.4: Power Controls

**From Settings Tab:**

**Reboot Server:**
- Click **"Reboot"**
- Confirm action
- Server restarts in 1-2 minutes

**Shutdown Server:**
- Click **"Shutdown"**
- Confirm action
- Server powers off (billing continues!)

**Power On:**
- Click **"Power On"**
- Server boots up in 1-2 minutes

### 7.5: Viewing Resource Usage

**Real-time Monitoring:**

1. Go to VPS → **Overview** tab
2. Scroll to **"Resource Usage"** section

**You'll see graphs for:**
- 🖥️ **CPU Usage** - Percentage of CPU used
- 💾 **RAM Usage** - Memory consumption
- 💿 **Disk Usage** - Storage used/available
- 📶 **Bandwidth** - Network traffic

**Graphs show:**
- Last hour
- Last 24 hours
- Last 7 days

**⚠️ If resources are consistently high:**
- Consider upgrading to larger VPS plan
- Or optimize your application

---

## 8. Monitoring & Troubleshooting

### 8.1: Checking Application Status

**Via Browser Terminal:**

**Check if app is running:**
```bash
pm2 status
```

**Expected output:**
```
┌─────┬─────────────┬─────────┬─────────┬─────────┐
│ id  │ name        │ mode    │ status  │ cpu     │
├─────┼─────────────┼─────────┼─────────┼─────────┤
│ 0   │ licenseiq   │ cluster │ online  │ 0%      │
│ 1   │ licenseiq   │ cluster │ online  │ 0%      │
└─────┴─────────────┴─────────┴─────────┴─────────┘
```

**View logs:**
```bash
pm2 logs licenseiq --lines 50
```

**Restart app:**
```bash
pm2 restart licenseiq
```

### 8.2: Checking Database Status

```bash
systemctl status postgresql
```

**Should show:** `Active: active (running)`

**Connect to database:**
```bash
sudo -u postgres psql -d licenseiq_db
```

**List tables:**
```sql
\dt
```

**Exit database:**
```sql
\q
```

### 8.3: Checking Nginx Status

```bash
systemctl status nginx
```

**Test configuration:**
```bash
nginx -t
```

**Restart Nginx:**
```bash
systemctl restart nginx
```

**View error logs:**
```bash
tail -f /var/log/nginx/error.log
```

### 8.4: Common Issues & Solutions

#### **Issue: Can't Access Website**

**Check 1:** Is Nginx running?
```bash
systemctl status nginx
```
**If not running:**
```bash
systemctl start nginx
```

**Check 2:** Is your app running?
```bash
pm2 status
```
**If showing "stopped":**
```bash
pm2 restart licenseiq
```

**Check 3:** DNS propagated?
- Go to https://www.whatsmydns.net
- Check if your domain points to VPS IP

**Check 4:** Firewall blocking?
```bash
ufw status
```
**Should show ports 80, 443 allowed**

#### **Issue: 502 Bad Gateway**

**Cause:** App not running or crashed

**Solution:**
```bash
pm2 logs licenseiq
```
Look for errors in logs

**Restart app:**
```bash
pm2 restart licenseiq
```

#### **Issue: SSL Certificate Error**

**Check certificate status:**
```bash
certbot certificates
```

**Renew certificate:**
```bash
certbot renew
```

**Force renewal:**
```bash
certbot renew --force-renewal
```

### 8.5: Getting Help

**Hostinger Support:**

1. **From hPanel:**
   - Click **"Help"** (? icon) in top right
   - Choose **"Chat with Support"**
   - Describe your issue

2. **Kodee AI Assistant:**
   - Available in Help menu
   - Ask questions like:
     - "My VPS is using 100% CPU"
     - "How do I increase disk space?"
     - "Why is my website down?"

3. **Support Email:**
   - Email: success@hostinger.com
   - Include your VPS IP and issue description

**Available 24/7** in multiple languages

---

## 🎯 Quick Action Checklist

After following this guide, you should have:

- ✅ VPS purchased and set up
- ✅ Ubuntu 22.04 installed
- ✅ Node.js, PostgreSQL, Nginx installed
- ✅ Domain pointing to VPS
- ✅ SSL certificate installed
- ✅ Application deployed and running
- ✅ Database created and populated
- ✅ Firewall configured
- ✅ Monitoring set up

---

## 📚 Quick Reference - Where to Find Things in hPanel

| Task | Location in hPanel |
|------|-------------------|
| **VPS Setup** | VPS → Setup |
| **Browser Terminal** | VPS → Browser Terminal |
| **VPS Resources** | VPS → Overview → Resource Usage |
| **Power Controls** | VPS → Settings → Server Management |
| **Firewall** | VPS → Security → Firewall |
| **Snapshots** | VPS → Snapshots |
| **DNS Settings** | Domains → Select Domain → DNS/Nameservers |
| **Get Support** | Help (?) icon → Chat with Support |
| **Billing** | Billing → Subscriptions |

---

## 🆘 Emergency Procedures

### **App is Down - Quick Fix:**

1. Open **Browser Terminal**
2. Run: `pm2 restart licenseiq`
3. Check: `pm2 logs licenseiq`
4. If errors persist → Take snapshot → Contact support

### **Need to Rollback:**

1. Go to VPS → **Snapshots**
2. Find snapshot before issue
3. Click **"Restore"**
4. Confirm restoration
5. Wait 5-10 minutes

### **Server Won't Respond:**

1. Go to VPS → **Settings**
2. Click **"Reboot"**
3. Wait 2-3 minutes
4. Check if accessible

### **Out of Disk Space:**

1. Check usage in **Overview** tab
2. **Option 1:** Clean up files via Browser Terminal
3. **Option 2:** Upgrade VPS plan in **Billing**

---

## 🎉 You're All Set!

Your LicenseIQ application should now be:
- ✅ Live at `https://yourdomain.com`
- ✅ Running 24/7 with PM2
- ✅ Secured with SSL certificate
- ✅ Protected by firewall
- ✅ Backed up with snapshots

**Remember to:**
- Create regular snapshots before updates
- Monitor resource usage weekly
- Keep system and app updated
- Check logs if issues arise

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Platform:** Hostinger hPanel UI  
**Application:** LicenseIQ
