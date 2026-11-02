export function contentSecurityPolicy(nonce: string, production: boolean) {
  return [
    "default-src 'self'", "base-uri 'self'", "form-action 'self'",
    "frame-ancestors 'none'", "object-src 'none'", "img-src 'self' data:",
    "font-src 'self'", "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    "connect-src 'self'", "manifest-src 'self'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
