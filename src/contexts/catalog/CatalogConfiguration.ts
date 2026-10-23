import {EditCatalogInteractor} from './application/interactor/EditCatalogInteractor'
import {GetMenuInteractor} from './application/interactor/GetMenuInteractor'
import {GetCatalogInteractor} from './application/interactor/GetCatalogInteractor'
import {StaticCatalogGateway} from './infrastructure/gateway/StaticCatalogGateway'

export function createCatalog() {
    const catalog = new StaticCatalogGateway()
    return {editCatalog: new EditCatalogInteractor(catalog), getMenu: new GetMenuInteractor(catalog), getCatalog: new GetCatalogInteractor(catalog)}
}
