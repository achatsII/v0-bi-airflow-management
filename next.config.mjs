/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_IDENTIFIER: process.env.APP_IDENTIFIER,
    NEXT_PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
    NEXT_PUBLIC_REDIRECT_PATH: process.env.REDIRECT_PATH || "/callback",
    NEXT_PUBLIC_AUTH_PORTAL_BASE: process.env.AUTH_PORTAL_BASE,
    NEXT_PUBLIC_ENVIRONMENT: process.env.ENVIRONMENT,
  },
}

export default nextConfig
