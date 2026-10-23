import types from './types.json'
import menu0 from './niuniu.json'
import menu1 from './daniu.json'
import menu2 from './yixu.json'
import menu3 from './bbq-garden.json'
import menu4 from './bbq-charcoal.json'
import menu5 from './hotpot-spicy.json'
import menu6 from './hotpot-clear.json'
import menu7 from './pizza-oven.json'
import menu8 from './pizza-cheese.json'
import {validateCatalog, type DiningCatalog} from '../../utils/restaurant-catalog'
export const restaurantTypes = types
const menus = [menu0,menu1,menu2,menu3,menu4,menu5,menu6,menu7,menu8]
export function presetCatalog(typeId: string): DiningCatalog {
 const type = types.find(t => t.id === typeId)
 if (!type || type.id === 'custom') throw new Error('请选择有效的预设餐厅种类')
 return validateCatalog({typeId: type.id, typeName: type.name, restaurants: type.restaurants.map(id => menus.find(m => m.id === id))})
}
