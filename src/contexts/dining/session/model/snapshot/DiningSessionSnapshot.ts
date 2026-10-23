import type {DiningCatalog} from '@/utils/restaurant-catalog'
import type {SavedRound} from './SavedRound'

export interface DiningSessionSnapshot {
    catalog?: DiningCatalog
    restaurantId?: string
    drafts?: Record<string, {selected: Record<string, number>; rounds: SavedRound[]}>
    active: boolean
    id: string
    ticketPrice: number
    diningMode: string
    restaurant: string
    selected: Record<string, number>
    rounds: SavedRound[]
}
