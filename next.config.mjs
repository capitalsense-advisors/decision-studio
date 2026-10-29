const production = process.env.NODE_ENV === "production";
const deploymentId = process.env.DEPLOYMENT_VERSION || process.env.VERCEL_GIT_COMMIT_SHA;
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  production ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self'",
  "manifest-src 'self'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  ...(deploymentId ? { deploymentId } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : [])
      ]
    }];
  }
};

export default nextConfig;
