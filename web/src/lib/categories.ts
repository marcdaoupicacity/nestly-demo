import { Umbrella, TreePine, Mountain, Wheat, Waves, Home, Castle, Flame, type LucideIcon } from 'lucide-react'
import type { Category } from './types'
export const CATEGORIES: { id: Category; label: string; icon: LucideIcon }[] = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'beach', label: 'Beach', icon: Umbrella },
  { id: 'cabins', label: 'Cabins', icon: TreePine },
  { id: 'amazing-views', label: 'Amazing views', icon: Mountain },
  { id: 'countryside', label: 'Countryside', icon: Wheat },
  { id: 'lakefront', label: 'Lakefront', icon: Waves },
  { id: 'tiny-homes', label: 'Tiny homes', icon: Home },
  { id: 'mansions', label: 'Mansions', icon: Castle },
]
