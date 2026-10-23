import {restaurantProducts, type DiningCatalog} from '@/utils/restaurant-catalog'
import type {RoomView} from '@/presentation/dining/RoomView'
import type {RoomSnapshot} from '@/utils/room-protocol'
import {toReceiptView} from '@/presentation/receipt/toReceiptView'
import {toRoomDiningView} from '@/presentation/dining/toRoomDiningView'
import type {ProductView} from '@/presentation/dining/ProductView'

export class RoomPresenter {
    constructor(private readonly view: RoomView, private readonly products: readonly ProductView[]) {}
    present(snapshot: RoomSnapshot | null, memberId: string, status: RoomView.Model['status'], message: string, busy: boolean, historySaved: boolean, resumable = false, catalog?: DiningCatalog, restaurantId?: string) {
        if (snapshot && !catalog && !snapshot.receipt) snapshot = null
        const restaurant = catalog?.restaurants.find(r => r.id === restaurantId) || catalog?.restaurants[0]
        const products = restaurant ? restaurantProducts(restaurant).map(p => ({...p, emoji: p.emoji || '🍽️', gradient: 'linear-gradient(145deg,#ffe4c4,#f8cba0)'})) : this.products
        this.view.present({snapshot, memberId, status, message, busy, historySaved, resumable,
            dining: snapshot ? toRoomDiningView(snapshot, products, new Date().toISOString(), catalog, restaurant?.id) : null,
            receipt: snapshot?.receipt ? toReceiptView(snapshot.receipt) : null})
    }
}
