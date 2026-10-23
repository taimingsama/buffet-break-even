import type {DiningCatalog} from '@/utils/restaurant-catalog'
import type {Product} from '@/contexts/dining/session/model/snapshot/Product'

export interface CatalogGateway {
    snapshot?(typeId: string): DiningCatalog
    products(): Product[]
}
