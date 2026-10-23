import type {RestaurantMenu} from '@/utils/restaurant-catalog'
import {MenuPreviewCache} from '@/ui/preview/MenuPreviewCache'
import {BuffetNavigation} from '@/ui/navigation/BuffetNavigation'
import {useRequired} from './useRequired'
import {runAction} from './runAction'

export function useRestaurantPreview() {
    const cache = useRequired<MenuPreviewCache>(MenuPreviewCache.Token)
    const navigation = useRequired<BuffetNavigation>(BuffetNavigation)
    return (restaurant: RestaurantMenu) => runAction(() => navigation.toMenuPreview(cache.save(restaurant)))
}
