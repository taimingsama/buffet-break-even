import {restaurantProducts} from '@/utils/restaurant-catalog'
import {GetCatalogInput} from '../port/in/GetCatalogInput'
import type {CatalogGateway} from '../port/out/CatalogGateway'

/** 跨上下文需要完整菜品快照，与页面筛选菜单的查询分开。 */
export class GetCatalogInteractor implements GetCatalogInput {
    constructor(private readonly catalog: CatalogGateway) {}

    execute(_request: GetCatalogInput.Request): GetCatalogInput.Response {
        if (_request.typeId) {
            const snapshot = this.catalog.snapshot(_request.typeId)
            if (_request.restaurantId && !snapshot.restaurants.some(r => r.id === _request.restaurantId)) throw new Error('餐厅不存在')
            const restaurant = snapshot.restaurants.find(r => r.id === _request.restaurantId) || snapshot.restaurants[0]
            return new GetCatalogInput.Response(restaurant ? restaurantProducts(restaurant) : [], snapshot, this.catalog.types())
        }
        return new GetCatalogInput.Response(this.catalog.products().map(({id, name, category, level, price}) =>
            ({id, name, category, level, price})))
    }
}
