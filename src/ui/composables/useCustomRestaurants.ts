import {ref} from 'vue'
import {GetCatalogInput, EditCatalogInput} from '@/contexts/catalog/public'
import {cloneCatalog, type RestaurantMenu} from '@/utils/restaurant-catalog'
import {useRequired} from './useRequired'

/** Page-local editing state; all persistent changes go through Catalog's public Inputs. */
export function useCustomRestaurants() {
    const query = useRequired<GetCatalogInput>(GetCatalogInput.Token)
    const edit = useRequired<EditCatalogInput>(EditCatalogInput.Token)
    const restaurants = ref<RestaurantMenu[]>([])
    function read() {
        const catalog = query.execute({typeId:'custom'}).catalog
        if (!catalog) throw new Error('无法读取本地餐厅')
        return cloneCatalog(catalog)
    }
    function reload() {restaurants.value = read().restaurants}
    function saveRestaurant(restaurant: RestaurantMenu) {
        const catalog = read()
        const index = catalog.restaurants.findIndex(r => r.id === restaurant.id)
        if (index < 0) catalog.restaurants.push(cloneCatalog(restaurant))
        else catalog.restaurants[index] = cloneCatalog(restaurant)
        edit.execute({catalog})
        reload()
    }
    function deleteRestaurant(id: string) {
        const catalog = read()
        catalog.restaurants = catalog.restaurants.filter(r => r.id !== id)
        edit.execute({catalog})
        reload()
    }
    return {restaurants, read, reload, saveRestaurant, deleteRestaurant}
}
