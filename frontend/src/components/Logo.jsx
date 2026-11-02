export default function Logo({ size = 36, light = false, className = '' }) {
  return (
    <img
      src="/logo-icon.png"
      alt="CampusHub logo"
      style={{ height: size, width: 'auto', filter: light ? 'invert(1)' : 'none' }}
      className={className}
    />
  )
}
