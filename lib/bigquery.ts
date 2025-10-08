import { BigQuery } from '@google-cloud/bigquery';

/**
 * Creates a BigQuery client instance with proper credentials handling
 * Works both locally (with keyFilename) and in production (with JSON credentials)
 */
export function createBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is not set');
  }

  // In production (Vercel), credentials will be a JSON string
  // In development, it will be a file path
  let bigqueryConfig: any = {
    projectId,
  };

  if (credentials) {
    try {
      // Try to parse as JSON (production)
      const credentialsObj = JSON.parse(credentials);
      
      // Fix the private key: replace literal \n with actual newlines
      if (credentialsObj.private_key) {
        credentialsObj.private_key = credentialsObj.private_key.replace(/\\n/g, '\n');
      }
      
      bigqueryConfig.credentials = credentialsObj;
      console.log('✅ Using BigQuery with JSON credentials');
    } catch {
      // If parsing fails, treat as file path (development)
      bigqueryConfig.keyFilename = credentials;
      console.log('✅ Using BigQuery with keyFilename:', credentials);
    }
  } else {
    console.warn('⚠️ No BigQuery credentials provided, using default credentials');
  }

  return new BigQuery(bigqueryConfig);
}
