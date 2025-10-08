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
  if (credentials) {
    try {
      // Try to parse as JSON (production)
      let credentialsObj = JSON.parse(credentials);
      
      // Fix the private key: ensure proper newline format
      if (credentialsObj.private_key && typeof credentialsObj.private_key === 'string') {
        let key = credentialsObj.private_key;
        
        // Log original format for debugging
        console.log('🔍 Original key length:', key.length);
        console.log('🔍 First 50 chars:', key.substring(0, 50));
        console.log('🔍 Has literal \\n:', key.includes('\\n'));
        console.log('🔍 Has actual newline:', key.includes('\n'));
        
        // Try all possible newline formats
        key = key
          .split('\\n').join('\n')      // Replace literal \n
          .split('\\\\n').join('\n')    // Replace double-escaped \\n
          .split('\r\n').join('\n')     // Normalize Windows newlines
          .split('\r').join('\n');      // Normalize old Mac newlines
        
        credentialsObj.private_key = key;
        
        console.log('🔍 After fix - First 50 chars:', key.substring(0, 50));
        console.log('🔍 After fix - Has newlines:', key.includes('\n'));
      }
      
      console.log('✅ Using BigQuery with JSON credentials');
      
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
