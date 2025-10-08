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

  // In production (Vercel), credentials can be JSON string or base64
  // In development, it will be a file path
  if (credentials) {
    try {
      let credentialsObj;
      
      // Check if it's base64 encoded (no { at start)
      if (!credentials.trim().startsWith('{')) {
        console.log('🔍 Detected base64 encoded credentials, decoding...');
        const decoded = Buffer.from(credentials, 'base64').toString('utf8');
        credentialsObj = JSON.parse(decoded);
      } else {
        // Try to parse as JSON directly
        credentialsObj = JSON.parse(credentials);
        
        // Fix the private key: remove ALL newlines and reconstruct properly
        if (credentialsObj.private_key && typeof credentialsObj.private_key === 'string') {
          let key = credentialsObj.private_key;
          
          // Remove all whitespace and newlines
          key = key.replace(/\s+/g, '');
          
          // Reconstruct with proper format
          // Format: -----BEGIN PRIVATE KEY-----\n{base64}\n-----END PRIVATE KEY-----\n
          key = key
            .replace('-----BEGINPRIVATEKEY-----', '-----BEGIN PRIVATE KEY-----\n')
            .replace('-----ENDPRIVATEKEY-----', '\n-----END PRIVATE KEY-----\n');
          
          credentialsObj.private_key = key;
        }
      }
      
      console.log('✅ Using BigQuery with JSON credentials');
      console.log('📧 Service account:', credentialsObj.client_email);
      
      return new BigQuery({
        projectId,
        credentials: credentialsObj,
      });
      
    } catch (parseError) {
      console.error('❌ Failed to parse credentials JSON:', parseError);
      // If parsing fails, treat as file path (development)
      console.log('✅ Using BigQuery with keyFilename:', credentials);
      return new BigQuery({
        projectId,
        keyFilename: credentials,
      });
    }
  } else {
    console.warn('⚠️ No BigQuery credentials provided, using default credentials');
    return new BigQuery({ projectId });
  }
}
