# Environment Variables Setup for Vercel

## Required Environment Variables

### Production Environment (`airflowmanagement.intelligenceindustrielle.com`)

Set these in Vercel Dashboard → Settings → Environment Variables → Production:

```bash
# Environment
NEXT_PUBLIC_ENVIRONMENT=prod

# App Configuration
NEXT_PUBLIC_APP_IDENTIFIER=airflow-management
NEXT_PUBLIC_BASE_URL=https://airflowmanagement.intelligenceindustrielle.com
NEXT_PUBLIC_REDIRECT_PATH=/callback

# BigQuery Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

**Important:** For `GOOGLE_APPLICATION_CREDENTIALS`, paste the entire JSON content from your `ii-access.json` file as a single-line string.

### QA Environment (Preview Deployments)

Set these in Vercel Dashboard → Settings → Environment Variables → Preview:

```bash
# Environment
NEXT_PUBLIC_ENVIRONMENT=qa

# App Configuration
NEXT_PUBLIC_APP_IDENTIFIER=airflow-management
NEXT_PUBLIC_BASE_URL=https://qa-airflowmanagement.intelligenceindustrielle.com
NEXT_PUBLIC_REDIRECT_PATH=/callback

# BigQuery Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
```

## How to Get BigQuery Credentials JSON

1. Open your local `ii-access.json` file
2. Copy the entire content
3. Minify it to a single line (remove all line breaks)
4. Paste it as the value for `GOOGLE_APPLICATION_CREDENTIALS` in Vercel

Example:
```json
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

## Vercel Domain Setup

### Production
1. Go to Vercel Dashboard → Settings → Domains
2. Add domain: `airflowmanagement.intelligenceindustrielle.com`
3. Configure DNS with the provided records
4. Set as primary domain

### QA (Optional)
1. Add domain: `qa-airflowmanagement.intelligenceindustrielle.com`
2. Configure DNS
3. Use for preview deployments

## Testing

After setting up:

1. **Production:** Visit `https://airflowmanagement.intelligenceindustrielle.com`
2. **QA:** Deploy a preview branch and visit the preview URL
3. Check browser console for environment logs
4. Verify authentication flow works
5. Test BigQuery connections (clients/reports loading)

## Troubleshooting

### Backend not working
- Check that `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Verify it's valid JSON (use a JSON validator)
- Check Vercel function logs for errors

### Authentication not working
- Verify `NEXT_PUBLIC_BASE_URL` matches your actual domain
- Check that `NEXT_PUBLIC_APP_IDENTIFIER` matches your auth portal config
- Ensure redirect URIs are whitelisted in your auth portal

### Environment not detected
- Check that `NEXT_PUBLIC_ENVIRONMENT` is set (prod/qa/dev)
- Clear browser cache and redeploy
- Check browser console for environment logs
