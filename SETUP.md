/*
  =============================================================================
  JEWELRY POS SYSTEM - INSTALLATION & DEPLOYMENT GUIDE
  =============================================================================
  
  Complete guide to installing, configuring, and deploying the Jewelry POS
  system on your own server or local machine.
  
  TABLE OF CONTENTS:
  1. Prerequisites
  2. Local Development Setup
  3. Database Configuration
  4. Environment Variables
  5. Running the Application
  6. Deployment (Vercel, Docker, VPS)
  7. Troubleshooting
  
  =============================================================================
*/

# Installation & Deployment Guide

## Prerequisites

### Required Software
- **Node.js**: v18.0 or higher (recommend v20+)
- **npm/pnpm**: Package manager (pnpm recommended for faster installs)
- **Git**: Version control
- **Supabase Account**: Free tier available at supabase.com
- **PostgreSQL** (if self-hosting): v13 or higher

### Recommended Tools
- **VS Code**: Code editor with TypeScript support
- **Docker**: For containerized deployment
- **GitHub**: For version control and CI/CD

---

## 1️⃣ Local Development Setup

### Step 1: Clone/Download Project

\`\`\`bash
# Clone from repository
git clone <your-repo-url>
cd jewelry-pos-system

# Or if you have a ZIP file
unzip jewelry-pos-system.zip
cd jewelry-pos-system
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
\`\`\`

### Step 3: Create Environment File

Create a `.env.local` file in the root directory:

\`\`\`bash
# Copy example file
cp .env.example .env.local

# Or create manually and add these variables:
\`\`\`

Add these environment variables (see section 4 for details):

\`\`\`
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For email/SMS notifications
SENDGRID_API_KEY=optional
TWILIO_ACCOUNT_SID=optional
TWILIO_AUTH_TOKEN=optional
TWILIO_PHONE_NUMBER=optional
\`\`\`

### Step 4: Run Development Server

\`\`\`bash
# Start the development server
pnpm dev

# Application will be available at http://localhost:3000
# API routes available at http://localhost:3000/api
\`\`\`

---

## 2️⃣ Database Configuration

### Option A: Using Supabase (Recommended for Cloud)

#### Create Supabase Project

1. Go to supabase.com and sign up/login
2. Click "New Project"
3. Select a region (choose closest to you)
4. Set a strong database password
5. Wait for project to initialize (2-3 minutes)

#### Get Connection Details

1. Go to Project Settings → Database
2. Copy the following:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key

#### Initialize Database Schema

\`\`\`bash
# Navigate to Supabase SQL Editor in dashboard
# Or use supabase-cli

# Install supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
\`\`\`

Or manually run SQL scripts:

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from `scripts/001_create_schema.sql`
4. Execute
5. Repeat for other scripts (002, 003, etc.)

### Option B: Self-Hosted PostgreSQL

#### Setup PostgreSQL

\`\`\`bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE jewelry_pos;
CREATE USER jewelry_user WITH PASSWORD 'strong_password';
ALTER ROLE jewelry_user SET client_encoding TO 'utf8';
ALTER ROLE jewelry_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE jewelry_user SET default_transaction_deferrable TO on;
ALTER ROLE jewelry_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE jewelry_pos TO jewelry_user;
\q
\`\`\`

#### Run Migrations

\`\`\`bash
# Using psql
psql -U jewelry_user -d jewelry_pos -f scripts/001_create_schema.sql
psql -U jewelry_user -d jewelry_pos -f scripts/002_create_triggers.sql
psql -U jewelry_user -d jewelry_pos -f scripts/003_seed_data.sql
\`\`\`

#### Get Connection String

\`\`\`
postgresql://jewelry_user:strong_password@localhost:5432/jewelry_pos
\`\`\`

---

## 3️⃣ Environment Variables

### Required Variables

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_key

# Security
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

### Optional Variables (For Features)

\`\`\`bash
# Email (SendGrid)
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourbusiness.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp (Twilio)
TWILIO_WHATSAPP_NUMBER=+1234567890

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=UA-your-analytics-id
\`\`\`

### Generate Secure Secrets

\`\`\`bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API key (if needed)
openssl rand -hex 32
\`\`\`

---

## 4️⃣ Running the Application

### Development Mode

\`\`\`bash
# Start dev server with hot reload
pnpm dev

# Server runs on http://localhost:3000
# API routes on http://localhost:3000/api

# Open in browser and test
# Default login: test@example.com / password123
\`\`\`

### Production Build

\`\`\`bash
# Build for production
pnpm build

# Start production server
pnpm start

# Server runs on http://localhost:3000
\`\`\`

### Testing the Application

\`\`\`bash
# After startup, test these endpoints:

# 1. Health check
curl http://localhost:3000/api/health

# 2. Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Get products
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

---

## 5️⃣ Deployment Options

### Option A: Vercel (Recommended - Zero Config)

#### Prerequisites
- GitHub account with repo
- Vercel account (free tier available)

#### Deploy Steps

1. Push code to GitHub
\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

2. Go to vercel.com and click "New Project"

3. Import your GitHub repository

4. Configure environment variables:
   - Add all variables from `.env.local`
   - Vercel will encrypt them

5. Click "Deploy"

6. After deployment, update callback URLs:
   - Supabase → Project Settings → Auth
   - Add `https://your-vercel-app.vercel.app` to "Authorized redirect URLs"

