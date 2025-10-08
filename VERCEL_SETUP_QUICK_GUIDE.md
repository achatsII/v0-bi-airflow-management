# Vercel Setup Quick Guide

## 🎯 Domain Configuration

### Production Domain
**Primary Domain:** `airflowmanagement.intelligenceindustrielle.com`

### Steps in Vercel Dashboard:
1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `airflowmanagement.intelligenceindustrielle.com`
4. Follow DNS configuration instructions
5. Set as **Primary Domain**

### Remove Old Aliases (if present):
- ❌ `v0-bi-airflow-management-i9lim7dvj-achatsiis-projects.vercel.app`
- ❌ `v0-bi-airflow-management-achatsiis-projects.vercel.app`
- ❌ `v0-bi-airflow-management.vercel.app`

Click the **⋮** menu next to each and select **Remove**

---

## 🔐 Environment Variables

### For Production Environment:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_ENVIRONMENT` | `prod` | Production |
| `NEXT_PUBLIC_APP_IDENTIFIER` | `airflow-management` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://airflowmanagement.intelligenceindustrielle.com` | Production |
| `NEXT_PUBLIC_REDIRECT_PATH` | `/callback` | Production |
| `GOOGLE_CLOUD_PROJECT_ID` | Your GCP project ID | Production |
| `GOOGLE_APPLICATION_CREDENTIALS` | JSON string from `ii-access.json` | Production |

### For QA/Preview Environment:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_ENVIRONMENT` | `qa` | Preview |
| `NEXT_PUBLIC_APP_IDENTIFIER` | `airflow-management` | Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://qa-airflowmanagement.intelligenceindustrielle.com` | Preview |
| `NEXT_PUBLIC_REDIRECT_PATH` | `/callback` | Preview |
| `GOOGLE_CLOUD_PROJECT_ID` | Your GCP project ID | Preview |
| `GOOGLE_APPLICATION_CREDENTIALS` | JSON string from `ii-access.json` | Preview |

---

## 📋 How to Get BigQuery Credentials String

### Option 1: Using Command Line
```bash
# On Windows PowerShell
Get-Content ii-access.json | ConvertTo-Json -Compress

# On Mac/Linux
cat ii-access.json | jq -c .
```

### Option 2: Manual
1. Open `ii-access.json` in a text editor
2. Copy all content
3. Remove all line breaks (make it one line)
4. Paste into Vercel as the value for `GOOGLE_APPLICATION_CREDENTIALS`

---

## ✅ Verification Steps

After setup:

1. **Check Deployment Logs**
   - Go to Deployments tab
   - Click on latest deployment
   - Check build logs for errors

2. **Test Production URL**
   - Visit: `https://airflowmanagement.intelligenceindustrielle.com`
   - Should redirect to login page
   - Check browser console for environment logs

3. **Verify Environment**
   - Open browser console
   - Look for: `🔧 Environment Configuration:`
   - Should show `environment: "prod"`

4. **Test Backend**
   - Login successfully
   - Check if clients list loads
   - Try adding/removing a report

---

## 🐛 Common Issues

### Issue: "Authentication error: Could not find the ii-access.json file"
**Solution:** `GOOGLE_APPLICATION_CREDENTIALS` is not set or invalid JSON

### Issue: "Failed to fetch clients from BigQuery"
**Solution:** Check that `GOOGLE_CLOUD_PROJECT_ID` is correct

### Issue: Login redirects to wrong URL
**Solution:** Verify `NEXT_PUBLIC_BASE_URL` matches your actual domain

### Issue: Environment shows as "dev" in production
**Solution:** Set `NEXT_PUBLIC_ENVIRONMENT=prod` in Production scope

---

## 🚀 Deployment Command

```bash
# Commit and push changes
git add .
git commit -m "feat: configure production deployment"
git push origin main

# Vercel will automatically deploy
```

---

## 📞 Need Help?

Check these files for more details:
- `ENV_SETUP.md` - Complete environment variable guide
- `DEPLOYMENT_CHANGES.md` - Summary of all changes made
- `lib/config.ts` - Configuration source code
