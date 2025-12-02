# Vercel Deployment Plan

This document outlines the complete plan to deploy the Voice Translator application to Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Vercel Account Registration](#vercel-account-registration)
3. [Pre-Deployment Fixes](#pre-deployment-fixes)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ Git repository initialized and code committed
- ✅ OpenAI API key ready
- ✅ GitHub, GitLab, or Bitbucket account (for Vercel integration)
- ✅ Node.js and npm installed locally

---

## Vercel Account Registration

### Step 1: Create Vercel Account

1. **Visit Vercel Website**
   - Go to [https://vercel.com](https://vercel.com)
   - Click **"Sign Up"** button (top right)

2. **Choose Sign-Up Method**
   - **Option A: GitHub** (Recommended)
     - Click "Continue with GitHub"
     - Authorize Vercel to access your GitHub account
     - This enables automatic deployments from your repository
   
   - **Option B: GitLab**
     - Click "Continue with GitLab"
     - Authorize Vercel to access your GitLab account
   
   - **Option C: Bitbucket**
     - Click "Continue with Bitbucket"
     - Authorize Vercel to access your Bitbucket account
   
   - **Option D: Email**
     - Enter your email address
     - Verify your email
     - Create a password
     - Note: Email sign-up requires manual repository connection later

3. **Complete Profile Setup**
   - Enter your name (optional)
   - Choose your team name (or use personal account)
   - Accept terms of service

4. **Verify Account**
   - Check your email for verification link (if using email sign-up)
   - Click the verification link

### Step 2: Install Vercel CLI (Optional but Recommended)

For easier management and local testing:

```bash
npm install -g vercel
```

Verify installation:
```bash
vercel --version
```

---

## Pre-Deployment Fixes

Before deploying, the following issues must be fixed:

### Fix 1: Persistent Storage

**Problem**: The app originally relied on local filesystem writes, which are incompatible with Vercel’s serverless runtime.

**Solution**: ✅ **COMPLETED** - Sessions now persist in Neon Postgres via `@neondatabase/serverless`, so data survives cold starts and scales across regions.

**Status**: ✅ **FIXED** - The app reads/writes sessions through Postgres and includes a cleanup helper for expired rows.

**Files modified**:
- `src/utils/sessionStorage.ts` - Migrated to Neon Postgres queries
- `src/app/api/translate/route.ts` - Continues to use async session helpers
- `src/app/api/session/[sessionId]/route.ts` - Uses async helpers with Postgres
- `src/app/api/session/cleanup/route.ts` - Calls SQL-based cleanup
- `package.json` - Replaced `@vercel/kv` with `@neondatabase/serverless`

### Fix 2: API Route Bug

**Problem**: Double slash in OpenAI API URL in `src/app/api/session/route.ts` line 4.

**Current**: `"https://api.openai.com//v1/realtime/transcription_sessions"`
**Should be**: `"https://api.openai.com/v1/realtime/transcription_sessions"`

**Status**: ✅ **FIXED** - URL corrected and lint clean

**Files modified**:
- `src/app/api/session/route.ts`

### Fix 3: Environment Variables

**Problem**: The app requires `OPENAI_API_KEY` and a Neon `DATABASE_URL`.

**Status**: ✅ **READY** - Will be configured during deployment

**Required Environment Variables**:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATABASE_URL` - Neon Postgres connection string

---

## Deployment Steps

### Step 0: Set Up Neon Postgres (Required Before Deployment)

Before deploying, you need a Postgres database:

1. **Provision Neon Postgres**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to **Storage** → **Postgres**
   - Click **"Create Database"** (or link an existing Neon project)
   - Name it (e.g., `translator-sessions`) and create it

2. **Get Connection String**
   - Open the Postgres resource → **Connect**
   - Copy the `DATABASE_URL` (ensure it has `sslmode=require`)

3. **Create Schema**
   - On your machine run:
     ```bash
     psql "$DATABASE_URL" -f docs/neon-schema.sql
     ```
   - This creates the `sessions` table required by the app

### Method 1: Deploy via Vercel Dashboard (Recommended for First Deployment)

1. **Prepare Your Repository**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"Add New..."** → **"Project"**
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Vercel if prompted
   - Find and select your `translator` repository
   - Click **"Import"**

3. **Configure Project Settings**
   - **Framework Preset**: Should auto-detect as "Next.js"
   - **Root Directory**: Leave as `./` (root)
   - **Build Command**: Should auto-fill as `next build`
   - **Output Directory**: Should auto-fill as `.next`
   - **Install Command**: Should auto-fill as `npm install`

4. **Add Environment Variables**
   - Scroll to **"Environment Variables"** section
   - Click **"Add"** or **"Add Another"**
   - Add the following variables (one at a time):
     - **Name**: `OPENAI_API_KEY`
       - **Value**: Your OpenAI API key (paste it here)
       - **Environment**: Select all (Production, Preview, Development)
     - **Name**: `DATABASE_URL`
       - **Value**: Neon Postgres connection string (from Step 0)
       - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"** after adding each variable

5. **Deploy**
   - Review all settings
   - Click **"Deploy"** button
   - Wait for build to complete (usually 2-5 minutes)

### Method 2: Deploy via Vercel CLI

1. **Login to Vercel**
   ```bash
   vercel login
   ```
   - Follow the prompts to authenticate

2. **Link Project**
   ```bash
   cd /Users/ilnar/Projects/personal/translator
   vercel link
   ```
   - Choose your scope (personal or team)
   - Select or create a project name
   - Confirm settings

3. **Set Environment Variables**
   ```bash
   # Add OpenAI API key
   vercel env add OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   # Select environments: Production, Preview, Development
   
   # Add Neon Postgres connection string (from Step 0 above)
   vercel env add DATABASE_URL
   # Paste the DATABASE_URL when prompted
   # Select environments: Production, Preview, Development
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```
   - For preview deployment: `vercel` (without `--prod`)

---

## Post-Deployment Configuration

### 1. Verify Deployment

After deployment completes:
- Vercel will provide a deployment URL (e.g., `translator-xyz.vercel.app`)
- Click the URL to open your deployed app
- Test the application functionality

### 2. Custom Domain (Optional)

If you want to use a custom domain:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your domain (e.g., `translator.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

### 3. Monitor Deployments

- View deployment logs in Vercel Dashboard
- Check **Deployments** tab for build status
- Review **Analytics** for usage metrics (if enabled)

---

## Verification

### Checklist

After deployment, verify:

- [ ] Application loads without errors
- [ ] Language selection dropdowns work
- [ ] Recording button is enabled when languages are selected
- [ ] Recording starts successfully (browser permissions)
- [ ] Translation API calls work (check browser console)
- [ ] No console errors in browser DevTools
- [ ] Environment variables are set correctly
- [ ] API routes respond correctly

### Test Scenarios

1. **Basic Translation Flow**
   - Select source language: English
   - Select target language: Finnish
   - Click microphone button
   - Grant microphone permissions
   - Speak a test phrase
   - Verify translation appears

2. **API Endpoints**
   - Test `/api/session` (POST) - should create session
   - Test `/api/translate` (POST) - should translate text
   - Test `/api/session/[sessionId]` (GET) - should retrieve session

3. **Error Handling**
   - Test with missing API key (should show error)
   - Test with invalid language selection
   - Test network error scenarios

---

## Troubleshooting

### Common Issues

#### Issue 1: Build Fails
**Symptoms**: Deployment fails during build phase
**Solutions**:
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check for TypeScript errors: `npm run build` locally

#### Issue 2: Environment Variables Not Working
**Symptoms**: API calls fail with authentication errors
**Solutions**:
- Verify `OPENAI_API_KEY` is set in Vercel Dashboard
- Ensure environment variable is added to all environments
- Redeploy after adding environment variables
- Check API route logs in Vercel Dashboard

#### Issue 3: Database Connection Errors
**Symptoms**: Errors about Postgres connections or missing tables
**Solutions**:
- Verify `DATABASE_URL` is configured for every environment
- Confirm the Neon database allows connections from Vercel
- Re-run `psql "$DATABASE_URL" -f docs/neon-schema.sql` to ensure the `sessions` table exists
- Review Vercel function logs for the exact error message

#### Issue 4: API Routes Return 500 Errors
**Symptoms**: API endpoints return server errors
**Solutions**:
- Check Vercel Function logs in Dashboard
- Verify OpenAI API key is valid
- Check network requests in browser DevTools
- Review server-side console logs

#### Issue 5: CORS Issues
**Symptoms**: Browser blocks API requests
**Solutions**:
- Vercel handles CORS automatically for API routes
- If issues persist, check Next.js API route configuration
- Verify request headers are correct

### Getting Help

- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [https://vercel.com/support](https://vercel.com/support)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Community**: [https://github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

## Post-Deployment Maintenance

### Regular Tasks

1. **Monitor Usage**
   - Check Vercel Dashboard for usage metrics
   - Monitor OpenAI API usage and costs
   - Review error logs regularly

2. **Update Dependencies**
   - Keep Next.js and dependencies updated
   - Run `npm audit` to check for security vulnerabilities
   - Test updates in preview deployments before production

3. **Backup Configuration**
   - Export environment variables (keep secure)
   - Document any custom configurations
   - Keep deployment settings documented

### Scaling Considerations

For personal use, Vercel's free tier should be sufficient:
- **Hobby Plan (Free)**:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Serverless functions included
  - Perfect for personal projects

If you need more:
- **Pro Plan**: $20/month
  - More bandwidth
  - Team collaboration
  - Advanced analytics

---

## Next Steps After Deployment

1. ✅ Fix pre-deployment issues (file system storage, API bug)
2. ✅ Create Vercel account
3. ✅ Deploy application
4. ✅ Test all functionality
5. ✅ Set up monitoring (optional)
6. ✅ Configure custom domain (optional)

---

## Notes

- **Session Storage**: Currently uses file system which won't work on Vercel. Must be replaced with in-memory storage or a database before deployment.
- **API Key Security**: Never commit API keys to Git. Always use environment variables.
- **Build Time**: First deployment may take longer (3-5 minutes). Subsequent deployments are faster.
- **Preview Deployments**: Every push to a branch creates a preview deployment URL for testing.

---

**Last Updated**: [Current Date]
**Status**: Ready for deployment after pre-deployment fixes are completed
