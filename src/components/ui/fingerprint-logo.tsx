import type { SVGProps } from "react"

export function FingerprintLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="50" cy="50" r="45" stroke="#333" strokeWidth="2" fill="none" />
      <path
        d="M50 25C36.19 25 25 36.19 25 50C25 63.81 36.19 75 50 75"
        stroke="#00a1ae"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M50 35C41.72 35 35 41.72 35 50C35 58.28 41.72 65 50 65"
        stroke="#00a1ae"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M50 45C47.24 45 45 47.24 45 50C45 52.76 47.24 55 50 55"
        stroke="#00a1ae"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M60 50C60 44.48 55.52 40 50 40" stroke="#00a1ae" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 50C70 39.01 61.05 30 50 30" stroke="#00a1ae" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="65" r="3" fill="#e74c3c" />
      <circle cx="65" cy="75" r="3" fill="#e74c3c" />
    </svg>
  )
}

