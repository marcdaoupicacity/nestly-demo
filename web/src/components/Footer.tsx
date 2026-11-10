export default function Footer() {
  const cols = { Support: ['Help Center', 'Safety information', 'Cancellation options'], Hosting: ['Nestly your home', 'Hosting resources', 'Community forum'], Nestly: ['Newsroom', 'Careers', 'Gift cards'] }
  return <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
    <div className="mx-auto grid max-w-[1760px] gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8 xl:px-20">
      {Object.entries(cols).map(([h, items]) => <div key={h}><h4 className="mb-3 text-sm font-semibold">{h}</h4><ul className="space-y-2 text-sm text-neutral-600">{items.map(i => <li key={i}><a href="#" className="hover:underline">{i}</a></li>)}</ul></div>)}
    </div>
    <div className="border-t border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">© {new Date().getFullYear()} Nestly, Inc. · Demo project · Privacy · Terms</div>
  </footer>
}
