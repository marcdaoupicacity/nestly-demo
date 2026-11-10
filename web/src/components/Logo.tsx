import { Link } from 'react-router-dom'
export default function Logo() {
  return <Link to="/" className="flex items-center gap-2 text-brand" aria-label="Nestly home">
    <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" aria-hidden>
      <path d="M4 15 16 5l12 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V13" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="16" cy="21" rx="4.5" ry="3" fill="currentColor" />
    </svg>
    <span className="hidden text-xl font-extrabold tracking-tight md:block">nestly</span>
  </Link>
}