\`\`\`bash
# Update in code
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
\`\`\`

### Option B: Docker Deployment

#### Create Dockerfile

\`\`\`dockerfile
# dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
\`\`\`

#### Build and Run

\`\`\`bash
# Build image
docker build -t jewelry-pos .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="..." \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  -e SUPABASE_SERVICE_ROLE_KEY="..." \
  -e JWT_SECRET="..." \
  jewelry-pos

# Or use docker-compose
docker-compose up -d
\`\`\`

### Option C: Linux VPS (AWS, DigitalOcean, Linode)

#### Initial Setup

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Git
sudo apt install -y git

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
\`\`\`

#### Deploy Application

\`\`\`bash
# Clone repository
cd /home/user
git clone <your-repo-url>
cd jewelry-pos-system

# Install dependencies
pnpm install

# Create .env.local with production values
nano .env.local

# Build application
pnpm build

# Start with PM2
pm2 start pnpm --name "jewelry-pos" -- start
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
\`\`\`

#### Nginx Configuration

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

#### Setup SSL (Let's Encrypt)

\`\`\`bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
\`\`\`

---

## 6️⃣ Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check Supabase project is running
3. Verify network connectivity
4. Check firewall rules

\`\`\`bash
# Test connection
curl https://your-project.supabase.co
\`\`\`

### Issue: "JWT token expired"

**Solutions:**
1. Clear browser cookies
2. Logout and login again
3. Check `JWT_EXPIRY` setting in `.env.local`
4. Verify server time is correct

### Issue: "Database error: relation does not exist"

**Solutions:**
1. Run migration scripts again
2. Check all SQL scripts were executed
3. Verify you're connected to correct database
4. Check table names match in code

\`\`\`bash
# Verify tables exist (in Supabase SQL Editor)
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
\`\`\`

### Issue: "Port 3000 already in use"

**Solutions:**
\`\`\`bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
\`\`\`

### Issue: "Module not found" errors

**Solutions:**
\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm build
\`\`\`

---

## 📋 Deployment Checklist

Before going to production:

- [ ] All environment variables set correctly
- [ ] Database migrations executed
- [ ] SSL certificate configured
- [ ] Backups scheduled
- [ ] Admin user created
- [ ] Test data verified
- [ ] Error logging configured
- [ ] Monitoring/alerts set up
- [ ] User documentation prepared
- [ ] Backup/restore procedure documented

---

## 🔒 Security Hardening

### Production Checklist

\`\`\`bash
# 1. Update all dependencies
pnpm update

# 2. Remove dev dependencies from production
pnpm install --prod

# 3. Run security audit
pnpm audit

# 4. Enable CORS restrictions
NEXT_PUBLIC_ALLOWED_ORIGINS=your-domain.com

# 5. Set secure headers
# Configure in next.config.mjs:
# - X-Frame-Options
# - X-Content-Type-Options
# - Strict-Transport-Security

# 6. Database backups
# Schedule daily backups:
0 2 * * * /usr/local/bin/backup-db.sh

# 7. Monitor logs
# Setup log aggregation (Sentry, LogRocket, etc.)
\`\`\`

---

## 📞 Getting Help

1. Check error messages in browser console (F12)
2. Check server logs: `pm2 logs`
3. Review `.env.local` file
4. Test API endpoints with curl/Postman
5. Check Supabase dashboard for database issues

---

**Ready to deploy!** 🚀
*/
