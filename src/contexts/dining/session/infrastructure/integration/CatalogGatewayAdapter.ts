import type {GetCatalogInput} from '@/contexts/catalog/public'
import type {CatalogGateway} from '../../application/port/out/CatalogGateway'

export class CatalogGatewayAdapter implements CatalogGateway {
    constructor(private readonly catalog: GetCatalogInput) {}

    snapshot(typeId: string) {
        const catalog = this.catalog.execute({typeId}).catalog
        if (!catalog) throw new Error('菜单不可用')
        return catalog
    }
    products() {
        return this.catalog.execute({}).products
            .map(({id, name, category, level, price}) => ({id, name, category, level, price}))
    }
}
