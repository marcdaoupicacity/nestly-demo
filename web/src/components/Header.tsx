import Logo from './Logo'; import SearchBar from './SearchBar'; import UserMenu from './UserMenu'
import { useLocation } from 'react-router-dom'
export default function Header() {
  const { search } = useLocation()
  return <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-4 py-3 sm:px-8 xl:px-20">
      <div className="shrink-0 md:w-40"><Logo /></div>
      <div className="flex flex-1 justify-center"><SearchBar key={search} /></div>
      <div className="flex shrink-0 justify-end md:w-40"><UserMenu /></div>
    </div>
  </header>
}
