import type {DiningCatalog} from '@/utils/restaurant-catalog'
import type {Product} from '../../../model/Product'

export interface CatalogGateway {
    snapshot(typeId: string): DiningCatalog
    save(catalog: DiningCatalog): void
    types(): {id: string; name: string; emoji: string}[]
    products(): Product[]

    categories(): string[]

    levels(): string[]
}
