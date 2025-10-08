# Deployment Changes Summary

## ✅ What Was Fixed

### 1. **Centralized Configuration** (`lib/config.ts`)
- Added support for `prod`, `qa`, and `dev` environments
- Automatic environment detection based on `NEXT_PUBLIC_ENVIRONMENT`
- Centralized URLs for gateway, auth portal, and base URLs
- Fixed typo: `enviroment` → `environment`

### 2. **BigQuery Authentication** (`lib/bigquery.ts`)
- Created `createBigQueryClient()` helper function
- Supports both local development (file path) and production (JSON credentials)
- Automatically detects credential format
- Works seamlessly in Vercel deployment

### 3. **Updated All API Routes**
- `/api/clients/route.ts` - Uses centralized BigQuery client
- `/api/reports/route.ts` - Uses centralized BigQuery client
- `/api/clients/[id]/route.ts` - Uses centralized BigQuery client
- `/api/clients/[id]/reports/route.ts` - Uses centralized BigQuery client
- `/api/auth/exchange/route.ts` - Uses config for gateway URL
- `/api/auth/refresh/route.ts` - Uses config for gateway URL
- `/api/auth/logout/route.ts` - Uses config for auth portal and base URL

### 4. **Updated Frontend Pages**
- `app/login/page.tsx` - Uses centralized config
- `app/callback/page.tsx` - Uses centralized config

### 5. **Vercel Configuration**
- Created `vercel.json` with proper build settings
- Set default environment to `prod`

### 6. **Documentation**
- Created `ENV_SETUP.md` with complete environment variable guide
- Instructions for both production and QA environments

## 🚀 How to Deploy

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables

#### Production Environment:
```bash
NEXT_PUBLIC_ENVIRONMENT=prod
NEXT_PUBLIC_APP_IDENTIFIER=airflow-management
NEXT_PUBLIC_BASE_URL=https://airflowmanagement.intelligenceindustrielle.com
NEXT_PUBLIC_REDIRECT_PATH=/callback
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=<paste your ii-access.json content as single-line JSON>
```

#### Preview/QA Environment:
```bash
NEXT_PUBLIC_ENVIRONMENT=qa
NEXT_PUBLIC_APP_IDENTIFIER=airflow-management
NEXT_PUBLIC_BASE_URL=https://qa-airflowmanagement.intelligenceindustrielle.com
NEXT_PUBLIC_REDIRECT_PATH=/callback
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=<paste your ii-access.json content as single-line JSON>
```

### Step 2: Configure Domain in Vercel

1. Go to Settings → Domains
2. Add: `airflowmanagement.intelligenceindustrielle.com`
3. Configure DNS as instructed by Vercel
4. Remove old Vercel aliases if needed

### Step 3: Deploy

```bash
git add .
git commit -m "feat: centralized config and fixed production deployment"
git push origin main
```

## 🎯 Key Benefits

1. **Works in Production**: BigQuery authentication now works in Vercel
2. **Environment Separation**: Easy to distinguish between prod and QA
3. **Centralized Config**: All configuration in one place (`lib/config.ts`)
4. **Type Safety**: TypeScript support throughout
5. **Easy Maintenance**: Change URLs in one place, affects entire app
6. **Better Debugging**: Console logs show which environment is active

## 🔍 Testing Checklist

After deployment:

- [ ] Visit production URL: `https://airflowmanagement.intelligenceindustrielle.com`
- [ ] Check browser console for environment logs
- [ ] Test login flow
- [ ] Verify clients list loads from BigQuery
- [ ] Test creating/deleting reports
- [ ] Verify all API endpoints work
- [ ] Check that authentication redirects work correctly

## 📝 Notes

- The `GOOGLE_APPLICATION_CREDENTIALS` must be the full JSON content as a string
- Make sure to minify the JSON (remove line breaks) before pasting in Vercel
- The app will automatically use the correct gateway URLs based on environment
- Preview deployments will use QA environment if `NEXT_PUBLIC_ENVIRONMENT=qa` is set for Preview scope
