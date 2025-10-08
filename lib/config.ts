const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev"; // "prod", "qa", "dev"
 
console.log("environment:", environment);
 
const isProduction = environment === "prod";
const isQA = environment === "qa";
const isDevelopment = environment === "dev";
 
// Choose sensible defaults based on environment, but allow override via env vars
export const API_BASE_URL = isProduction
  ? 'https://gateway.intelligenceindustrielle.com/api/v1'
  : 'https://qa.gateway.intelligenceindustrielle.com/api/v1'
 
export const AUTH_PORTAL_URL = isProduction
  ? 'https://auth.gateway.intelligenceindustrielle.com'
  : 'https://qa.auth.gateway.intelligenceindustrielle.com'
 
export const LOGOUT_URL = `${AUTH_PORTAL_URL}/logout`;
 
export const APP_IDENTIFIER = process.env.NEXT_PUBLIC_APP_IDENTIFIER || "airflow-management";
 
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 
  (isProduction ? 'https://airflowmanagement.intelligenceindustrielle.com' : 
   isQA ? 'https://qa-airflowmanagement.intelligenceindustrielle.com' : 
   'http://localhost:3000');

export const REDIRECT_PATH = process.env.NEXT_PUBLIC_REDIRECT_PATH || "/callback";

export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';

// BigQuery Configuration
export const BIGQUERY_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
export const BIGQUERY_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
 
export { isProduction, isQA, isDevelopment, environment };

// Debug log (only client-side)
if (typeof window !== "undefined") {
  console.log("🔧 Environment Configuration:", {
    environment,
    isProduction,
    isQA,
    isDevelopment,
    API_BASE_URL,
    AUTH_PORTAL_URL,
    BASE_URL,
  });
}