export default function ShieldIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 20 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 0.5L1 4.5V10.5C1 16 4.6 21 10 22.5C15.4 21 19 16 19 10.5V4.5L10 0.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M6.5 11.5L8.5 13.5L13.5 8.5"
        stroke="rgba(91,141,239,0.75)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
