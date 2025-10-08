const enviroment = process.env.NEXT_PUBLIC_ENVIRONMENT; // "prod", "qa", "dev"
 
console.log("enviroment:", enviroment);
 
const isProduction = enviroment === "prod";
const isQA = !isProduction;
 
 
// Choose sensible defaults based on environment, but allow override via env vars
export const API_BASE_URL = isProduction
  ? 'https://gateway.intelligenceindustrielle.com/api/v1'
  : 'https://qa.gateway.intelligenceindustrielle.com/api/v1'
 
 
export const AUTH_PORTAL_URL = isProduction
  ? 'https://auth.gateway.intelligenceindustrielle.com'
  : 'https://qa.auth.gateway.intelligenceindustrielle.com'
 
 
export const LOGOUT_URL = `${AUTH_PORTAL_URL}/logout`;
 
export const APP_IDENTIFIER = "form-genius";
 
export const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
 
export {isProduction};
// Debug log (only client-side)
if (typeof window !== "undefined") {
  console.log("🔧 Environment Configuration:", {
    enviroment,
    isProduction,
    isQA,
    API_BASE_URL,
    AUTH_PORTAL_URL,
  });
}