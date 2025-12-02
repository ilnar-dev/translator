# Vercel Deployment Checklist

Quick reference checklist for deploying the Voice Translator app to Vercel.

## Pre-Deployment

- [x] **Persistent Storage**
  - [x] Replace `fs`/KV usage in `src/utils/sessionStorage.ts`
  - [x] Migrate session writes to Neon Postgres
  - [x] Verify CRUD operations locally

- [x] **Fix API Route Bug**
  - [x] Fix double slash in `src/app/api/session/route.ts` line 4
  - [x] Change `api.openai.com//v1` to `api.openai.com/v1`
  - [x] Test API route locally

- [ ] **Neon Database**
  - [ ] Create database via Vercel Storage or Neon dashboard
  - [ ] Run `psql "$DATABASE_URL" -f docs/neon-schema.sql`
  - [ ] Confirm `sessions` table exists

- [ ] **Code Quality**
  - [x] Run `npm run build` successfully
  - [x] Fix any TypeScript errors
  - [x] Fix any linting errors
  - [ ] Test application locally (`npm run dev`)

- [ ] **Git Repository**
  - [ ] All changes committed
  - [ ] Code pushed to remote repository
  - [ ] Repository is accessible (GitHub/GitLab/Bitbucket)

- [ ] **OpenAI API Key**
  - [ ] Have OpenAI API key ready
  - [ ] Key is valid and has credits

## Vercel Account Setup

- [ ] **Create Account**
  - [ ] Visit vercel.com and sign up
  - [ ] Choose sign-up method (GitHub recommended)
  - [ ] Complete profile setup
  - [ ] Verify email (if using email sign-up)

- [ ] **Install CLI (Optional)**
  - [ ] Run `npm install -g vercel`
  - [ ] Verify with `vercel --version`

## Deployment

- [ ] **Import Project**
  - [ ] Log in to Vercel Dashboard
  - [ ] Click "Add New" → "Project"
  - [ ] Connect Git provider
  - [ ] Select translator repository
  - [ ] Click "Import"

- [ ] **Configure Project**
  - [ ] Verify Framework: Next.js (auto-detected)
  - [ ] Verify Build Command: `next build`
  - [ ] Verify Output Directory: `.next`
  - [ ] Verify Install Command: `npm install`

- [ ] **Environment Variables**
  - [ ] Add `OPENAI_API_KEY`
  - [ ] Add `DATABASE_URL`
  - [ ] Set for all environments (Production, Preview, Development)
  - [ ] Save environment variables

- [ ] **Deploy**
  - [ ] Click "Deploy" button
  - [ ] Wait for build to complete
  - [ ] Note deployment URL

## Post-Deployment

- [ ] **Verify Deployment**
  - [ ] Application loads successfully
  - [ ] No console errors
  - [ ] Language selectors work
  - [ ] Recording functionality works
  - [ ] Translation API works

- [ ] **Test Functionality**
  - [ ] Test basic translation flow
  - [ ] Test API endpoints
  - [ ] Test error handling
  - [ ] Test on mobile device (optional)

- [ ] **Monitor**
  - [ ] Check deployment logs
  - [ ] Monitor API usage
  - [ ] Check for errors in Vercel Dashboard

## Optional Enhancements

- [ ] **Custom Domain**
  - [ ] Add custom domain in Vercel settings
  - [ ] Configure DNS records
  - [ ] Wait for DNS propagation

- [ ] **Analytics**
  - [ ] Enable Vercel Analytics (if needed)
  - [ ] Set up monitoring

- [ ] **Documentation**
  - [ ] Update README with deployment info
  - [ ] Document any custom configurations

---

## Quick Commands Reference

```bash
# Local testing
npm run dev          # Start development server
npm run build        # Test production build
npm run lint         # Check for linting errors

# Vercel CLI (if installed)
vercel login         # Login to Vercel
vercel link          # Link project to Vercel
vercel env add       # Add environment variable
vercel               # Deploy to preview
vercel --prod        # Deploy to production
```

---

**Status**: ⏳ Ready to start after pre-deployment fixes

