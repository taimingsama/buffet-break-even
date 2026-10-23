import type {DiningCatalog} from '@/utils/restaurant-catalog'
import type {StoredRound} from './StoredRound'

export interface StoredSession {
    catalog?: DiningCatalog
    restaurantId?: string
    drafts?: Record<string, {selected: Record<string, number>; rounds: StoredRound[]}>
    active: boolean
    id: string
    ticketPrice: number
    diningMode: string
    restaurant: string
    selected: Record<string, number>
    rounds: StoredRound[]
}
