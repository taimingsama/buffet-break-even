import type {CatalogGateway} from '../port/out/CatalogGateway'
import type {BeginSessionInput} from '../port/in/BeginSessionInput'
import type {DiningReader} from '../port/out/DiningReader'
import type {DiningWriter} from '../port/out/DiningWriter'
import type {DiningOutput} from '../port/out/DiningOutput'
import type {DiningIdGenerator} from '../port/out/DiningIdGenerator'

export class BeginSessionInteractor implements BeginSessionInput {
    constructor(
        private readonly reader: DiningReader,
        private readonly writer: DiningWriter,
        private readonly output: DiningOutput,
        private readonly ids: DiningIdGenerator,
        private readonly catalog?: CatalogGateway,
    ) {
    }

    execute(request: BeginSessionInput.Request): void {
        const session = this.reader.load()
        let catalog = request.typeId ? this.catalog?.snapshot?.(request.typeId) : undefined
        if (catalog?.typeId === 'custom') catalog = {...catalog, restaurants: catalog.restaurants.filter(r => r.products.length)}
        if (request.restaurantId) {
            const restaurant = catalog?.restaurants.find(r => r.id === request.restaurantId)
            if (!restaurant?.products.length) throw new Error('餐厅不存在或尚未添加菜品')
        }
        let next = session.begin(request.ticketPrice, request.diningMode, this.ids.createId(), request.replaceActive, catalog)
        if (request.restaurantId) next = next.selectRestaurant(request.restaurantId)
        this.writer.save(next)
        this.output.present(next)
    }
}
