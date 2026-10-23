import {validateCatalog, type RestaurantMenu, type DiningCatalog} from '@/utils/restaurant-catalog'

/** A separate UI snapshot: previews never create, replace, or edit a dining session. */
export class MenuPreviewCache {
    static readonly Token = Symbol('MenuPreviewCache')
    private readonly key = 'buffet-menu-preview-v1'
    constructor(private readonly storage: Pick<typeof uni, 'getStorageSync' | 'setStorageSync'>) {}
    save(restaurant: RestaurantMenu): string {
        const catalog = validateCatalog({typeId:'preview',typeName:'菜单预览',restaurants:[{...restaurant,name:restaurant.name.trim() || '未命名餐厅'}]}, true)
        const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
        this.storage.setStorageSync(this.key, {id,catalog})
        return id
    }
    read(id: string): DiningCatalog {
        const saved = this.storage.getStorageSync(this.key)
        if (!saved || saved.id !== id) throw new Error('预览已失效，请返回重新打开')
        return validateCatalog(saved.catalog, true)
    }
}
