import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
type Toast = { id: number; msg: string; kind: 'success' | 'error' }
const ToastContext = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random(); setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
  }, [])
  return <ToastContext.Provider value={push}>{children}
    <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
      {toasts.map(t => <div key={t.id} className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-xl">
        {t.kind === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}{t.msg}</div>)}
    </div></ToastContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
