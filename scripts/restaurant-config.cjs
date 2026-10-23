const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '../src/data/restaurants')
fs.mkdirSync(root, {recursive: true})
// These are estimates for explicit portions, not any brand's menu or prices.
const common = [
 ['蔬菜豆制品','白菜|油麦菜|生菜|茼蒿|菠菜|娃娃菜|冬瓜|白萝卜|土豆|莲藕|山药|南瓜|金针菇|香菇|杏鲍菇|木耳|豆腐|冻豆腐|豆皮|腐竹','100克',4,'🥬'],
 ['主食小食','乌冬面|荞麦面|拉面|米饭|玉米|年糕|红薯|南瓜饼|春卷|薯条','一小份约80克',5,'🍚'],
 ['饮品甜点','可乐|雪碧|乌龙茶|橙汁|酸梅汤|豆浆|香草冰淇淋|巧克力冰淇淋|西瓜|哈密瓜','饮品200毫升／甜点水果80克',4,'🍹']
]
const meats = '牛上脑|牛肩肉|牛胸腹肉|牛腱|牛舌|牛肉丸|羊肩肉|羊腿肉|猪梅花肉|猪五花肉|猪里脊|鸡腿肉|鸡胸肉|鸭胸肉|鲜虾|鱿鱼|巴沙鱼|青口贝|扇贝|虾滑'
const pizza = '玛格丽特披萨|意式香肠披萨|夏威夷披萨|培根蘑菇披萨|四种芝士披萨|金枪鱼披萨|鸡肉玉米披萨|牛肉洋葱披萨|海鲜披萨|素食披萨|榴莲披萨|照烧鸡肉披萨|黑椒牛肉披萨|菠菜芝士披萨|土豆培根披萨|蒜香蘑菇披萨|罗勒番茄披萨|烤肉披萨|青椒香肠披萨|苹果肉桂披萨'
const types = [
 {id:'custom',name:'自定义',emoji:'✏️',restaurants:[]},
 {id:'sukiyaki',name:'寿喜烧',emoji:'🍲',restaurants:['niuniu','daniu','yixu']},
 {id:'barbecue',name:'烤肉',emoji:'🥩',restaurants:['bbq-garden','bbq-charcoal']},
 {id:'hotpot',name:'火锅',emoji:'🥘',restaurants:['hotpot-spicy','hotpot-clear']},
 {id:'pizza',name:'披萨',emoji:'🍕',restaurants:['pizza-oven','pizza-cheese']}
]
const names = ['牛牛','大牛','一绪','庭院烤肉（示例）','炭火烤肉（示例）','川味火锅（示例）','清汤火锅（示例）','窑炉披萨（示例）','芝士披萨（示例）']
let index=0
for(const type of types) for(const id of type.restaurants) {
 const pizzaSides = [
  ['烤物小食','烤鸡翅|烤鸡腿|烤香肠|蒜香面包|芝士焗土豆|薯角|薯条|洋葱圈|炸鱼块|炸鸡块','一小份80克',7,'🍗'],
  ['沙拉蔬菜','凯撒沙拉|田园沙拉|金枪鱼沙拉|土豆沙拉|玉米沙拉|黄瓜沙拉|番茄沙拉|紫甘蓝沙拉|西兰花沙拉|鹰嘴豆沙拉','一小碗100克',6,'🥗'],
  ['意面浓汤','番茄意面|奶油意面|肉酱意面|青酱意面|海鲜意面|蘑菇意面|南瓜汤|蘑菇汤|罗宋汤|玉米浓汤','意面小份80克／汤一碗150毫升',8,'🍝'], common[2]
 ]
 const groups = [[type.id==='pizza'?'披萨':'肉类海鲜',type.id==='pizza'?pizza:meats,type.id==='pizza'?'一片约80克':'一份约80克',type.id==='pizza'?9:10,type.emoji], ...(type.id==='pizza'?pizzaSides:common)]
 const categories = groups.map((g,i)=>({id:`${id}-c${i+1}`,name:g[0]}))
 const products = groups.flatMap((g,i)=>g[1].split('|').map((name,j)=>({id:`${id}-p${i+1}-${j+1}`,name,category:categories[i].id,unit:g[0]==='饮品甜点'?(j<6?'一杯200毫升':'一份80克'):g[0]==='意面浓汤'?(j<6?'一小份80克':'一碗150毫升'):g[2],price:g[3]+(i===0?j%5:0),emoji:g[4]})))
 // Each sample can be maintained independently; include a few distinct dishes.
 const variants = {daniu:['安格斯牛上脑','谷饲牛肩肉','黑毛猪梅花肉'],yixu:['牛小排','牛板腱','鸡肉丸'],'bbq-garden':['蒜香牛肉','蜜汁猪颈肉','孜然羊肉'],'bbq-charcoal':['黑椒牛排','炭烤牛肋条','韩式辣猪肉'],'hotpot-spicy':['麻辣牛肉','黄喉','毛肚'],'hotpot-clear':['鲜切牛肉','鱼豆腐','墨鱼丸'],'pizza-cheese':['蓝纹芝士披萨','山羊芝士披萨','蜂蜜芝士披萨']}
 for (const [i,name] of (variants[id] || []).entries()) products[i].name=name
 const config={id,name:names[index++],categories,products,
  valuationNote:'人民币回本参考估值，按所列份量估算；不是品牌官方菜单或官方售价，具体供应以门店为准。',
  sources:['菜品名称与份量依据常见中式自助餐／披萨食用份量编写，未声称为对应品牌实际供应。','估值方法：普通蔬菜100克约4元，主食小份约5元，饮品200毫升约4元，肉类海鲜80克约10至14元，披萨80克约9至13元；用于演示，请按实际经验调整。']}
 fs.writeFileSync(path.join(root,id+'.json'),JSON.stringify(config,null,2)+'\n')
}
fs.writeFileSync(path.join(root,'types.json'),JSON.stringify(types,null,2)+'\n')
