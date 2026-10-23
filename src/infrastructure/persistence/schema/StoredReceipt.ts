import type {StoredLine} from './StoredLine'
import type {StoredRound} from './StoredRound'

export interface StoredReceipt {
    participants?: string[]
    restaurantId?: string; typeId?: string; typeName?: string;
    id: string
    restaurant: string
    date: string
    price: number
    value: number
    lines: StoredLine[]
    rounds: StoredRound[]
}
