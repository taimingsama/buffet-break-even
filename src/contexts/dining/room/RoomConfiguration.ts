import type {RoomView} from '@/presentation/dining/RoomView'
import type {SaveRoomResultInput} from '../completion/public'
import {RoomInteractor} from './application/interactor/RoomInteractor'
import {UniRoomGateway} from './infrastructure/network/UniRoomGateway'
import {RoomPresenter} from './infrastructure/presentation/RoomPresenter'
import type {GetCatalogInput} from '@/contexts/catalog/public'
import type {ProductAppearanceProvider} from '@/presentation/dining/ProductAppearanceProvider'

export function createRoom(view: RoomView, save: SaveRoomResultInput, catalog: GetCatalogInput, appearance: ProductAppearanceProvider) {
    const products = catalog.execute({}).products.map(product => ({...product, ...appearance(product.id)}))
    return new RoomInteractor(new UniRoomGateway(new RoomPresenter(view, products), receipt => save.execute({receipt, collectReceipt: false})))
}
