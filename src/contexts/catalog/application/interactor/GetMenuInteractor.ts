import {GetMenuInput} from '@/contexts/catalog/application/port/in/GetMenuInput'
import type {CatalogGateway} from '../port/out/CatalogGateway'
import {ProductCatalog} from '../../model/ProductCatalog'
import {restaurantProducts} from '@/utils/restaurant-catalog'

export class GetMenuInteractor implements GetMenuInput {
    constructor(private readonly catalog: CatalogGateway) {
    }

    execute(request: GetMenuInput.Request): GetMenuInput.Response {
        if (request.typeId) {
            const restaurant = this.catalog.snapshot(request.typeId).restaurants.find(r => r.id === request.restaurantId)
            if (!restaurant) throw new Error('餐厅不存在')
            return new GetMenuInput.Response(restaurant.categories.map(c => c.name), [], restaurantProducts(restaurant).filter(p => !request.category || p.category === request.category))
        }
        return new GetMenuInput.Response(
            [...this.catalog.categories()], [...this.catalog.levels()],
            new ProductCatalog(this.catalog.products()).filter(request.category, request.levels)
                .map(product => ({
                    id: product.id,
                    name: product.name,
                    category: product.category,
                    level: product.level,
                    price: product.price
                })))
    }
}
