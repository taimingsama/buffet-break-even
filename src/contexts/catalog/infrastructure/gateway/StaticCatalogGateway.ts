import {presetCatalog, restaurantTypes} from '@/data/restaurants'
import {validateCatalog, type DiningCatalog} from '@/utils/restaurant-catalog'
import type {CatalogGateway} from '../../application/port/out/CatalogGateway'
import {products, categories, diningLevels} from '@/data/catalog'

export class StaticCatalogGateway implements CatalogGateway {
    types() {return restaurantTypes.map(({id, name, emoji}) => ({id, name, emoji}))}
    snapshot(typeId: string): DiningCatalog {
        if (typeId !== 'custom') return presetCatalog(typeId)
        const saved = uni.getStorageSync('buffet-custom-catalog-v1')
        return saved ? validateCatalog(saved, true) : {typeId: 'custom', typeName: '自定义', restaurants: []}
    }
    save(catalog: DiningCatalog) {
        if (catalog.typeId !== 'custom') throw new Error('仅可编辑自定义菜单')
        uni.setStorageSync('buffet-custom-catalog-v1', validateCatalog(catalog, true))
    }
    products() {
        return products.map(({id, name, category, level, price}) => ({id, name, category, level, price}))
    }

    categories() {
        return [...categories]
    }

    levels() {
        return [...diningLevels]
    }
}
