import type {SavedLine} from './snapshot/SavedLine'
import type {SavedRound} from './snapshot/SavedRound'

export interface CollectedReceipt {
    participants?: string[]
    restaurantId?: string; typeId?: string; typeName?: string;
    id: string
    restaurant: string
    date: string
    price: number
    value: number
    lines: SavedLine[]
    rounds: SavedRound[]
}
