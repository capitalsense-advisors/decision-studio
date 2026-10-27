export function BrandLogo() {
  return (
    <span className="brand-lockup" aria-hidden="true">
      <span className="brand-symbol">
        <svg viewBox="0 0 48 48" role="img">
          <defs>
            <linearGradient id="paisaan-ribbon" x1="10" y1="9" x2="35" y2="37" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fffdf6" />
              <stop offset="1" stopColor="#dce5ff" />
            </linearGradient>
            <linearGradient id="paisaan-sun" x1="27" y1="11" x2="35" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffd56a" />
              <stop offset="1" stopColor="#ff986c" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="15" className="brand-symbol-bg" />
          <path
            d="M14.5 35V13.5H25.2C31.8 13.5 35.5 17.1 35.5 22.2C35.5 27.4 31.6 30.7 25.2 30.7H20.7"
            fill="none"
            stroke="url(#paisaan-ribbon)"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="30.7" cy="17.3" r="4.15" fill="url(#paisaan-sun)" />
          <path d="M14.5 35L20.5 29" className="brand-symbol-cut" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-type">
        <strong>paisaan<span>.</span></strong>
        <small>by CapitalSense</small>
      </span>
    </span>
  );
}
