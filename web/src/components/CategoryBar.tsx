import { useSearchParams } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories'
export default function CategoryBar() {
  const [params, setParams] = useSearchParams(); const active = params.get('category')
  const pick = (id: string) => { const p = new URLSearchParams(params); if (active === id) p.delete('category'); else p.set('category', id); setParams(p) }
  return <div className="sticky top-[65px] z-30 border-b border-neutral-100 bg-white">
    <div className="no-scrollbar mx-auto flex max-w-[1760px] gap-8 overflow-x-auto px-4 pt-4 sm:px-8 xl:px-20">
      {CATEGORIES.map(({ id, label, icon: Icon }) => {
        const on = active === id
        return <button key={id} onClick={() => pick(id)} className={`flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 text-xs font-medium transition ${on ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900'}`}>
          <Icon className="h-6 w-6" strokeWidth={1.6} />{label}</button>
      })}
    </div>
  </div>
}
