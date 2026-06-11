// Icon raket (padel/tennis) — gaya garis mirip lucide, warna ikut `currentColor`.
export default function Racket({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} {...props}
    >
      {/* kepala raket (oval miring) */}
      <ellipse cx="9.5" cy="8.5" rx="6" ry="6.8" transform="rotate(-38 9.5 8.5)" />
      {/* senar */}
      <path d="M5.6 10.8 11 5" opacity="0.55" />
      <path d="M8 13.2 13.4 7.2" opacity="0.55" />
      {/* gagang */}
      <path d="M13.3 12.9 19.6 19.5" />
      {/* grip */}
      <path d="M17.9 21 21 17.9" />
    </svg>
  )
}
