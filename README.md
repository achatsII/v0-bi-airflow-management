# [BI] Airflow Management

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/achatsiis-projects/v0-bi-airflow-management)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/U5uGkDFtRXK)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/achatsiis-projects/v0-bi-airflow-management](https://vercel.com/achatsiis-projects/v0-bi-airflow-management)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/U5uGkDFtRXK](https://v0.app/chat/projects/U5uGkDFtRXK)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Environment Configuration

### BigQuery Dataset Selection

The application automatically selects the appropriate BigQuery dataset based on the environment:

- **Production** (`NEXT_PUBLIC_ENVIRONMENT=prod`)
  - Uses: `Application_Airflow`
  - Configured in: `vercel.json`
  
- **Local Development** (default)
  - Uses: `Application_Airflow_QA`
  - Automatic when running `npm run dev`

### How It Works

The dataset is determined by the `BIGQUERY_DATASET` configuration in `lib/config.ts`:

```typescript
export const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET || 
  (isProduction ? 'Application_Airflow' : 'Application_Airflow_QA');
```

This ensures:
- ✅ **Production deployments** always use the production dataset
- ✅ **Local development** uses the QA dataset for safe testing
- ✅ **No risk** of affecting production data during development

### Custom Dataset Override

You can override the dataset by setting the `BIGQUERY_DATASET` environment variable:

```bash
BIGQUERY_DATASET=Application_Airflow_Custom npm run dev
```

### Benefits

1. **Immediate deletion** - Query-based inserts allow reports to be deleted immediately (no streaming buffer delay)
2. **Safe testing** - Local development uses QA dataset
3. **Production safety** - Prod dataset is isolated from local changes