export default function Logo({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-label="CampusHub logo">
      <defs>
        <linearGradient id="campushub-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#campushub-g)" />
      <polygon points="24,11 41,19.5 24,28 7,19.5" fill="#fff" />
      <path d="M14 24.5v6.5c0 2.8 4.5 5 10 5s10-2.2 10-5v-6.5L24 30z" fill="#fff" fillOpacity="0.85" />
      <path d="M38 21.5v9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="33" r="2.2" fill="#fff" />
    </svg>
  )
}
