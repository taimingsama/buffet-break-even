export interface MenuProduct {id: string; name: string; category: string; unit: string; price: number; emoji?: string}
export interface RestaurantMenu {id: string; name: string; categories: {id: string; name: string}[]; products: MenuProduct[]; valuationNote: string; sources: string[]}
export interface DiningCatalog {typeId: string; typeName: string; restaurants: RestaurantMenu[]}
export const cloneCatalog = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export function validateCatalog(value: unknown, allowEmpty = false): DiningCatalog {
    const error = () => {throw new Error('菜单格式无效：请检查ID、分类引用、份量和正数估值（最多10家餐厅／30分类／200商品）')}
    const obj = (v: any) => v && typeof v === 'object' && !Array.isArray(v)
    const text = (v: any, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
    const id = (v: any) => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v)
    const unique = (items: any[]) => items.every(obj) && new Set(items.map(x => x.id)).size === items.length
    const c = value as DiningCatalog
    if (!obj(c) || !id(c.typeId) || !text(c.typeName, 40) || !Array.isArray(c.restaurants) || c.restaurants.length > 10 || (!allowEmpty && !c.restaurants.length)) error()
    if (!unique(c.restaurants)) error()
    for (const r of c.restaurants) {
        if (!obj(r) || !id(r.id) || !text(r.name, 60) || !Array.isArray(r.categories) || r.categories.length > 30 || !Array.isArray(r.products) || r.products.length > 200) error()
        if ((!allowEmpty && (!r.categories.length || !r.products.length)) || !unique(r.categories) || !unique(r.products)) error()
        if (!text(r.valuationNote, 1000) || !Array.isArray(r.sources) || r.sources.length > 20 || r.sources.some(s => !text(s, 500))) error()
        for (const cat of r.categories) if (!obj(cat) || !id(cat.id) || !text(cat.name, 40)) error()
        for (const p of r.products) if (!obj(p) || !id(p.id) || !text(p.name, 80) || !text(p.unit, 60) || !r.categories.some(cat => cat.id === p.category)
            || typeof p.price !== 'number' || !Number.isFinite(p.price) || p.price <= 0 || p.price > 1000000 || Math.round(p.price * 100) <= 0 || (p.emoji !== undefined && !text(p.emoji, 12))) error()
    }
    const bytes = [...JSON.stringify(c)].reduce((n, ch) => {const code = ch.codePointAt(0)!; return n + (code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4)}, 0)
    if (bytes > 1024 * 1024) error()
    return {typeId: c.typeId, typeName: c.typeName.trim(), restaurants: c.restaurants.map(r => ({
        id: r.id, name: r.name.trim(), valuationNote: r.valuationNote.trim(), sources: r.sources.map(s => s.trim()),
        categories: r.categories.map(cat => ({id: cat.id, name: cat.name.trim()})),
        products: r.products.map(p => ({id: p.id, name: p.name.trim(), category: p.category, unit: p.unit.trim(), price: Math.round(p.price * 100) / 100, ...(p.emoji ? {emoji: p.emoji} : {})}))
    }))}
}
export function restaurantProducts(menu: {products: readonly MenuProduct[]; categories: readonly {id: string; name: string}[]}) {
    return menu.products.map(p => ({...p, level: '', category: menu.categories.find(c => c.id === p.category)?.name || p.category}))
}
