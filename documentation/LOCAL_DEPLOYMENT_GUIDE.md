# Local Deployment Guide - Licence IQ Research Platform

## Complete Step-by-Step Installation for Windows/Mac/Linux

This guide provides comprehensive instructions to deploy the Licence IQ Research Platform on your local laptop with 100% working guarantee when followed correctly.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Database Setup](#database-setup)
4. [Project Setup](#project-setup)
5. [Environment Configuration](#environment-configuration)
6. [Application Installation](#application-installation)
7. [Database Migration](#database-migration)
8. [Starting the Application](#starting-the-application)
9. [Verification & Testing](#verification--testing)
10. [Troubleshooting](#troubleshooting)
11. [Sample Credentials](#sample-credentials)

---

## 🔧 System Requirements

### Minimum Hardware Requirements
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 2GB free disk space
- **CPU:** Dual-core processor or better
- **Network:** Internet connection for initial setup

### Supported Operating Systems
- ✅ **Windows 10/11** (64-bit)
- ✅ **macOS 10.15** or later
- ✅ **Ubuntu 20.04+** / **Debian 11+** / **RHEL 8+**

---

## 📦 Prerequisites Installation

### Step 1: Install Node.js (Required)

**Windows:**
1. Download Node.js 20.x LTS from: https://nodejs.org/en/download/
2. Run the installer as Administrator
3. Follow installation wizard with default settings
4. Verify installation:
   ```cmd
   node --version
   npm --version
   ```
   Should show v20.x.x and 10.x.x respectively

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node@20

# Or download from https://nodejs.org/en/download/
# Verify installation
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Linux (RHEL/CentOS):**
```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install PostgreSQL Database

**Windows:**
1. Download PostgreSQL 15+ from: https://www.postgresql.org/download/windows/
2. Run installer as Administrator
3. During installation:
   - Set password for postgres user: `admin123` (remember this!)
   - Default port: `5432` (keep default)
   - Default locale: `[Default locale]` (keep default)
4. Verify installation:
   ```cmd
   psql --version
   ```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database user
createuser -s postgres
psql postgres -c "ALTER USER postgres PASSWORD 'admin123';"

# Verify installation
psql --version
```

**Linux (Ubuntu/Debian):**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'admin123';"

# Verify installation
psql --version
```

**Linux (RHEL/CentOS):**
```bash
# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'admin123';"

# Verify installation
psql --version
```

### Step 3: Install Git (If not installed)

**Windows:**
- Download from: https://git-scm.com/download/win
- Install with default settings

**macOS:**
```bash
# Usually pre-installed, or install with:
brew install git
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install -y git

# RHEL/CentOS
sudo dnf install -y git
```

---

## 🗄️ Database Setup

### Step 1: Create Database

**All Platforms:**
```bash
# Connect to PostgreSQL (enter password 'admin123' when prompted)
psql -U postgres -h localhost

# Create database
CREATE DATABASE licence_iq_platform;

# Create dedicated user (optional but recommended)
CREATE USER licence_iq_user WITH PASSWORD 'licence_iq_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE licence_iq_platform TO licence_iq_user;

# Exit
\q
```

### Step 2: Verify Database Connection
```bash
# Test connection with new database
psql -U licence_iq_user -d licence_iq_platform -h localhost
# Enter password: licence_iq_pass_2024
# You should see: licence_iq_platform=> 
\q
```

---

## 📁 Project Setup

### Step 1: Download/Clone Project

**Option A: From ZIP File**
1. Extract the project ZIP to a folder like: `C:\licence-iq-platform` (Windows) or `~/licence-iq-platform` (Mac/Linux)

**Option B: From Git Repository (if available)**
```bash
git clone <repository-url> licence-iq-platform
cd licence-iq-platform
```

### Step 2: Navigate to Project Directory
```bash
# Windows Command Prompt
cd C:\licence-iq-platform

# Mac/Linux Terminal
cd ~/licence-iq-platform

# Verify you're in the right directory
ls -la
# Should see: package.json, client/, server/, shared/, documentation/
```

---

## 🔐 Environment Configuration

### Step 1: Create Environment Variables File

Create a file named `.env` in the project root directory:

**Windows (using Command Prompt):**
```cmd
echo. > .env
notepad .env
```

**Mac/Linux:**
```bash
touch .env
nano .env
# or use your preferred editor: code .env, vim .env, etc.
```

### Step 2: Add Environment Variables

Copy and paste this exact content into the `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://licence_iq_user:licence_iq_pass_2024@localhost:5432/licence_iq_platform

# Database Components (for compatibility)
PGHOST=localhost
PGPORT=5432
PGUSER=licence_iq_user
PGPASSWORD=licence_iq_pass_2024
PGDATABASE=licence_iq_platform

# Session Security
SESSION_SECRET=your-super-secret-session-key-change-in-production-2024-licence-iq-platform

# AI Service Configuration (Groq API)
GROQ_API_KEY=your-groq-api-key-here

# Application Configuration
NODE_ENV=development
PORT=5000

# Application Domain (for development)
REPLIT_DOMAINS=localhost:5000
```

### Step 3: Get Groq API Key (Required for AI Features)

1. Visit: https://groq.com/
2. Sign up for a free account
3. Go to API section and create a new API key
4. Copy the API key and replace `your-groq-api-key-here` in the `.env` file

**Example:**
```env
GROQ_API_KEY=gsk_1234567890abcdefghijklmnopqrstuvwxyz
```

---

## 🚀 Application Installation

### Step 1: Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install 100+ packages, may take 3-5 minutes
# You should see: "added XXX packages, and audited XXX packages in XXs"
```

### Step 2: Verify Installation

```bash
# Check if key packages are installed
npm list express react typescript drizzle-orm

# Should show versions of these packages
```

---

## 🛠️ Database Migration

### Step 1: Create Database Schema

```bash
# Push database schema to PostgreSQL
npm run db:push

# You should see: "✅ Success! Database schema pushed successfully"
```

### Step 2: Verify Database Tables

```bash
# Connect to database and check tables
psql -U licence_iq_user -d licence_iq_platform -h localhost

# List tables
\dt

# Should show:
# - users
# - contracts  
# - contract_analysis
# - audit_trails
# - sessions

# Exit database
\q
```

---

## ▶️ Starting the Application

### Step 1: Start Development Server

```bash
# Start the full application (backend + frontend)
npm run dev

# You should see output like:
# > rest-express@1.0.0 dev
# > NODE_ENV=development tsx server/index.ts
# [timestamp] [express] serving on port 5000
```

### Step 2: Verify Server Start

The application should show:
```
✅ Database connected successfully
✅ Server running on port 5000
✅ Frontend available at http://localhost:5000
✅ API endpoints available at http://localhost:5000/api/*
```

---

## ✅ Verification & Testing

### Step 1: Access the Application

1. **Open your web browser**
2. **Navigate to:** http://localhost:5000
3. **You should see:** The Licence IQ login page with professional styling

### Step 2: Test User Registration

1. Click "Register" or "Sign Up"
2. Create a test account:
   - Username: `testadmin`
   - Email: `admin@test.com`
   - Password: `admin123`
   - Role: `admin`

### Step 3: Test Core Features

1. **Login** with your test account
2. **Upload a contract** (use any PDF file as a test)
3. **View dashboard** - should show analytics
4. **Check contract analysis** - verify AI processing works

### Step 4: Verify API Endpoints

Test these URLs in your browser or with curl:

```bash
# Health check
curl http://localhost:5000/api/user
# Should return 401 (expected, not logged in)

# After login via browser, test:
curl -b cookies.txt http://localhost:5000/api/analytics/metrics
# Should return JSON with contract statistics
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Database connection failed"
**Solution:**
```bash
# Check if PostgreSQL is running
# Windows:
services.msc # Look for postgresql service

# Mac:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql

# Restart PostgreSQL if needed:
# Windows: Restart service via services.msc
# Mac: brew services restart postgresql
# Linux: sudo systemctl restart postgresql
```

#### Issue 2: "Port 5000 already in use"
**Solution:**
```bash
# Find what's using port 5000
# Windows:
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :5000

# Kill the process or change port in .env:
PORT=3000
```

#### Issue 3: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

#### Issue 4: "Groq API errors"
**Solution:**
1. Verify your API key is correct in `.env`
2. Check your Groq account has free credits
3. Test API key:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.groq.com/openai/v1/models
   ```

#### Issue 5: "Database migration errors"
**Solution:**
```bash
# Reset database schema
npm run db:push --force

# If that fails, recreate database:
psql -U postgres -h localhost
DROP DATABASE licence_iq_platform;
CREATE DATABASE licence_iq_platform;
\q

# Then run migration again:
npm run db:push
```

### Getting Help

1. **Check the console output** for specific error messages
2. **Verify all environment variables** are set correctly in `.env`
3. **Ensure all services are running:** PostgreSQL, Node.js application
4. **Check firewall settings** - port 5000 should be accessible locally

---

## 👤 Sample Credentials

Once the application is running, you can create these test accounts or use the registration system:

### Test User Accounts
```
Owner Account:
- Username: owner_user
- Password: owner123
- Role: owner

Admin Account:  
- Username: admin_user
- Password: admin123
- Role: admin

Editor Account:
- Username: editor_user  
- Password: editor123
- Role: editor

Viewer Account:
- Username: viewer_user
- Password: viewer123  
- Role: viewer

Auditor Account:
- Username: auditor_user
- Password: auditor123
- Role: auditor
```

### Default Groq AI Configuration
- Model: `llama-3.1-8b-instant`
- Max tokens: 2000
- Temperature: 0.1 (for consistent results)

---

## 🎉 Success Confirmation

Your installation is successful when you can:

1. ✅ **Access** http://localhost:5000 without errors
2. ✅ **Register/Login** to user accounts  
3. ✅ **Upload** PDF contracts successfully
4. ✅ **View** dashboard with analytics
5. ✅ **Analyze** contracts using AI (Groq integration)
6. ✅ **Navigate** all pages without console errors

---

## 🔄 Stopping the Application

To stop the development server:

```bash
# Press Ctrl+C in the terminal where npm run dev is running
# Or close the terminal window
```

To restart:
```bash
npm run dev
```

---

## 📝 Production Notes

This guide sets up a **development environment**. For production deployment:

1. Change `NODE_ENV=production` in `.env`
2. Use stronger passwords and secrets
3. Configure proper SSL certificates
4. Set up reverse proxy (nginx/apache)
5. Use production-grade PostgreSQL setup
6. Configure proper backups

---

**🎯 This completes your local deployment setup. The application should now be running at http://localhost:5000 with all features functional!**